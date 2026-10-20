import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { apiRequest } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

interface AdminLedgerProps {
  lang?: MobileLanguage;
}

const MONTHS = [
  { value: 1, labelEn: 'January', labelTa: 'ஜனவரி', shortEn: 'Jan' },
  { value: 2, labelEn: 'February', labelTa: 'பிப்ரவரி', shortEn: 'Feb' },
  { value: 3, labelEn: 'March', labelTa: 'மார்ச்', shortEn: 'Mar' },
  { value: 4, labelEn: 'April', labelTa: 'ஏப்ரல்', shortEn: 'Apr' },
  { value: 5, labelEn: 'May', labelTa: 'மே', shortEn: 'May' },
  { value: 6, labelEn: 'June', labelTa: 'ஜூன்', shortEn: 'Jun' },
  { value: 7, labelEn: 'July', labelTa: 'ஜூலை', shortEn: 'Jul' },
  { value: 8, labelEn: 'August', labelTa: 'ஆகஸ்ட்', shortEn: 'Aug' },
  { value: 9, labelEn: 'September', labelTa: 'செப்டம்பர்', shortEn: 'Sep' },
  { value: 10, labelEn: 'October', labelTa: 'அக்டோபர்', shortEn: 'Oct' },
  { value: 11, labelEn: 'November', labelTa: 'நவம்பர்', shortEn: 'Nov' },
  { value: 12, labelEn: 'December', labelTa: 'டிசம்பர்', shortEn: 'Dec' }
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const AdminLedgerScreen: React.FC<AdminLedgerProps> = ({ lang = 'ta' }) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Month / Year Date Range Filter State
  const currentYear = new Date().getFullYear();
  const [fromMonth, setFromMonth] = useState<number>(1);
  const [fromYear, setFromYear] = useState<number>(currentYear);
  const [toMonth, setToMonth] = useState<number>(12);
  const [toYear, setToYear] = useState<number>(currentYear);
  const [isDateFilterActive, setIsDateFilterActive] = useState<boolean>(false);
  const [appliedDateFilter, setAppliedDateFilter] = useState<{
    fromMonth: number;
    fromYear: number;
    toMonth: number;
    toYear: number;
  } | null>(null);
  const [pickerType, setPickerType] = useState<'FROM_MONTH' | 'FROM_YEAR' | 'TO_MONTH' | 'TO_YEAR' | null>(null);

  const parseDateSafe = (dStr?: string): Date => {
    if (!dStr) return new Date(NaN);
    let s = String(dStr).trim().replace(' ', 'T');
    if (s.includes('.')) {
      const parts = s.split('.');
      const frac = parts[1].replace(/[^0-9]/g, '').slice(0, 3);
      s = `${parts[0]}.${frac}`;
    }
    return new Date(s);
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const [txRes, balRes] = await Promise.all([
        apiRequest('/ledger'),
        apiRequest('/ledger/balance')
      ]);

      let loadedTxns: any[] = [];
      if (txRes && txRes.success && Array.isArray(txRes.data)) {
        loadedTxns = txRes.data;
        setTransactions(loadedTxns);
      } else if (txRes && !txRes.success) {
        console.warn('Failed to load ledger transactions:', txRes.message);
      }

      if (balRes && balRes.success && balRes.data != null) {
        setCurrentBalance(Number(balRes.data));
      } else if (loadedTxns.length > 0 && loadedTxns[0].balanceAfter != null) {
        // Fallback to balanceAfter from latest transaction
        setCurrentBalance(Number(loadedTxns[0].balanceAfter));
      }
    } catch (e) {
      console.error('Error loading ledger:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLedger();
  };

  const handleApplyFilter = () => {
    if (fromYear > toYear || (fromYear === toYear && fromMonth > toMonth)) {
      Alert.alert(
        t.error || 'Invalid Range',
        lang === 'ta'
          ? 'தொடக்க மாதம்/ஆண்டு முடிவு மாதம்/ஆண்டை விட முந்தையதாக அல்லது சமமாக இருக்க வேண்டும்.'
          : 'From Month/Year must be earlier than or equal to To Month/Year.'
      );
      return;
    }

    setAppliedDateFilter({ fromMonth, fromYear, toMonth, toYear });
    setIsDateFilterActive(true);
  };

  const handleResetFilter = () => {
    setFromMonth(1);
    setFromYear(currentYear);
    setToMonth(12);
    setToYear(currentYear);
    setAppliedDateFilter(null);
    setIsDateFilterActive(false);
  };

  // 1. Date Range Filtering (inclusive of fromMonth/fromYear to toMonth/toYear)
  const dateFilteredTransactions = transactions.filter((tx) => {
    if (!isDateFilterActive || !appliedDateFilter) return true;
    if (!tx.transactionDate) return false;

    try {
      const txDate = parseDateSafe(tx.transactionDate);
      const txTs = txDate.getTime();
      if (isNaN(txTs)) return false;

      // Start of From Month (1st day 00:00:00)
      const startTs = new Date(
        appliedDateFilter.fromYear,
        appliedDateFilter.fromMonth - 1,
        1,
        0,
        0,
        0,
        0
      ).getTime();

      // End of To Month (last day 23:59:59.999)
      const endTs = new Date(
        appliedDateFilter.toYear,
        appliedDateFilter.toMonth,
        0,
        23,
        59,
        59,
        999
      ).getTime();

      return txTs >= startTs && txTs <= endTs;
    } catch {
      return false;
    }
  });

  // 2. Period credit/debit calculation from date-filtered transactions
  const periodCredits = dateFilteredTransactions.reduce((sum, tx) => sum + Number(tx.creditAmount || 0), 0);
  const periodDebits = dateFilteredTransactions.reduce((sum, tx) => sum + Number(tx.debitAmount || 0), 0);

  const creditCount = dateFilteredTransactions.filter((tx) => Number(tx.creditAmount || 0) > 0).length;
  const debitCount = dateFilteredTransactions.filter((tx) => Number(tx.debitAmount || 0) > 0).length;

  // 3. Category & search filtering
  const filtered = dateFilteredTransactions.filter((tx) => {
    const isCredit = Number(tx.creditAmount || 0) > 0;
    if (filterType === 'CREDIT' && !isCredit) return false;
    if (filterType === 'DEBIT' && isCredit) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const desc = (tx.description || '').toLowerCase();
      const type = (tx.transactionType || '').toLowerCase();
      const by = (tx.createdBy || '').toLowerCase();
      return desc.includes(q) || type.includes(q) || by.includes(q);
    }
    return true;
  });

  const getTransactionBadge = (type: string, isCredit: boolean) => {
    switch (type) {
      case 'MEMBER_COLLECTION':
        return {
          label: lang === 'ta' ? 'மாத சந்தா வசூல்' : 'Member Collection',
          icon: '📥',
          bg: '#DCFCE7',
          textColor: '#15803D'
        };
      case 'DONATION':
        return {
          label: lang === 'ta' ? 'நன்கொடை' : 'Donation',
          icon: '🤝',
          bg: '#FEF3C7',
          textColor: '#B45309'
        };
      case 'EVENT_EXPENSE':
        return {
          label: lang === 'ta' ? 'நிகழ்வு செலவு' : 'Event Expense',
          icon: '🛕',
          bg: '#F3E8FF',
          textColor: '#7E22CE'
        };
      case 'EXPENSE':
        return {
          label: lang === 'ta' ? 'பொது செலவு' : 'General Expense',
          icon: '💸',
          bg: '#FEE2E2',
          textColor: '#B91C1C'
        };
      default:
        return isCredit
          ? {
              label: lang === 'ta' ? 'வரவு' : 'Credit',
              icon: '📥',
              bg: '#DCFCE7',
              textColor: '#15803D'
            }
          : {
              label: lang === 'ta' ? 'செலவு' : 'Debit',
              icon: '📤',
              bg: '#FEE2E2',
              textColor: '#B91C1C'
            };
    }
  };

  const formatTransactionDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = parseDateSafe(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' + d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. BALANCE HERO BANNER */}
      <View style={styles.balanceBanner}>
        <View style={styles.balanceHeaderRow}>
          <Text style={styles.bannerLabel}>{t.availableBalance}</Text>
          {isDateFilterActive && appliedDateFilter && (
            <View style={styles.filterPeriodBadge}>
              <Text style={styles.filterPeriodBadgeText}>
                {MONTHS.find(m => m.value === appliedDateFilter.fromMonth)?.shortEn} {appliedDateFilter.fromYear} – {MONTHS.find(m => m.value === appliedDateFilter.toMonth)?.shortEn} {appliedDateFilter.toYear}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.bannerAmount}>
          ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={styles.bannerNote}>
          {lang === 'ta' ? 'உண்மை மாறாத கணக்கு இருப்பு (வடிகட்டலுக்கு அப்பாற்பட்டது)' : 'Real account balance (independent of date filter)'}
        </Text>

        <View style={styles.bannerRow}>
          <View style={styles.bannerSub}>
            <Text style={styles.bannerSubLabel}>
              {isDateFilterActive ? (lang === 'ta' ? 'கால வரவு (Credits)' : 'Period Credits') : t.credit}
            </Text>
            <Text style={styles.bannerSubValCredit}>
              +₹{periodCredits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerSub}>
            <Text style={styles.bannerSubLabel}>
              {isDateFilterActive ? (lang === 'ta' ? 'கால செலவு (Debits)' : 'Period Debits') : t.debit}
            </Text>
            <Text style={styles.bannerSubValDebit}>
              -₹{periodDebits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. MONTH / YEAR DATE RANGE FILTER CARD */}
      <View style={styles.dateFilterCard}>
        <View style={styles.dateFilterHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, marginRight: 6 }}>🗓️</Text>
            <Text style={styles.dateFilterTitle}>
              {lang === 'ta' ? 'மாதம் / ஆண்டு வடிகட்டி' : 'From Month/Year to Month/Year'}
            </Text>
          </View>
          {isDateFilterActive && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterBadgeText}>
                {lang === 'ta' ? 'வடிகட்டப்பட்டது' : 'Active Filter'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.filterGrid}>
          {/* FROM SECTION */}
          <View style={styles.filterCol}>
            <Text style={styles.filterColLabel}>{lang === 'ta' ? 'இருந்து (From):' : 'From:'}</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setPickerType('FROM_MONTH')}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerBtnText} numberOfLines={1}>
                  {MONTHS.find(m => m.value === fromMonth)?.shortEn || fromMonth}
                </Text>
                <Text style={styles.pickerBtnArrow}>▼</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setPickerType('FROM_YEAR')}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerBtnText}>{fromYear}</Text>
                <Text style={styles.pickerBtnArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TO SECTION */}
          <View style={styles.filterCol}>
            <Text style={styles.filterColLabel}>{lang === 'ta' ? 'வரை (To):' : 'To:'}</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setPickerType('TO_MONTH')}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerBtnText} numberOfLines={1}>
                  {MONTHS.find(m => m.value === toMonth)?.shortEn || toMonth}
                </Text>
                <Text style={styles.pickerBtnArrow}>▼</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setPickerType('TO_YEAR')}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerBtnText}>{toYear}</Text>
                <Text style={styles.pickerBtnArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.filterActionRow}>
          <TouchableOpacity
            style={styles.applyFilterBtn}
            onPress={handleApplyFilter}
            activeOpacity={0.8}
          >
            <Text style={styles.applyFilterBtnText}>
              ✓ {lang === 'ta' ? 'வடிகட்டு (Apply)' : 'Apply Filter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetFilterBtn, !isDateFilterActive && styles.resetFilterBtnDisabled]}
            onPress={handleResetFilter}
            disabled={!isDateFilterActive}
            activeOpacity={0.8}
          >
            <Text style={[styles.resetFilterBtnText, !isDateFilterActive && styles.resetFilterBtnTextDisabled]}>
              ↺ {lang === 'ta' ? 'மீட்டமை (Reset)' : 'Reset Filter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. SEARCH BAR */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={lang === 'ta' ? 'விளக்கம், வகை மூலம் தேடுக...' : 'Search by description or type...'}
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

      {/* 4. FILTER TABS */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterType('ALL')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, filterType === 'ALL' && styles.filterChipTextActive]}>
            {t.filterAll} ({dateFilteredTransactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'CREDIT' && styles.filterChipCreditActive]}
          onPress={() => setFilterType('CREDIT')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, filterType === 'CREDIT' && styles.filterChipTextActive]}>
            + {t.credit} ({creditCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'DEBIT' && styles.filterChipDebitActive]}
          onPress={() => setFilterType('DEBIT')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, filterType === 'DEBIT' && styles.filterChipTextActive]}>
            - {t.debit} ({debitCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. TRANSACTION AUDIT LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0B3C2D" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📜</Text>
              <Text style={styles.emptyText}>
                {isDateFilterActive
                  ? (lang === 'ta' ? 'தேர்ந்தெடுத்த கால வரம்பில் பரிவர்த்தனைகள் எதுவும் இல்லை' : 'No transactions found in selected date range')
                  : t.noRecords}
              </Text>
              {isDateFilterActive && (
                <TouchableOpacity style={styles.emptyResetBtn} onPress={handleResetFilter}>
                  <Text style={styles.emptyResetBtnText}>
                    ↺ {lang === 'ta' ? 'வடிகட்டியை மீட்டமை' : 'Reset Filter'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        renderItem={({ item }) => {
          const isCredit = Number(item.creditAmount || 0) > 0;
          const txAmount = isCredit ? Number(item.creditAmount) : Number(item.debitAmount || 0);
          const badge = getTransactionBadge(item.transactionType, isCredit);
          const dateStr = formatTransactionDate(item.transactionDate);
          const balanceAfter = item.balanceAfter != null ? Number(item.balanceAfter) : 0;

          return (
            <View style={[styles.txCard, isCredit ? styles.txCardCredit : styles.txCardDebit]}>
              {/* Header: Type Badge & Amount */}
              <View style={styles.cardHeaderRow}>
                <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                  <Text style={{ fontSize: 11, marginRight: 4 }}>{badge.icon}</Text>
                  <Text style={[styles.typeBadgeText, { color: badge.textColor }]}>{badge.label}</Text>
                </View>

                <Text style={[styles.txAmount, { color: isCredit ? '#15803D' : '#DC2626' }]}>
                  {isCredit ? '+' : '-'} ₹{txAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Description */}
              <Text style={styles.txDescription}>
                {item.description || item.transactionType || 'Transaction'}
              </Text>

              {/* Footer Meta Row: Date & Balance After */}
              <View style={styles.cardFooterRow}>
                <Text style={styles.txDate}>🗓️ {dateStr}</Text>

                <View style={styles.balanceBadge}>
                  <Text style={styles.balanceBadgeLabel}>{t.balanceAfter}:</Text>
                  <Text style={styles.balanceBadgeVal}>
                    ₹{balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* 6. MONTH / YEAR SELECTION MODAL */}
      <Modal
        visible={pickerType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerType(null)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setPickerType(null)}
        >
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>
                {pickerType === 'FROM_MONTH'
                  ? (lang === 'ta' ? 'தொடக்க மாதம்' : 'Select From Month')
                  : pickerType === 'TO_MONTH'
                  ? (lang === 'ta' ? 'முடிவு மாதம்' : 'Select To Month')
                  : pickerType === 'FROM_YEAR'
                  ? (lang === 'ta' ? 'தொடக்க ஆண்டு' : 'Select From Year')
                  : (lang === 'ta' ? 'முடிவு ஆண்டு' : 'Select To Year')}
              </Text>
              <TouchableOpacity onPress={() => setPickerType(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {(pickerType === 'FROM_MONTH' || pickerType === 'TO_MONTH') ? (
                MONTHS.map((m) => {
                  const isSel = (pickerType === 'FROM_MONTH' ? fromMonth : toMonth) === m.value;
                  return (
                    <TouchableOpacity
                      key={m.value}
                      style={[styles.pickerItem, isSel && styles.pickerItemActive]}
                      onPress={() => {
                        if (pickerType === 'FROM_MONTH') setFromMonth(m.value);
                        else setToMonth(m.value);
                        setPickerType(null);
                      }}
                    >
                      <Text style={[styles.pickerItemText, isSel && styles.pickerItemTextActive]}>
                        {lang === 'ta' ? `${m.labelTa} (${m.labelEn})` : m.labelEn}
                      </Text>
                      {isSel && <Text style={styles.pickerItemCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })
              ) : (
                YEARS.map((yr) => {
                  const isSel = (pickerType === 'FROM_YEAR' ? fromYear : toYear) === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.pickerItem, isSel && styles.pickerItemActive]}
                      onPress={() => {
                        if (pickerType === 'FROM_YEAR') setFromYear(yr);
                        else setToYear(yr);
                        setPickerType(null);
                      }}
                    >
                      <Text style={[styles.pickerItemText, isSel && styles.pickerItemTextActive]}>
                        {yr}
                      </Text>
                      {isSel && <Text style={styles.pickerItemCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  balanceBanner: {
    backgroundColor: '#0B3C2D',
    margin: 12,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE047',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  bannerAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4
  },
  bannerRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)'
  },
  bannerSub: {
    flex: 1,
    alignItems: 'center'
  },
  bannerDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  bannerSubLabel: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '700'
  },
  bannerSubValCredit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4ADE80',
    marginTop: 2
  },
  bannerSubValDebit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F87171',
    marginTop: 2
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingBottom: 6
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
    fontSize: 12.5,
    color: '#0F172A'
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8'
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center'
  },
  filterChipActive: {
    backgroundColor: '#0B3C2D'
  },
  filterChipCreditActive: {
    backgroundColor: '#15803D'
  },
  filterChipDebitActive: {
    backgroundColor: '#B91C1C'
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: 12,
    paddingBottom: 30
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4
  },
  txCardCredit: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981'
  },
  txCardDebit: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '900'
  },
  txDescription: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 10
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  txDate: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500'
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  balanceBadgeLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 4
  },
  balanceBadgeVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3C2D'
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
  emptyResetBtn: {
    marginTop: 12,
    backgroundColor: '#0B3C2D',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700'
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  filterPeriodBadge: {
    backgroundColor: '#0F5132',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  filterPeriodBadgeText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800'
  },
  bannerNote: {
    fontSize: 10,
    color: '#A7F3D0',
    marginTop: 2,
    marginBottom: 8,
    fontStyle: 'italic'
  },
  dateFilterCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4
  },
  dateFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  dateFilterTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  activeFilterBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  activeFilterBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700'
  },
  filterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10
  },
  filterCol: {
    flex: 1
  },
  filterColLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 6
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  pickerBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A'
  },
  pickerBtnArrow: {
    fontSize: 9,
    color: '#64748B',
    marginLeft: 2
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2
  },
  applyFilterBtn: {
    flex: 1,
    backgroundColor: '#0B3C2D',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800'
  },
  resetFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetFilterBtnDisabled: {
    opacity: 0.4
  },
  resetFilterBtnText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '700'
  },
  resetFilterBtnTextDisabled: {
    color: '#94A3B8'
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 5
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 6
  },
  pickerModalTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  closeBtn: {
    fontSize: 15,
    color: '#64748B',
    padding: 4
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2
  },
  pickerItemActive: {
    backgroundColor: '#ECFDF5'
  },
  pickerItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  pickerItemTextActive: {
    color: '#0B3C2D',
    fontWeight: '800'
  },
  pickerItemCheck: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669'
  }
});
