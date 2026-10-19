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
import { apiRequest } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

interface AdminExpensesProps {
  lang?: MobileLanguage;
}

export const AdminExpensesScreen: React.FC<AdminExpensesProps> = ({ lang = 'ta' }) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Record Expense Modal
  const [showModal, setShowModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/expenses');
      if (res.success && Array.isArray(res.data)) {
        setExpenses(res.data);
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
    loadExpenses();
  };

  const openAddModal = () => {
    setExpenseCategory('Pooja Items');
    setDescription('');
    setAmount('');
    setPaidTo('');
    setPaymentMode('UPI');
    setReferenceNumber('');
    setRemarks('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!expenseCategory.trim()) {
      Alert.alert(t.error, 'Please select or enter expense category');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t.error, 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        expenseCategory: expenseCategory.trim(),
        description: description.trim() || undefined,
        amount: amountNum,
        paidTo: paidTo.trim() || undefined,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined
      };

      const res = await apiRequest('/expenses', 'POST', payload);
      if (res.success) {
        setShowModal(false);
        Alert.alert(t.appName, t.expenseSuccess);
        loadExpenses();
      } else {
        Alert.alert(t.error, res.message || 'Failed to record expense');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSum = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const filteredExpenses = expenses.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (e.expenseCategory && e.expenseCategory.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(q))
    );
  });

  const CATEGORIES = [
    'Pooja Items',
    'Electricity / Power',
    'Maintenance',
    'Prasadam / Food',
    'Printing / Stationery',
    'Cleaning',
    'Festival Expense',
    'Other'
  ];

  return (
    <View style={styles.container}>
      {/* 1. TOP SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>{t.totalExpenses}</Text>
          <Text style={styles.summaryAmount}>₹{totalSum.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ {t.recordExpense}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. SEARCH BAR */}
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

      {/* 3. EXPENSES LIST */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0B3C2D" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyText}>{t.noRecords}</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const dateStr = item.expenseDate ? new Date(item.expenseDate).toLocaleDateString('en-IN') : '';

          return (
            <View style={styles.expenseCard}>
              <View style={styles.iconBox}>
                <Text style={{ fontSize: 20 }}>💸</Text>
              </View>

              <View style={styles.detailsBox}>
                <View style={styles.titleRow}>
                  <Text style={styles.categoryName} numberOfLines={1}>{item.expenseCategory}</Text>
                  <Text style={styles.amountText}>- ₹{Number(item.amount || 0).toLocaleString('en-IN')}</Text>
                </View>

                {item.description ? (
                  <Text style={styles.descText} numberOfLines={1}>{item.description}</Text>
                ) : null}

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.paidTo ? `Paid to: ${item.paidTo} • ` : ''}{dateStr}</Text>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{item.paymentMode || 'CASH'}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* 4. RECORD EXPENSE MODAL */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.recordExpense}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t.expenseCategory} *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, expenseCategory === cat && styles.catChipActive]}
                    onPress={() => setExpenseCategory(cat)}
                  >
                    <Text style={[styles.catChipText, expenseCategory === cat && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={[styles.textInput, { marginTop: 6 }]}
                value={expenseCategory}
                onChangeText={setExpenseCategory}
                placeholder="Or type custom category"
              />

              <Text style={styles.inputLabel}>{t.amount} (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="500"
              />

              <Text style={styles.inputLabel}>{t.paidTo}</Text>
              <TextInput
                style={styles.textInput}
                value={paidTo}
                onChangeText={setPaidTo}
                placeholder="Vendor or Person Name"
              />

              <Text style={styles.inputLabel}>{t.description}</Text>
              <TextInput
                style={[styles.textInput, { height: 50 }]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Brief description of the expense"
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
                placeholder="UTR / Cheque No (optional)"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{t.submit}</Text>
              )}
            </TouchableOpacity>
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B3C2D',
    margin: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE047',
    textTransform: 'uppercase'
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F87171',
    marginTop: 2
  },
  addBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12
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
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  detailsBox: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626'
  },
  descText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  metaText: {
    fontSize: 10,
    color: '#94A3B8'
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 4
  },
  modeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569'
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
    alignItems: 'center',
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
  catScroll: {
    flexDirection: 'row',
    marginBottom: 4
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  catChipActive: {
    backgroundColor: '#0B3C2D',
    borderColor: '#0B3C2D'
  },
  catChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  catChipTextActive: {
    color: '#FFFFFF'
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
  }
});
