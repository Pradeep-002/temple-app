import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  TextInput,
  Image
} from 'react-native';
import { apiRequest, getUserSession, saveUserSession, getMediaUrl } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

interface DashboardMetrics {
  sangamName?: string;
  slogan?: string;
  totalMembers?: number;
  totalCollection?: number;
  totalDonations?: number;
  totalExpenses?: number;
  totalEventExpenses?: number;
  availableBalance?: number;
  recentActivities?: any[];
}

export const MemberDashboardScreen = ({
  lang = 'ta',
  onNavigateToPayments,
  onNavigateToProfile,
  onBrandingUpdate
}: {
  lang?: MobileLanguage;
  onNavigateToPayments?: () => void;
  onNavigateToProfile?: () => void;
  onBrandingUpdate?: (slogan: string, sangamName?: string) => void;
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [allDonations, setAllDonations] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [userCode, setUserCode] = useState('');
  const [sangamName, setSangamName] = useState('');
  const [slogan, setSlogan] = useState('');

  // Modals for detail views
  const [donationsModalVisible, setDonationsModalVisible] = useState(false);
  const [expensesModalVisible, setExpensesModalVisible] = useState(false);
  const [activitiesModalVisible, setActivitiesModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Events State
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [receiptImageModalVisible, setReceiptImageModalVisible] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const session = await getUserSession();
      if (session) {
        setUserName(session.name);
        setUserCode(session.memberCode || 'MEMBER');
        setSangamName(session.sangamName || 'Oor Nithi Sangam');
        setSlogan(session.slogan || '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️');
      }

      // 1. Fetch Live Sangam Branding Info (from Sangam Settings configured by Admin)
      try {
        const sangamRes = await apiRequest('/sangam/info');
        if (sangamRes.success && sangamRes.data) {
          const liveSlogan = sangamRes.data.slogan;
          const liveName = sangamRes.data.name;
          if (liveSlogan) {
            setSlogan(liveSlogan);
          }
          if (liveName) {
            setSangamName(liveName);
          }
          if (session && (liveSlogan !== session.slogan || (liveName && liveName !== session.sangamName))) {
            const updated = {
              ...session,
              slogan: liveSlogan || session.slogan,
              sangamName: liveName || session.sangamName
            };
            await saveUserSession(updated);
            if (onBrandingUpdate && liveSlogan) {
              onBrandingUpdate(liveSlogan, liveName);
            }
          }
        }
      } catch (e) {
        // network fallback
      }

      // 2. Fetch Sangam Dashboard Metrics
      const dashRes = await apiRequest('/reports/sangam-dashboard');
      if (dashRes.success && dashRes.data) {
        setMetrics(dashRes.data);
        if (dashRes.data.slogan) {
          setSlogan(dashRes.data.slogan);
          if (onBrandingUpdate) {
            onBrandingUpdate(dashRes.data.slogan, dashRes.data.sangamName);
          }
        }
        if (dashRes.data.sangamName) {
          setSangamName(dashRes.data.sangamName);
        }
      }

      // 3. Fetch Sangam Donations (for recent donations & view all)
      const donRes = await apiRequest('/donations');
      if (donRes.success && donRes.data) {
        const sorted = (donRes.data as any[]).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.donationDate).getTime();
          const dateB = new Date(b.createdAt || b.donationDate).getTime();
          return dateB - dateA;
        });
        setAllDonations(sorted);
        setRecentDonations(sorted.slice(0, 5));
      }

      // 4. Fetch Sangam Expenses (for detail view)
      const expRes = await apiRequest('/expenses');
      if (expRes.success && expRes.data) {
        const sorted = (expRes.data as any[]).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.expenseDate).getTime();
          const dateB = new Date(b.createdAt || b.expenseDate).getTime();
          return dateB - dateA;
        });
        setAllExpenses(sorted);
      }

      // 5. Fetch Sangam Events
      try {
        const evRes = await apiRequest('/events');
        if (evRes.success && evRes.data) {
          setEvents(evRes.data);
        }
      } catch (e) {
        // network fallback
      }
    } catch (err) {
      console.error('Failed to load member dashboard metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const filteredDonations = allDonations.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.donorName && d.donorName.toLowerCase().includes(q)) ||
      (d.donationPurpose && d.donationPurpose.toLowerCase().includes(q))
    );
  });

  const filteredExpenses = allExpenses.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.expenseCategory && e.expenseCategory.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0B3C2D" />
        <Text style={styles.loadingText}>Loading Sangam Financial Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* SANGAM HEADER BANNER */}
      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.bannerSlogan} numberOfLines={2}>{slogan}</Text>
            <Text style={styles.bannerSangam} numberOfLines={2}>{sangamName}</Text>
            <View style={styles.userBadgeRow}>
              <Text style={styles.bannerUserText}>
                👤 {userName} • <Text style={styles.codeHighlight}>{userCode}</Text>
              </Text>
            </View>
          </View>
          {onNavigateToProfile && (
            <TouchableOpacity
              style={styles.settingsCircleBtn}
              onPress={onNavigateToProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.settingsCircleIcon}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FINANCIAL SUMMARY CARDS GRID */}
      <Text style={styles.sectionHeader}>{t.financialDetails}</Text>

      {/* CARD 1: AVAILABLE BALANCE (FEATURED) */}
      <TouchableOpacity
        style={[styles.featureCard, { borderColor: '#10B981' }]}
        activeOpacity={0.8}
        onPress={() => setActivitiesModalVisible(true)}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.iconCircleEmerald}>
            <Text style={{ fontSize: 20 }}>💰</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardLabel}>{t.availableBalance}</Text>
            <Text style={styles.cardSub}>Remaining Sangam Balance (Credits - Expenses)</Text>
          </View>
          <Text style={styles.chevronText}>›</Text>
        </View>
        <Text style={styles.balanceAmountText}>
          ₹{(metrics?.availableBalance ?? 0).toLocaleString('en-IN')}
        </Text>
        <View style={styles.cardFooterHint}>
          <Text style={styles.hintText}>Tap to view recent financial activities</Text>
        </View>
      </TouchableOpacity>

      {/* 2X2 CARDS GRID */}
      <View style={styles.gridRow}>
        {/* CARD 2: TOTAL DONATIONS */}
        <TouchableOpacity
          style={[styles.gridCard, { borderLeftColor: '#F59E0B' }]}
          activeOpacity={0.7}
          onPress={() => {
            setSearchQuery('');
            setDonationsModalVisible(true);
          }}
        >
          <View style={styles.gridTop}>
            <Text style={styles.gridIcon}>🙏</Text>
            <Text style={styles.gridLabel}>{t.totalDonations}</Text>
          </View>
          <Text style={[styles.gridVal, { color: '#B45309' }]}>
            ₹{(metrics?.totalDonations ?? 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.viewLinkText}>View All ›</Text>
        </TouchableOpacity>

        {/* CARD 3: TOTAL EXPENSES */}
        <TouchableOpacity
          style={[styles.gridCard, { borderLeftColor: '#EF4444' }]}
          activeOpacity={0.7}
          onPress={() => {
            setSearchQuery('');
            setExpensesModalVisible(true);
          }}
        >
          <View style={styles.gridTop}>
            <Text style={styles.gridIcon}>🧾</Text>
            <Text style={styles.gridLabel}>{t.totalExpenses}</Text>
          </View>
          <Text style={[styles.gridVal, { color: '#DC2626' }]}>
            ₹{(metrics?.totalExpenses ?? 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.viewLinkText}>View All ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridRow}>
        {/* CARD 4: TOTAL CYCLE COLLECTION */}
        <TouchableOpacity
          style={[styles.gridCard, { borderLeftColor: '#3B82F6', flex: 1 }]}
          activeOpacity={0.7}
          onPress={onNavigateToPayments}
        >
          <View style={styles.gridTop}>
            <Text style={styles.gridIcon}>🔄</Text>
            <Text style={styles.gridLabel}>{t.totalCycleCollection}</Text>
          </View>
          <Text style={[styles.gridVal, { color: '#1D4ED8' }]}>
            ₹{(metrics?.totalCollection ?? 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.viewLinkText}>My Payments ›</Text>
        </TouchableOpacity>
      </View>

      {/* SANGAM EVENTS SECTION */}
      <View style={styles.recentSectionHeaderRow}>
        <Text style={styles.sectionHeader}>{t.sangamEvents || 'Sangam Events'}</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 26, marginBottom: 4 }}>🛕</Text>
          <Text style={styles.emptyCardText}>{t.noUpcomingEvents || 'No upcoming events'}</Text>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {events.map((ev, idx) => {
            const budget = ev.expectedBudget ?? 0;
            const expTotal = ev.totalExpenses ?? 0;
            const remaining = ev.remainingBudget ?? (budget - expTotal);
            return (
              <TouchableOpacity
                key={ev.id || idx}
                style={styles.eventCard}
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedEvent(ev);
                  setEventModalVisible(true);
                }}
              >
                <View style={styles.eventCardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.eventCardTitle} numberOfLines={2}>
                      {ev.eventName}
                    </Text>
                    {ev.tamilEventName ? (
                      <Text style={styles.eventCardTamilTitle} numberOfLines={1}>
                        {ev.tamilEventName}
                      </Text>
                    ) : null}
                    <Text style={styles.eventCardTemple} numberOfLines={1}>
                      🛕 {ev.templeName || sangamName}
                    </Text>
                  </View>
                  <View style={[styles.eventBadge, ev.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeUpcoming]}>
                    <Text style={[styles.eventBadgeText, ev.status === 'COMPLETED' ? styles.badgeCompletedText : styles.badgeUpcomingText]}>
                      {ev.status || 'UPCOMING'}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventInfoRow}>
                  <Text style={styles.eventDateText}>
                    📅 {ev.startDate}{ev.endDate && ev.endDate !== ev.startDate ? ` – ${ev.endDate}` : ''}
                  </Text>
                  {ev.location ? (
                    <Text style={styles.eventLocationText} numberOfLines={1}>
                      📍 {ev.location}
                    </Text>
                  ) : null}
                </View>

                {ev.description ? (
                  <Text style={styles.eventCardDesc} numberOfLines={2}>
                    {ev.description}
                  </Text>
                ) : null}

                {/* Event Financial Summary in Card */}
                <View style={styles.eventFinSummaryRow}>
                  <View style={styles.eventFinCol}>
                    <Text style={styles.eventFinLabel}>{t.expectedBudget || 'Budget'}</Text>
                    <Text style={styles.eventFinAmount}>₹{budget.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.eventFinDivider} />
                  <View style={styles.eventFinCol}>
                    <Text style={styles.eventFinLabel}>{t.totalEventExpenses || 'Expenses'}</Text>
                    <Text style={[styles.eventFinAmount, { color: '#DC2626' }]}>
                      ₹{expTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.eventFinDivider} />
                  <View style={styles.eventFinCol}>
                    <Text style={styles.eventFinLabel}>{t.remainingBudget || 'Remaining'}</Text>
                    <Text style={[styles.eventFinAmount, { color: remaining >= 0 ? '#166534' : '#DC2626' }]}>
                      ₹{remaining.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventCardFooter}>
                  <Text style={styles.viewDetailsLink}>{t.viewDetails || 'View Details'} ›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* RECENT DONATIONS SECTION */}
      <View style={styles.recentSectionHeaderRow}>
        <Text style={styles.sectionHeader}>{t.recentDonations}</Text>
        {allDonations.length > 5 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setDonationsModalVisible(true);
            }}
          >
            <Text style={styles.viewAllButtonText}>{t.viewAll}</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentDonations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 24, marginBottom: 4 }}>📜</Text>
          <Text style={styles.emptyCardText}>No recent donations recorded</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {recentDonations.map((item, idx) => (
            <View key={item.id || idx} style={styles.donationItem}>
              <View style={styles.donationLeft}>
                <View style={styles.donorAvatar}>
                  <Text style={styles.donorAvatarText}>
                    {item.donorName ? item.donorName.charAt(0).toUpperCase() : 'D'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.donorName}>{item.donorName || 'Devotee'}</Text>
                  <Text style={styles.donationPurpose}>
                    {item.donationPurpose || 'General Temple Fund'}
                  </Text>
                  <Text style={styles.donationDate}>
                    📅 {item.donationDate || (item.createdAt ? item.createdAt.substring(0, 10) : '—')} • {item.paymentMode || 'CASH'}
                  </Text>
                </View>
              </View>
              <View style={styles.donationRight}>
                <Text style={styles.donationAmount}>
                  +₹{item.amount?.toLocaleString('en-IN')}
                </Text>
                <View style={styles.receivedBadge}>
                  <Text style={styles.receivedBadgeText}>RECEIVED</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ALL DONATIONS MODAL */}
      <Modal
        visible={donationsModalVisible}
        animationType="slide"
        onRequestClose={() => setDonationsModalVisible(false)}
      >
        <View style={styles.fullModalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalHeaderTitle}>{t.allDonations}</Text>
              <Text style={styles.modalHeaderSub}>Total: ₹{(metrics?.totalDonations ?? 0).toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity onPress={() => setDonationsModalVisible(false)} style={styles.closeBtnCircle}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search by donor name or purpose..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredDonations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.detailCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.detailCardTitle}>{item.donorName || 'Devotee'}</Text>
                  <Text style={styles.detailCardAmount}>₹{item.amount?.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.detailCardSub}>{item.donationPurpose}</Text>
                <View style={styles.detailCardFooter}>
                  <Text style={styles.detailCardDate}>
                    📅 {item.donationDate || (item.createdAt ? item.createdAt.substring(0, 10) : '—')}
                  </Text>
                  <Text style={styles.detailCardMode}>Mode: {item.paymentMode || 'CASH'}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </Modal>

      {/* ALL EXPENSES MODAL */}
      <Modal
        visible={expensesModalVisible}
        animationType="slide"
        onRequestClose={() => setExpensesModalVisible(false)}
      >
        <View style={styles.fullModalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalHeaderTitle}>{t.allExpenses}</Text>
              <Text style={styles.modalHeaderSub}>Total: ₹{(metrics?.totalExpenses ?? 0).toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity onPress={() => setExpensesModalVisible(false)} style={styles.closeBtnCircle}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search category, description, payee..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={[styles.detailCard, { borderLeftColor: '#EF4444' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.detailCardTitle}>{item.expenseCategory}</Text>
                  <Text style={[styles.detailCardAmount, { color: '#DC2626' }]}>
                    -₹{item.amount?.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.detailCardSub}>{item.description}</Text>
                {item.paidTo ? (
                  <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Paid to: {item.paidTo}</Text>
                ) : null}
                <View style={styles.detailCardFooter}>
                  <Text style={styles.detailCardDate}>
                    📅 {item.expenseDate || (item.createdAt ? item.createdAt.substring(0, 10) : '—')}
                  </Text>
                  <Text style={styles.detailCardMode}>Mode: {item.paymentMode || 'CASH'}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </Modal>

      {/* RECENT FINANCIAL ACTIVITIES MODAL */}
      <Modal
        visible={activitiesModalVisible}
        animationType="slide"
        onRequestClose={() => setActivitiesModalVisible(false)}
      >
        <View style={styles.fullModalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalHeaderTitle}>Financial Transactions</Text>
              <Text style={styles.modalHeaderSub}>Ledger Credits & Debits</Text>
            </View>
            <TouchableOpacity onPress={() => setActivitiesModalVisible(false)} style={styles.closeBtnCircle}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={metrics?.recentActivities || []}
            keyExtractor={(_, idx) => idx.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const isDebit = item.type === 'EXPENSE';
              return (
                <View style={[styles.detailCard, { borderLeftColor: isDebit ? '#EF4444' : '#10B981' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.detailCardTitle}>{item.title}</Text>
                    <Text style={[styles.detailCardAmount, { color: isDebit ? '#DC2626' : '#166534' }]}>
                      {isDebit ? '-' : '+'}₹{item.amount?.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.detailCardFooter}>
                    <Text style={styles.detailCardDate}>
                      {item.date ? String(item.date).substring(0, 10) : '—'}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDebit ? '#DC2626' : '#166534' }}>
                      {item.type} • {item.status}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </Modal>

      {/* EVENT DETAILS & EXPENSES MODAL */}
      <Modal
        visible={eventModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEventModalVisible(false)}
      >
        <View style={styles.modalOverlayDark}>
          <View style={styles.eventModalContainer}>
            {/* Modal Header */}
            <View style={styles.eventModalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.eventModalTitle}>{selectedEvent?.eventName}</Text>
                {selectedEvent?.tamilEventName ? (
                  <Text style={styles.eventModalTamilTitle}>{selectedEvent.tamilEventName}</Text>
                ) : null}
                <Text style={styles.eventModalTemple}>
                  🛕 {selectedEvent?.templeName || sangamName}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtnCircle}
                onPress={() => setEventModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {/* Event Metadata Card */}
              <View style={styles.detailSectionCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t.eventType || 'Event Type'}</Text>
                  <Text style={styles.detailVal}>{selectedEvent?.eventType || 'Temple Festival'}</Text>
                </View>
                <View style={styles.rowDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t.eventDate || 'Date'}</Text>
                  <Text style={styles.detailVal}>
                    {selectedEvent?.startDate}{selectedEvent?.endDate && selectedEvent.endDate !== selectedEvent.startDate ? ` – ${selectedEvent.endDate}` : ''}
                  </Text>
                </View>
                {selectedEvent?.location ? (
                  <>
                    <View style={styles.rowDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>{t.venue || 'Venue'}</Text>
                      <Text style={styles.detailVal}>{selectedEvent.location}</Text>
                    </View>
                  </>
                ) : null}
                <View style={styles.rowDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t.status || 'Status'}</Text>
                  <View style={[styles.eventBadge, selectedEvent?.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgeUpcoming]}>
                    <Text style={[styles.eventBadgeText, selectedEvent?.status === 'COMPLETED' ? styles.badgeCompletedText : styles.badgeUpcomingText]}>
                      {selectedEvent?.status || 'UPCOMING'}
                    </Text>
                  </View>
                </View>
                {selectedEvent?.description ? (
                  <>
                    <View style={styles.rowDivider} />
                    <View style={{ paddingTop: 8 }}>
                      <Text style={styles.detailKey}>{t.description || 'Description'}</Text>
                      <Text style={styles.detailDescText}>{selectedEvent.description}</Text>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Financial Budget & Balance Card */}
              <Text style={styles.innerSectionHeader}>{t.financialDetails || 'Budget & Financial Details'}</Text>
              <View style={styles.detailSectionCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t.expectedBudget || 'Event Budget'}</Text>
                  <Text style={[styles.detailVal, { color: '#0B3C2D', fontWeight: '900' }]}>
                    ₹{(selectedEvent?.expectedBudget ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.rowDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t.totalEventExpenses || 'Total Expenses'}</Text>
                  <Text style={[styles.detailVal, { color: '#DC2626', fontWeight: '900' }]}>
                    ₹{(selectedEvent?.totalExpenses ?? 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.rowDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>{t.remainingBudget || 'Remaining Budget'}</Text>
                  <Text style={[styles.detailVal, {
                    color: ((selectedEvent?.remainingBudget ?? ((selectedEvent?.expectedBudget ?? 0) - (selectedEvent?.totalExpenses ?? 0))) >= 0) ? '#166534' : '#DC2626',
                    fontWeight: '900'
                  }]}>
                    ₹{(selectedEvent?.remainingBudget ?? ((selectedEvent?.expectedBudget ?? 0) - (selectedEvent?.totalExpenses ?? 0))).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Event Expenses List (Read-Only) */}
              <Text style={styles.innerSectionHeader}>{t.eventExpenses || 'Event Expenses'}</Text>
              {(!selectedEvent?.expenses || selectedEvent.expenses.length === 0) ? (
                <View style={[styles.emptyCard, { backgroundColor: '#F8FAFC', marginVertical: 8 }]}>
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>🧾</Text>
                  <Text style={styles.emptyCardText}>
                    {t.noExpensesForEvent || 'No expenses recorded for this event'}
                  </Text>
                </View>
              ) : (
                <View style={{ marginBottom: 20 }}>
                  {selectedEvent.expenses.map((exp: any, idx: number) => (
                    <View key={exp.id || idx} style={styles.eventExpenseCard}>
                      <View style={styles.expenseItemTop}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.expenseCategoryTitle}>
                            🏷️ {exp.expenseCategory || 'Expense'}
                          </Text>
                          {exp.description ? (
                            <Text style={styles.expenseDescLine}>{exp.description}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.expenseAmountVal}>
                          ₹{(exp.amount ?? 0).toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View style={styles.expenseMetaRow}>
                        <Text style={styles.expenseMetaItem}>
                          📅 {exp.expenseDate || '—'}
                        </Text>
                        {exp.vendorName ? (
                          <Text style={styles.expenseMetaItem}>
                            👤 {exp.vendorName}
                          </Text>
                        ) : null}
                        {exp.paymentMode ? (
                          <Text style={styles.expenseMetaItem}>
                            💵 {exp.paymentMode}
                          </Text>
                        ) : null}
                      </View>

                      {exp.remarks ? (
                        <Text style={styles.expenseRemarksLine}>
                          📝 Notes: {exp.remarks}
                        </Text>
                      ) : null}

                      {exp.receiptUrl ? (
                        <TouchableOpacity
                          style={styles.receiptViewBtn}
                          onPress={() => {
                            setSelectedReceiptUrl(getMediaUrl(exp.receiptUrl));
                            setReceiptImageModalVisible(true);
                          }}
                        >
                          <Text style={styles.receiptViewBtnText}>📎 View Receipt / Bill Image</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Modal Bottom Close */}
            <View style={styles.eventModalBottom}>
              <TouchableOpacity
                style={styles.eventModalCloseButton}
                onPress={() => setEventModalVisible(false)}
              >
                <Text style={styles.eventModalCloseButtonText}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RECEIPT IMAGE PREVIEW MODAL */}
      <Modal
        visible={receiptImageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayDark}
          activeOpacity={1}
          onPress={() => setReceiptImageModalVisible(false)}
        >
          <View style={styles.receiptModalCard}>
            <Text style={styles.receiptModalTitle}>🧾 Receipt / Bill</Text>
            {selectedReceiptUrl ? (
              <Image
                source={{ uri: selectedReceiptUrl }}
                style={{ width: '100%', height: 280, borderRadius: 12, marginVertical: 14 }}
                resizeMode="contain"
              />
            ) : null}
            <TouchableOpacity
              style={styles.receiptCloseBtn}
              onPress={() => setReceiptImageModalVisible(false)}
            >
              <Text style={styles.receiptCloseBtnText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 10 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: 'bold' },
  banner: {
    backgroundColor: '#0B3C2D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingsCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  settingsCircleIcon: {
    fontSize: 22,
    color: '#FFFFFF'
  },
  bannerSlogan: { color: '#FDE68A', fontSize: 12, fontWeight: 'bold' },
  bannerSangam: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 4 },
  userBadgeRow: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  bannerUserText: { color: '#E2E8F0', fontSize: 11, fontWeight: '600' },
  codeHighlight: { color: '#FCD34D', fontWeight: '800' },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircleEmerald: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardLabel: { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  cardSub: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  chevronText: { fontSize: 20, color: '#CBD5E1', fontWeight: 'bold' },
  balanceAmountText: { fontSize: 28, fontWeight: '900', color: '#166534', marginTop: 8 },
  cardFooterHint: { marginTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 6 },
  hintText: { fontSize: 10, color: '#059669', fontWeight: '600' },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2
  },
  gridTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gridIcon: { fontSize: 16, marginRight: 6 },
  gridLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', flex: 1 },
  gridVal: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  viewLinkText: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 6 },
  recentSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8
  },
  viewAllButtonText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  emptyCardText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  listContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  donationLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  donorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  donorAvatarText: { color: '#B45309', fontWeight: '900', fontSize: 14 },
  donorName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  donationPurpose: { fontSize: 11, color: '#475569', marginTop: 1 },
  donationDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  donationRight: { alignItems: 'flex-end', marginLeft: 10 },
  donationAmount: { fontSize: 14, fontWeight: '900', color: '#166534' },
  receivedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  receivedBadgeText: { fontSize: 8, fontWeight: '800', color: '#166534' },
  fullModalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    backgroundColor: '#0B3C2D',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalHeaderTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  modalHeaderSub: { color: '#FCD34D', fontSize: 11, marginTop: 2 },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  searchBox: { padding: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  searchInput: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10, fontSize: 13 },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  detailCardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  detailCardAmount: { fontSize: 15, fontWeight: '900', color: '#166534' },
  detailCardSub: { fontSize: 12, color: '#475569', marginTop: 2 },
  detailCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
  },
  detailCardDate: { fontSize: 10, color: '#94A3B8' },
  detailCardMode: { fontSize: 10, fontWeight: '600', color: '#64748B' },

  // Events Styles
  eventsList: { marginBottom: 12 },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#0B3C2D',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  eventCardTamilTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3C2D',
    marginTop: 2
  },
  eventCardTemple: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 3
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  badgeUpcoming: { backgroundColor: '#DCFCE7' },
  badgeUpcomingText: { color: '#166534' },
  badgeCompleted: { backgroundColor: '#F1F5F9' },
  badgeCompletedText: { color: '#64748B' },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8
  },
  eventDateText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  eventLocationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  eventCardDesc: {
    fontSize: 12,
    color: '#334155',
    marginTop: 8,
    lineHeight: 16
  },
  eventFinSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  eventFinCol: {
    flex: 1,
    alignItems: 'center'
  },
  eventFinLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase'
  },
  eventFinAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2
  },
  eventFinDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1'
  },
  eventCardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8
  },
  viewDetailsLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3C2D'
  },

  // Event Details Modal Styles
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16
  },
  eventModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '88%',
    overflow: 'hidden'
  },
  eventModalHeader: {
    backgroundColor: '#0B3C2D',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  eventModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  eventModalTamilTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FDE68A',
    marginTop: 2
  },
  eventModalTemple: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 4
  },
  detailSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  detailKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700'
  },
  detailVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700'
  },
  detailDescText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginTop: 4
  },
  innerSectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9'
  },

  // Event Expense Items
  eventExpenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  expenseItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  expenseCategoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  expenseDescLine: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2
  },
  expenseAmountVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626'
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6
  },
  expenseMetaItem: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },
  expenseRemarksLine: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4
  },
  receiptViewBtn: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  receiptViewBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8'
  },
  eventModalBottom: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  eventModalCloseButton: {
    backgroundColor: '#0B3C2D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  eventModalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold'
  },

  // Receipt Modal Styles
  receiptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center'
  },
  receiptModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8
  },
  receiptCloseBtn: {
    marginTop: 10,
    backgroundColor: '#0B3C2D',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10
  },
  receiptCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
