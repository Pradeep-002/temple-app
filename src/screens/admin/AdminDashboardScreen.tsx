import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { apiRequest } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

interface AdminDashboardProps {
  lang?: MobileLanguage;
  onNavigateTab: (tab: string) => void;
  onBrandingUpdate?: (slogan: string, sangamName?: string) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardProps> = ({
  lang = 'ta',
  onNavigateTab,
  onBrandingUpdate
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/reports/sangam-dashboard');
      if (res.success && res.data) {
        setDashboard(res.data);
        if (onBrandingUpdate && res.data.slogan) {
          onBrandingUpdate(res.data.slogan, res.data.sangamName);
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
    loadDashboard();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0B3C2D" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  const availableBalance = dashboard?.availableBalance != null ? Number(dashboard.availableBalance) : 0;
  const totalDonations = dashboard?.totalDonations != null ? Number(dashboard.totalDonations) : 0;
  const totalExpenses = dashboard?.totalExpenses != null ? Number(dashboard.totalExpenses) : 0;
  const totalCollection = dashboard?.totalCollection != null ? Number(dashboard.totalCollection) : 0;
  const totalMembers = dashboard?.totalMembers || 0;
  const totalAdmins = dashboard?.totalAdmins != null ? Number(dashboard.totalAdmins) : 1;
  const totalCollectors = dashboard?.totalCollectors || 0;
  const cyclePending = dashboard?.thisMonthPending != null
    ? Number(dashboard.thisMonthPending)
    : (dashboard?.totalPending != null ? Number(dashboard.totalPending) : 0);
  const recentActivities = dashboard?.recentActivities || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
    >
      {/* 1. HERO AVAILABLE BALANCE CARD */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{t.availableBalance}</Text>
        <Text style={styles.heroAmount}>₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroSubRow}>
          <View style={styles.heroSubItem}>
            <Text style={styles.heroSubLabel}>{t.members}</Text>
            <Text style={styles.heroSubVal}>{totalMembers}</Text>
          </View>
          <View style={[styles.heroSubItem, styles.heroSubItemMiddle]}>
            <Text style={styles.heroSubLabel}>{t.admins}</Text>
            <Text style={styles.heroSubVal}>{totalAdmins}</Text>
          </View>
          <View style={styles.heroSubItem}>
            <Text style={styles.heroSubLabel}>{t.collectors}</Text>
            <Text style={styles.heroSubVal}>{totalCollectors}</Text>
          </View>
        </View>
      </View>

      {/* 2. FINANCIAL STATS GRID */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#10B981' }]}
          onPress={() => onNavigateTab('COLLECTIONS')}
          activeOpacity={0.8}
        >
          <Text style={styles.statLabel}>{t.totalCycleCollection}</Text>
          <Text style={styles.statVal}>₹{totalCollection.toLocaleString('en-IN')}</Text>
          <Text style={styles.statHint}>➔ {t.viewAll}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#EF4444' }]}
          onPress={() => onNavigateTab('COLLECTIONS')}
          activeOpacity={0.8}
        >
          <Text style={[styles.statLabel, { color: '#B91C1C' }]}>{t.cyclePending}</Text>
          <Text style={[styles.statVal, { color: '#DC2626' }]}>₹{cyclePending.toLocaleString('en-IN')}</Text>
          <Text style={[styles.statHint, { color: '#B91C1C' }]}>➔ {t.viewAll}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#D4AF37' }]}
          onPress={() => onNavigateTab('DONATIONS')}
          activeOpacity={0.8}
        >
          <Text style={styles.statLabel}>{t.totalDonations}</Text>
          <Text style={styles.statVal}>₹{totalDonations.toLocaleString('en-IN')}</Text>
          <Text style={styles.statHint}>➔ {t.viewAll}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#F97316' }]}
          onPress={() => onNavigateTab('EXPENSES')}
          activeOpacity={0.8}
        >
          <Text style={styles.statLabel}>{t.totalExpenses}</Text>
          <Text style={styles.statVal}>₹{totalExpenses.toLocaleString('en-IN')}</Text>
          <Text style={styles.statHint}>➔ {t.viewAll}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#6366F1' }]}
          onPress={() => onNavigateTab('LEDGER')}
          activeOpacity={0.8}
        >
          <Text style={styles.statLabel}>{t.ledger}</Text>
          <Text style={styles.statVal}>Audit Trail</Text>
          <Text style={styles.statHint}>➔ {t.viewAll}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statBox, { borderLeftColor: '#8B5CF6' }]}
          onPress={() => onNavigateTab('EVENTS')}
          activeOpacity={0.8}
        >
          <Text style={styles.statLabel}>{t.events}</Text>
          <Text style={styles.statVal}>{dashboard?.totalEvents != null ? `${dashboard.totalEvents} Events` : (lang === 'ta' ? 'நிகழ்வுகள்' : 'Events')}</Text>
          <Text style={styles.statHint}>➔ {t.viewAll}</Text>
        </TouchableOpacity>
      </View>

      {/* 3. QUICK ACTION BUTTONS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.quickActions}</Text>
      </View>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onNavigateTab('MEMBERS')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
            <Text style={styles.actionIcon}>👥</Text>
          </View>
          <Text style={styles.actionText}>{t.members}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onNavigateTab('COLLECTIONS')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
            <Text style={styles.actionIcon}>📑</Text>
          </View>
          <Text style={styles.actionText}>{t.collections}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onNavigateTab('EVENTS')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.actionIcon}>🛕</Text>
          </View>
          <Text style={styles.actionText}>{t.events}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onNavigateTab('SETTINGS')}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
            <Text style={styles.actionIcon}>⚙️</Text>
          </View>
          <Text style={styles.actionText}>{t.settings}</Text>
        </TouchableOpacity>
      </View>

      {/* 4. RECENT ACTIVITIES FEED */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
      </View>

      {recentActivities.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t.noRecords}</Text>
        </View>
      ) : (
        recentActivities.slice(0, 10).map((act: any, idx: number) => {
          const isIncome = act.type === 'COLLECTION' || act.type === 'DONATION';
          const icon = act.type === 'COLLECTION' ? '📑' : act.type === 'DONATION' ? '🤝' : '💸';
          const dateStr = act.date ? new Date(act.date).toLocaleDateString('en-IN') : '';

          return (
            <View key={idx} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: isIncome ? '#ECFDF5' : '#FEF2F2' }]}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle} numberOfLines={1}>{act.title || act.type}</Text>
                <Text style={styles.activityMeta}>{act.type} • {dateStr}</Text>
              </View>
              <Text style={[styles.activityAmount, { color: isIncome ? '#16A34A' : '#DC2626' }]}>
                {isIncome ? '+' : '-'} ₹{Number(act.amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 14
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B'
  },
  heroCard: {
    backgroundColor: '#0B3C2D',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    marginBottom: 16
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE047',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  heroAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 14
  },
  heroSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroSubItem: {
    flex: 1,
    alignItems: 'center'
  },
  heroSubItemMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 4
  },
  heroSubLabel: {
    fontSize: 9.5,
    color: '#E2E8F0',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  heroSubVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase'
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4
  },
  statHint: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0B3C2D'
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 6
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18
  },
  actionBtn: {
    alignItems: 'center',
    width: '22%'
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  actionIcon: {
    fontSize: 20
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8'
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  activityInfo: {
    flex: 1
  },
  activityTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A'
  },
  activityMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  },
  activityAmount: {
    fontSize: 13,
    fontWeight: '800'
  }
});
