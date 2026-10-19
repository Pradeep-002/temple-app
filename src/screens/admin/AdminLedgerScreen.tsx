import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { apiRequest } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

interface AdminLedgerProps {
  lang?: MobileLanguage;
}

export const AdminLedgerScreen: React.FC<AdminLedgerProps> = ({ lang = 'ta' }) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

      if (txRes.success && Array.isArray(txRes.data)) {
        setTransactions(txRes.data);
      }
      if (balRes.success && balRes.data != null) {
        setCurrentBalance(Number(balRes.data));
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
    loadLedger();
  };

  // Exact credit/debit calculation from LedgerTransaction schema
  const totalCredits = transactions.reduce((sum, tx) => sum + Number(tx.creditAmount || 0), 0);
  const totalDebits = transactions.reduce((sum, tx) => sum + Number(tx.debitAmount || 0), 0);

  const creditCount = transactions.filter((tx) => Number(tx.creditAmount || 0) > 0).length;
  const debitCount = transactions.filter((tx) => Number(tx.debitAmount || 0) > 0).length;

  const filtered = transactions.filter((tx) => {
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
      const d = new Date(dateStr);
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
        <Text style={styles.bannerLabel}>{t.availableBalance}</Text>
        <Text style={styles.bannerAmount}>
          ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        <View style={styles.bannerRow}>
          <View style={styles.bannerSub}>
            <Text style={styles.bannerSubLabel}>{t.credit}</Text>
            <Text style={styles.bannerSubValCredit}>
              +₹{totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerSub}>
            <Text style={styles.bannerSubLabel}>{t.debit}</Text>
            <Text style={styles.bannerSubValDebit}>
              -₹{totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. SEARCH BAR */}
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

      {/* 3. FILTER TABS */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterType('ALL')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, filterType === 'ALL' && styles.filterChipTextActive]}>
            {t.filterAll} ({transactions.length})
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

      {/* 4. TRANSACTION AUDIT LIST */}
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
              <Text style={styles.emptyText}>{t.noRecords}</Text>
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
  }
});
