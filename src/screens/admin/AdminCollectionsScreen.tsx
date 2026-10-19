import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { apiRequest, getUserSession } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';
import { buildReceiptHtml, printOrShareReceipt, ReceiptData } from '../../utils/receiptGenerator';

interface AdminCollectionsProps {
  lang?: MobileLanguage;
  sangamName?: string;
  sangamSlogan?: string;
}

export const AdminCollectionsScreen: React.FC<AdminCollectionsProps> = ({
  lang = 'ta',
  sangamName: propSangamName,
  sangamSlogan: propSangamSlogan
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Collection Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async (configId?: string) => {
    try {
      setLoading(true);
      const url = configId ? `/collections/matrix?configId=${configId}` : '/collections/matrix';
      const res = await apiRequest(url);
      if (res.success && res.data) {
        setMatrixData(res.data);
        if (res.data.cycles) {
          setCycles(res.data.cycles);
        }
        if (res.data.activeConfig) {
          setSelectedCycleId(res.data.activeConfig.id);
        }
      }
    } catch (e) {
      // offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatrix(selectedCycleId || undefined);
  };

  const handleCycleChange = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    loadMatrix(cycleId);
  };

  const handleCellPress = (row: any, cell: any) => {
    if (cell.status === 'N/A') return;

    if (cell.status === 'PAID') {
      // Show receipt
      fetchAndShowReceipt(row, cell);
      return;
    }

    // Open Collect Payment Modal
    setSelectedRow(row);
    setSelectedCell(cell);
    setAmountPaid(String(cell.balanceAmount || cell.expectedAmount || 500));
    setPaymentMode('UPI');
    setReferenceNumber('');
    setRemarks('');
    setShowPaymentModal(true);
  };

  const fetchAndShowReceipt = async (row: any, cell: any) => {
    try {
      const session = await getUserSession();
      const sangamName = session?.sangamName || propSangamName || 'Oor Nithi Sangam';
      const sangamSlogan = session?.slogan || propSangamSlogan;

      let rData: ReceiptData = {
        receiptNumber: 'REC-' + (cell.collectionId ? cell.collectionId.substring(0, 8).toUpperCase() : Date.now()),
        sangamName,
        sangamSlogan,
        memberName: row.memberName,
        memberCode: row.memberCode,
        monthName: cell.monthName,
        year: cell.year,
        amountPaid: Number(cell.paidAmount || cell.expectedAmount || 500),
        expectedAmount: cell.expectedAmount,
        paymentMode: 'CASH',
        paymentDate: new Date(),
        collectedBy: 'Admin'
      };

      if (cell.collectionId) {
        const res = await apiRequest(`/collections/receipt/${cell.collectionId}`);
        if (res.success && res.data) {
          rData = {
            ...rData,
            ...res.data,
            sangamName: res.data.sangamName || sangamName,
            sangamSlogan: res.data.sangamSlogan || sangamSlogan
          };
        }
      }

      setReceiptData(rData);
      setShowReceiptModal(true);
    } catch (err) {
      // fallback
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedCell || !selectedCell.collectionId) {
      Alert.alert(t.error, 'Invalid collection slot');
      return;
    }
    const amountNum = parseFloat(amountPaid);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t.error, 'Please enter a valid amount');
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload = {
        memberCollectionId: selectedCell.collectionId,
        amountPaid: amountNum,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined
      };

      const res = await apiRequest('/collections/payment', 'POST', payload);
      if (res.success) {
        setShowPaymentModal(false);
        const receiptResp = res.data;
        const session = await getUserSession();

        const receipt: ReceiptData = {
          receiptNumber: receiptResp?.receiptNumber || 'REC-' + Date.now(),
          sangamName: receiptResp?.sangamName || session?.sangamName || propSangamName || 'Oor Nithi Sangam',
          sangamSlogan: receiptResp?.sangamSlogan || session?.slogan || propSangamSlogan,
          sangamAddress: receiptResp?.sangamAddress,
          sangamMobile: receiptResp?.sangamMobile,
          memberName: receiptResp?.memberName || selectedRow?.memberName,
          memberCode: receiptResp?.memberCode || selectedRow?.memberCode,
          monthName: receiptResp?.monthName || selectedCell?.monthName,
          year: receiptResp?.year || selectedCell?.year,
          amountPaid: receiptResp?.amountPaid || amountNum,
          expectedAmount: selectedCell?.expectedAmount,
          paymentMode,
          paymentDate: receiptResp?.paymentDate || new Date(),
          collectedBy: receiptResp?.collectedBy || session?.name || 'Admin',
          referenceNumber: referenceNumber.trim() || undefined
        };

        setReceiptData(receipt);
        setShowReceiptModal(true);
        loadMatrix(selectedCycleId || undefined);
      } else {
        Alert.alert(t.error, res.message || 'Payment submission failed');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const activeConfig = matrixData?.activeConfig;
  const grandTotalPaid = matrixData?.grandTotalPaid != null ? Number(matrixData.grandTotalPaid) : 0;
  const grandTotalPending = matrixData?.grandTotalPending != null ? Number(matrixData.grandTotalPending) : 0;
  const rows = matrixData?.rows || [];

  const filteredRows = rows.filter((r: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.memberName && r.memberName.toLowerCase().includes(q)) ||
      (r.memberCode && r.memberCode.toLowerCase().includes(q)) ||
      (r.mobileNumber && r.mobileNumber.includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* 1. CYCLE SELECTOR BAR */}
      {cycles.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cycleScroll}>
          {cycles.map((c) => {
            const isSel = selectedCycleId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.cycleTab, isSel && styles.cycleTabActive]}
                onPress={() => handleCycleChange(c.id)}
              >
                <Text style={[styles.cycleTabText, isSel && styles.cycleTabTextActive]}>
                  {c.collectionName}
                </Text>
                <Text style={[styles.cycleTabStatus, isSel && styles.cycleTabStatusActive]}>
                  [{c.status}]
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 2. SUMMARY METRICS BANNER */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t.totalPaid}</Text>
          <Text style={styles.summaryValPaid}>₹{grandTotalPaid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t.totalPending}</Text>
          <Text style={styles.summaryValPending}>₹{grandTotalPending.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t.monthlyAmount}</Text>
          <Text style={styles.summaryVal}>₹{activeConfig?.monthlyAmount || 500}</Text>
        </View>
      </View>

      {/* 3. SEARCH BOX */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. MEMBER MATRIX LIST */}
      <FlatList
        data={filteredRows}
        keyExtractor={(item) => item.memberId || item.memberCode || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0B3C2D" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📑</Text>
              <Text style={styles.emptyText}>{t.noRecords}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.matrixRowCard}>
            <View style={styles.rowTop}>
              <View style={styles.rowMember}>
                <Text style={styles.rowCode}>{item.memberCode || 'MEMBER'}</Text>
                <Text style={styles.rowName} numberOfLines={1}>{item.memberName}</Text>
              </View>
              <View style={styles.rowTotals}>
                <Text style={styles.paidText}>Paid: ₹{Number(item.totalPaid || 0).toFixed(0)}</Text>
                <Text style={styles.pendingText}>Pending: ₹{Number(item.totalPending || 0).toFixed(0)}</Text>
              </View>
            </View>

            {/* MONTH SLOTS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll}>
              {Array.isArray(item.months) &&
                item.months.map((m: any, idx: number) => {
                  const isPaid = m.status === 'PAID';
                  const isPending = m.status === 'PENDING';
                  const isPartial = m.status === 'PARTIAL';

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.monthBadge,
                        isPaid ? styles.monthPaid : isPending ? styles.monthPending : isPartial ? styles.monthPartial : styles.monthNA
                      ]}
                      onPress={() => handleCellPress(item, m)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.monthName, isPaid && styles.textWhite]}>
                        {m.monthName}
                      </Text>
                      <Text style={[styles.monthStatusText, isPaid && styles.textYellow]}>
                        {isPaid ? '✓ Paid' : `₹${m.balanceAmount || m.expectedAmount || 500}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        )}
      />

      {/* 5. PAYMENT MODAL */}
      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t.collectPayment}</Text>
                <Text style={styles.modalSub}>{selectedRow?.memberName} • {selectedCell?.monthName} {selectedCell?.year}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t.amount} (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={amountPaid}
                onChangeText={setAmountPaid}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>{t.paymentMode} *</Text>
              <View style={styles.modeRow}>
                {['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeChip, paymentMode === mode && styles.modeChipSelected]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text style={[styles.modeText, paymentMode === mode && styles.modeTextSelected]}>
                      {mode === 'UPI' ? 'UPI' : mode === 'CASH' ? t.cash : mode === 'BANK_TRANSFER' ? 'Bank' : 'Cheque'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t.referenceNo}</Text>
              <TextInput
                style={styles.textInput}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder="UTR / Trans ID (optional)"
              />

              <Text style={styles.inputLabel}>{t.remarks}</Text>
              <TextInput
                style={styles.textInput}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Remarks (optional)"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submittingPayment && { opacity: 0.7 }]}
              onPress={handleSubmitPayment}
              disabled={submittingPayment}
            >
              {submittingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{t.submit}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. RECEIPT MODAL */}
      <Modal visible={showReceiptModal} transparent animationType="fade" onRequestClose={() => setShowReceiptModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderTitle}>✓ {t.receiptDetails}</Text>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {receiptData && (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.receiptBox}>
                  <Text style={styles.receiptSangam}>{receiptData.sangamName}</Text>
                  {receiptData.sangamSlogan && (
                    <Text style={styles.receiptSlogan}>{receiptData.sangamSlogan}</Text>
                  )}
                  <View style={styles.divider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.receipt}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.receiptNumber}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.name}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.memberName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.memberCode}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.memberCode || '—'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>Period:</Text>
                    <Text style={styles.receiptVal}>{receiptData.monthName} {receiptData.year}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.paymentMode}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.paymentMode}</Text>
                  </View>

                  <View style={styles.amountPill}>
                    <Text style={styles.amountPillLabel}>{t.amount}:</Text>
                    <Text style={styles.amountPillVal}>₹{receiptData.amountPaid.toFixed(2)}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={() => receiptData && printOrShareReceipt(receiptData, 'share')}
              >
                <Text style={styles.pdfBtnText}>📥 {t.downloadPdf}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setShowReceiptModal(false)}
              >
                <Text style={styles.doneBtnText}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  cycleScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  cycleTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  cycleTabActive: {
    backgroundColor: '#0B3C2D'
  },
  cycleTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  cycleTabTextActive: {
    color: '#FFFFFF'
  },
  cycleTabStatus: {
    fontSize: 9,
    color: '#64748B'
  },
  cycleTabStatusActive: {
    color: '#FDE047'
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#0B3C2D',
    margin: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#E2E8F0',
    textTransform: 'uppercase'
  },
  summaryValPaid: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4ADE80',
    marginTop: 2
  },
  summaryValPending: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F87171',
    marginTop: 2
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A'
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8'
  },
  listContent: {
    padding: 12,
    paddingBottom: 30
  },
  matrixRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  rowMember: {
    flex: 1
  },
  rowCode: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  rowTotals: {
    alignItems: 'flex-end'
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A'
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 1
  },
  slotsScroll: {
    flexDirection: 'row',
    paddingTop: 4
  },
  monthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
    minWidth: 58
  },
  monthPaid: {
    backgroundColor: '#0B3C2D',
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  monthPending: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  monthPartial: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  monthNA: {
    backgroundColor: '#F1F5F9'
  },
  monthName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  },
  monthStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2
  },
  textWhite: {
    color: '#FFFFFF'
  },
  textYellow: {
    color: '#FDE047'
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0B3C2D'
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  closeBtn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94A3B8'
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A'
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  modeChipSelected: {
    backgroundColor: '#0B3C2D',
    borderColor: '#0B3C2D'
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  modeTextSelected: {
    color: '#FFFFFF'
  },
  submitBtn: {
    backgroundColor: '#0B3C2D',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  receiptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    margin: 20,
    padding: 20,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 420
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  receiptHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534'
  },
  receiptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  receiptSangam: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B3C2D',
    textAlign: 'center'
  },
  receiptSlogan: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3
  },
  receiptField: {
    fontSize: 11,
    color: '#64748B'
  },
  receiptVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A'
  },
  amountPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  amountPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534'
  },
  amountPillVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#14532D'
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16
  },
  pdfBtn: {
    flex: 1,
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  pdfBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 12
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  doneBtnText: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 12
  }
});
