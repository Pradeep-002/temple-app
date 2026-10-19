import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { apiRequest, getUserSession, getMediaUrl } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';
import { buildReceiptHtml, printOrShareReceipt, ReceiptData } from '../../utils/receiptGenerator';

const CollectorMemberAvatar: React.FC<{ name?: string; profileImageUrl?: string }> = ({ name, profileImageUrl }) => {
  const [imageError, setImageError] = useState(false);

  if (profileImageUrl && !imageError) {
    return (
      <View style={styles.avatar}>
        <Image
          source={{ uri: getMediaUrl(profileImageUrl) }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{(name || 'M').charAt(0).toUpperCase()}</Text>
    </View>
  );
};

interface CollectorDashboardProps {
  lang?: MobileLanguage;
  sangamName?: string;
  sangamSlogan?: string;
  onLogout?: () => void;
  onSelectMember?: (member: any) => void;
}

export const CollectorDashboardScreen: React.FC<CollectorDashboardProps> = ({
  lang = 'ta',
  sangamName: propSangamName,
  sangamSlogan: propSangamSlogan
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  // Metrics
  const [stats, setStats] = useState({
    todayCollection: 0,
    monthCollection: 0,
    totalAssigned: 0,
    totalPending: 0
  });

  // Payment Collection Modal
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [memberSlots, setMemberSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Load Sangam Members
      const membersRes = await apiRequest('/members');
      if (membersRes.success && Array.isArray(membersRes.data)) {
        setMembers(membersRes.data);
      }

      // 2. Load Matrix to compute collector metrics
      const matrixRes = await apiRequest('/collections/matrix');
      if (matrixRes.success && matrixRes.data) {
        const rows = matrixRes.data.rows || [];
        let pendingCount = 0;
        let todaySum = 0;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        rows.forEach((r: any) => {
          if (r.totalPending && Number(r.totalPending) > 0) {
            pendingCount++;
          }
          if (Array.isArray(r.months)) {
            r.months.forEach((m: any) => {
              if (m.status === 'PAID' && m.paymentDate) {
                const pDate = String(m.paymentDate).split('T')[0];
                if (pDate === todayStr) {
                  todaySum += Number(m.paidAmount || 0);
                }
              }
            });
          }
        });

        setStats({
          todayCollection: todaySum,
          monthCollection: Number(matrixRes.data.grandTotalPaid || 0),
          totalAssigned: rows.length || (membersRes.data?.length || 0),
          totalPending: pendingCount
        });
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
    loadDashboardData();
  };

  const openCollectModal = async (member: any) => {
    setSelectedMember(member);
    setShowCollectModal(true);
    setAmountPaid('');
    setReferenceNumber('');
    setRemarks('');
    setSelectedSlot(null);
    setLoadingSlots(true);

    try {
      // Get member's pending collection slots
      const res = await apiRequest(`/collections/member/${member.id}`);
      if (res.success && Array.isArray(res.data)) {
        // filter slots
        const pendingSlots = res.data.filter((s: any) => s.status !== 'PAID');
        setMemberSlots(res.data);
        if (pendingSlots.length > 0) {
          const first = pendingSlots[0];
          setSelectedSlot(first);
          setAmountPaid(String(first.balanceAmount || first.expectedAmount || 500));
        } else if (res.data.length > 0) {
          setSelectedSlot(res.data[0]);
          setAmountPaid(String(res.data[0].balanceAmount || 500));
        }
      } else {
        // Fallback: load matrix
        const mRes = await apiRequest('/collections/matrix');
        if (mRes.success && mRes.data) {
          const row = (mRes.data.rows || []).find((r: any) => r.memberId === member.id);
          if (row && Array.isArray(row.months)) {
            const pending = row.months.filter((m: any) => m.status !== 'PAID');
            setMemberSlots(row.months);
            if (pending.length > 0) {
              setSelectedSlot(pending[0]);
              setAmountPaid(String(pending[0].balanceAmount || pending[0].expectedAmount || 500));
            }
          }
        }
      }
    } catch (err) {
      // ignore
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotChange = (slot: any) => {
    setSelectedSlot(slot);
    setAmountPaid(String(slot.balanceAmount || slot.expectedAmount || 500));
  };

  const handleSubmitPayment = async () => {
    if (!selectedSlot || !selectedSlot.collectionId && !selectedSlot.id) {
      Alert.alert(t.error, 'Please select a contribution period');
      return;
    }
    const slotId = selectedSlot.collectionId || selectedSlot.id;
    const amountNum = parseFloat(amountPaid);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t.error, 'Please enter a valid payment amount');
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload = {
        memberCollectionId: slotId,
        amountPaid: amountNum,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined
      };

      const res = await apiRequest('/collections/payment', 'POST', payload);
      if (res.success) {
        setShowCollectModal(false);
        const receiptResp = res.data;

        const session = await getUserSession();
        const sangamName = receiptResp?.sangamName || session?.sangamName || propSangamName || 'Oor Nithi Sangam';
        const sangamSlogan = receiptResp?.sangamSlogan || session?.slogan || propSangamSlogan;

        const receipt: ReceiptData = {
          receiptNumber: receiptResp?.receiptNumber || 'REC-' + Date.now(),
          sangamName,
          sangamSlogan,
          sangamAddress: receiptResp?.sangamAddress,
          sangamMobile: receiptResp?.sangamMobile,
          memberName: receiptResp?.memberName || selectedMember?.name,
          memberCode: receiptResp?.memberCode || selectedMember?.memberCode,
          monthName: receiptResp?.monthName || selectedSlot?.monthName,
          year: receiptResp?.year || selectedSlot?.year,
          amountPaid: receiptResp?.amountPaid || amountNum,
          expectedAmount: selectedSlot?.expectedAmount,
          paymentMode,
          paymentDate: receiptResp?.paymentDate || new Date(),
          collectedBy: receiptResp?.collectedBy || session?.name || 'Collector',
          referenceNumber: referenceNumber.trim() || undefined
        };

        setReceiptData(receipt);
        setShowReceiptModal(true);
        loadDashboardData();
      } else {
        Alert.alert(t.error, res.message || 'Payment submission failed');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error occurred');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Filter members
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.memberCode && m.memberCode.toLowerCase().includes(q)) ||
      (m.mobileNumber && m.mobileNumber.includes(q));

    if (!matchesSearch) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP METRICS CARDS */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.metricLabel}>{t.todayCollection}</Text>
          <Text style={styles.metricValue}>₹{stats.todayCollection.toFixed(0)}</Text>
          <Text style={styles.metricSub}>{new Date().toLocaleDateString('en-IN')}</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: '#D4AF37' }]}>
          <Text style={styles.metricLabel}>{t.thisMonthCollection}</Text>
          <Text style={styles.metricValue}>₹{stats.monthCollection.toFixed(0)}</Text>
          <Text style={styles.metricSub}>{t.totalCycleCollection}</Text>
        </View>

        <View style={[styles.metricCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={styles.metricLabel}>{t.assignedMembers}</Text>
          <Text style={styles.metricValue}>{stats.totalAssigned}</Text>
          <Text style={styles.metricSub}>{stats.totalPending} {t.pending}</Text>
        </View>
      </View>

      {/* 2. SEARCH & FILTER BAR */}
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

      {/* 3. MEMBER LIST */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id || item.memberCode || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0B3C2D" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>{t.noRecords}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <CollectorMemberAvatar name={item.name} profileImageUrl={item.profileImageUrl} />

            <View style={styles.memberInfo}>
              <View style={styles.codeRow}>
                <Text style={styles.memberCode}>{item.memberCode || 'MEMBER'}</Text>
                <View style={[styles.statusBadge, item.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
                </View>
              </View>
              <Text style={styles.memberName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.memberMobile}>📞 {item.mobileNumber}</Text>
            </View>

            <TouchableOpacity
              style={styles.collectBtn}
              onPress={() => openCollectModal(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.collectBtnText}>₹ {t.collect}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* 4. PAYMENT COLLECTION MODAL */}
      <Modal
        visible={showCollectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCollectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t.collectPayment}</Text>
                <Text style={styles.modalSub}>{selectedMember?.name} ({selectedMember?.memberCode})</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCollectModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {loadingSlots ? (
                <ActivityIndicator size="small" color="#0B3C2D" style={{ marginVertical: 20 }} />
              ) : (
                <>
                  {/* Slot selector */}
                  <Text style={styles.inputLabel}>{t.selectSlot}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotRow}>
                    {memberSlots.map((slot, idx) => {
                      const isSel = selectedSlot && (selectedSlot.collectionId === slot.collectionId || selectedSlot.id === slot.id);
                      const isPaid = slot.status === 'PAID';
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.slotChip,
                            isSel && styles.slotChipSelected,
                            isPaid && styles.slotChipPaid
                          ]}
                          onPress={() => !isPaid && handleSlotChange(slot)}
                          disabled={isPaid}
                        >
                          <Text style={[styles.slotChipText, isSel && styles.slotChipTextSelected]}>
                            {slot.monthName} {slot.year}
                          </Text>
                          <Text style={[styles.slotChipSub, isSel && styles.slotChipSubSelected]}>
                            {isPaid ? 'PAID' : `₹${slot.balanceAmount || slot.expectedAmount || 500}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Amount Input */}
                  <Text style={styles.inputLabel}>{t.amount} (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={amountPaid}
                    onChangeText={setAmountPaid}
                    keyboardType="numeric"
                    placeholder="500"
                  />

                  {/* Payment Mode Selector */}
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

                  {/* Reference Number */}
                  <Text style={styles.inputLabel}>{t.referenceNo}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                    placeholder="UTR / Trans ID (optional)"
                  />

                  {/* Remarks */}
                  <Text style={styles.inputLabel}>{t.remarks}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder="Optional remarks"
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submittingPayment && { opacity: 0.7 }]}
              onPress={handleSubmitPayment}
              disabled={submittingPayment || loadingSlots}
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

      {/* 5. RECEIPT MODAL */}
      <Modal
        visible={showReceiptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderTitle}>✓ {t.paymentSuccess}</Text>
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
  metricsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase'
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B3C2D',
    marginTop: 4
  },
  metricSub: {
    fontSize: 9,
    color: '#94A3B8',
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
    height: 44
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
    color: '#94A3B8',
    padding: 4
  },
  listContent: {
    padding: 12,
    paddingBottom: 30
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B3C2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  memberInfo: {
    flex: 1
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  memberCode: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0B3C2D'
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  statusActive: {
    backgroundColor: '#ECFDF5'
  },
  statusInactive: {
    backgroundColor: '#FEF2F2'
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981'
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  memberMobile: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  collectBtn: {
    backgroundColor: '#0B3C2D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  collectBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12
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
    marginBottom: 16,
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
    color: '#94A3B8',
    padding: 4
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
  slotRow: {
    flexDirection: 'row',
    marginVertical: 4
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center'
  },
  slotChipSelected: {
    backgroundColor: '#0B3C2D',
    borderColor: '#0B3C2D'
  },
  slotChipPaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    opacity: 0.6
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  slotChipTextSelected: {
    color: '#FFFFFF'
  },
  slotChipSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2
  },
  slotChipSubSelected: {
    color: '#FDE047'
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
