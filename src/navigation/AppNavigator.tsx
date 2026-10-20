import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { clearUserSession, apiRequest, saveUserSession, UserSession } from '../services/api.service';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { MobileLanguage, mobileTranslations } from '../i18n/translations';
import { canAccessScreen, isSangamAdmin, isCollector, isMember } from '../utils/permissions';

// Member Screens
import { MemberDashboardScreen } from '../screens/member/MemberDashboardScreen';
import { MemberPaymentsScreen } from '../screens/member/MemberPaymentsScreen';
import { MemberProfileScreen } from '../screens/member/MemberProfileScreen';

// Collector Screens
import { CollectorDashboardScreen } from '../screens/collector/CollectorDashboardScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminMembersScreen } from '../screens/admin/AdminMembersScreen';
import { AdminCollectionsScreen } from '../screens/admin/AdminCollectionsScreen';
import { AdminDonationsScreen } from '../screens/admin/AdminDonationsScreen';
import { AdminExpensesScreen } from '../screens/admin/AdminExpensesScreen';
import { AdminEventsScreen } from '../screens/admin/AdminEventsScreen';
import { AdminLedgerScreen } from '../screens/admin/AdminLedgerScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { AdminMoreMenuScreen } from '../screens/admin/AdminMoreMenuScreen';

export const AppNavigator = ({ user, setUser }: { user: any; setUser: (u: any) => void }) => {
  const [lang, setLang] = useState<MobileLanguage>('ta');

  // Navigation state
  // Member tabs: 'HOME' | 'PAYMENTS' | 'PROFILE'
  // Collector tabs: 'HOME' | 'COLLECT' | 'DONATIONS' | 'EVENTS' | 'PROFILE'
  // Admin tabs: 'DASHBOARD' | 'MEMBERS' | 'COLLECTIONS' | 'DONATIONS' | 'MORE'
  // Admin sub-screens: 'EXPENSES' | 'EVENTS' | 'LEDGER' | 'SETTINGS' | 'PROFILE'
  const [activeTab, setActiveTab] = useState<string>(
    isSangamAdmin(user?.role) ? 'DASHBOARD' : 'HOME'
  );
  const [adminSubScreen, setAdminSubScreen] = useState<string | null>(null);

  useEffect(() => {
    if (user?.token) {
      refreshSangamBranding();
      // Reset active tab to default for role if out of sync
      if (isMember(user.role) && !['HOME', 'PAYMENTS', 'PROFILE'].includes(activeTab)) {
        setActiveTab('HOME');
      } else if (isCollector(user.role) && !['HOME', 'COLLECT', 'DONATIONS', 'EVENTS', 'PROFILE'].includes(activeTab)) {
        setActiveTab('HOME');
      } else if (isSangamAdmin(user.role) && !['DASHBOARD', 'MEMBERS', 'COLLECTIONS', 'DONATIONS', 'MORE'].includes(activeTab)) {
        setActiveTab('DASHBOARD');
      }
    }
  }, [user?.token, user?.role]);

  const refreshSangamBranding = async () => {
    try {
      const res = await apiRequest('/sangam/info');
      if (res.success && res.data) {
        const liveSlogan = res.data.slogan ? String(res.data.slogan).trim() : '';
        const liveName = res.data.name ? String(res.data.name).trim() : '';
        if (liveSlogan && (liveSlogan !== user?.slogan || (liveName && liveName !== user?.sangamName))) {
          const updated: UserSession = {
            ...user,
            slogan: liveSlogan,
            sangamName: liveName || user.sangamName
          };
          setUser(updated);
          await saveUserSession(updated);
        }
      }
    } catch (e) {
      // offline fallback
    }
  };

  const handleBrandingUpdate = (newSlogan: string, newSangamName?: string) => {
    if (!user) return;
    const cleanSlogan = newSlogan ? newSlogan.trim() : '';
    const cleanName = newSangamName ? newSangamName.trim() : undefined;
    if (cleanSlogan && (cleanSlogan !== user.slogan || (cleanName && cleanName !== user.sangamName))) {
      setUser((prev: any) => ({
        ...prev,
        slogan: cleanSlogan,
        sangamName: cleanName || prev?.sangamName
      }));
    }
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  const handleLogout = async () => {
    await clearUserSession();
    setActiveTab('HOME');
    setUser(null);
  };

  const t = mobileTranslations[lang];
  const userRole = user.role;

  // Handle Tab Change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setAdminSubScreen(null);
  };

  // Render Active Screen for Member
  const renderMemberContent = () => {
    switch (activeTab) {
      case 'HOME':
        return (
          <MemberDashboardScreen
            lang={lang}
            onNavigateToPayments={() => setActiveTab('PAYMENTS')}
            onNavigateToProfile={() => setActiveTab('PROFILE')}
            onBrandingUpdate={handleBrandingUpdate}
          />
        );
      case 'PAYMENTS':
        return (
          <MemberPaymentsScreen
            lang={lang}
            sangamName={user.sangamName}
            sangamSlogan={user.slogan}
            onBrandingUpdate={handleBrandingUpdate}
          />
        );
      case 'PROFILE':
        return (
          <MemberProfileScreen
            lang={lang}
            setLang={setLang}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <MemberDashboardScreen
            lang={lang}
            onNavigateToPayments={() => setActiveTab('PAYMENTS')}
            onNavigateToProfile={() => setActiveTab('PROFILE')}
            onBrandingUpdate={handleBrandingUpdate}
          />
        );
    }
  };

  // Render Active Screen for Collector
  const renderCollectorContent = () => {
    switch (activeTab) {
      case 'HOME':
        return (
          <MemberDashboardScreen
            lang={lang}
            onNavigateToPayments={() => handleTabChange('COLLECT')}
            onNavigateToProfile={() => handleTabChange('PROFILE')}
            onBrandingUpdate={handleBrandingUpdate}
          />
        );
      case 'COLLECT':
        return (
          <CollectorDashboardScreen
            lang={lang}
            sangamName={user.sangamName}
            sangamSlogan={user.slogan}
            onLogout={handleLogout}
          />
        );
      case 'DONATIONS':
        return (
          <AdminDonationsScreen
            lang={lang}
            sangamName={user.sangamName}
            sangamSlogan={user.slogan}
          />
        );
      case 'EVENTS':
        return (
          <AdminEventsScreen
            lang={lang}
            userRole={userRole}
          />
        );
      case 'PROFILE':
        return (
          <MemberProfileScreen
            lang={lang}
            setLang={setLang}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <MemberDashboardScreen
            lang={lang}
            onNavigateToPayments={() => handleTabChange('COLLECT')}
            onNavigateToProfile={() => handleTabChange('PROFILE')}
            onBrandingUpdate={handleBrandingUpdate}
          />
        );
    }
  };

  // Render Active Screen for Sangam Admin / Super Admin
  const renderAdminContent = () => {
    // If in sub-screen under MORE
    if (activeTab === 'MORE' && adminSubScreen) {
      return (
        <View style={{ flex: 1 }}>
          <View style={styles.subScreenHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setAdminSubScreen(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>◀ {t.more}</Text>
            </TouchableOpacity>
            <Text style={styles.subScreenTitle}>
              {adminSubScreen === 'EXPENSES'
                ? t.expenses
                : adminSubScreen === 'EVENTS'
                ? t.events
                : adminSubScreen === 'LEDGER'
                ? t.ledger
                : adminSubScreen === 'SETTINGS'
                ? t.settings
                : t.profile}
            </Text>
          </View>

          {adminSubScreen === 'EXPENSES' && <AdminExpensesScreen lang={lang} />}
          {adminSubScreen === 'EVENTS' && <AdminEventsScreen lang={lang} userRole={userRole} />}
          {adminSubScreen === 'LEDGER' && <AdminLedgerScreen lang={lang} />}
          {adminSubScreen === 'SETTINGS' && (
            <AdminSettingsScreen
              lang={lang}
              onBrandingUpdate={handleBrandingUpdate}
              onLogout={handleLogout}
            />
          )}
          {adminSubScreen === 'PROFILE' && (
            <MemberProfileScreen
              lang={lang}
              setLang={setLang}
              onLogout={handleLogout}
            />
          )}
        </View>
      );
    }

    switch (activeTab) {
      case 'DASHBOARD':
        return (
          <AdminDashboardScreen
            lang={lang}
            onNavigateTab={(tabKey) => {
              if (['MEMBERS', 'COLLECTIONS', 'DONATIONS'].includes(tabKey)) {
                setActiveTab(tabKey);
                setAdminSubScreen(null);
              } else if (['EXPENSES', 'EVENTS', 'LEDGER', 'SETTINGS'].includes(tabKey)) {
                setActiveTab('MORE');
                setAdminSubScreen(tabKey);
              }
            }}
            onBrandingUpdate={handleBrandingUpdate}
          />
        );
      case 'MEMBERS':
        return <AdminMembersScreen lang={lang} />;
      case 'COLLECTIONS':
        return (
          <AdminCollectionsScreen
            lang={lang}
            userRole={user.role}
            sangamName={user.sangamName}
            sangamSlogan={user.slogan}
          />
        );
      case 'DONATIONS':
        return (
          <AdminDonationsScreen
            lang={lang}
            sangamName={user.sangamName}
            sangamSlogan={user.slogan}
          />
        );
      case 'MORE':
        return (
          <AdminMoreMenuScreen
            lang={lang}
            onSelectScreen={(screenId) => setAdminSubScreen(screenId)}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <AdminDashboardScreen
            lang={lang}
            onNavigateTab={(tabKey) => handleTabChange(tabKey)}
            onBrandingUpdate={handleBrandingUpdate}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* TOP BRANDING APP BAR */}
      <View style={styles.topBar}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.titleRow}>
            <Text style={styles.barTitle} numberOfLines={1}>
              {user.sangamName ? String(user.sangamName).trim() : 'Oor Nithi (ஊர் நிதி)'}
            </Text>
            <View style={[styles.roleBadge, isSangamAdmin(userRole) ? styles.badgeAdmin : isCollector(userRole) ? styles.badgeCollector : styles.badgeMember]}>
              <Text style={styles.roleBadgeText}>
                {userRole === 'SANGAM_ADMIN' ? 'Admin' : userRole === 'COLLECTOR' ? 'Collector' : 'Member'}
              </Text>
            </View>
          </View>
          <Text style={styles.barSlogan} numberOfLines={1}>
            {user.slogan ? String(user.slogan).trim() : '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️'}
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.langToggleBtn}
            onPress={() => setLang(lang === 'en' ? 'ta' : 'en')}
            activeOpacity={0.8}
          >
            <Text style={styles.langToggleText}>{lang === 'en' ? 'தமிழ்' : 'EN'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY CONTENT */}
      <View style={{ flex: 1 }}>
        {isMember(userRole)
          ? renderMemberContent()
          : isCollector(userRole)
          ? renderCollectorContent()
          : renderAdminContent()}
      </View>

      {/* BOTTOM NAVIGATION BARS */}
      {/* 1. MEMBER BOTTOM NAV */}
      {isMember(userRole) && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('HOME')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'HOME' && styles.navIconActive]}>🏛️</Text>
            <Text style={[styles.navLabel, activeTab === 'HOME' && styles.navLabelActive]} numberOfLines={1}>
              {lang === 'ta' ? 'முகப்பு' : 'Home'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('PAYMENTS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'PAYMENTS' && styles.navIconActive]}>💳</Text>
            <Text style={[styles.navLabel, activeTab === 'PAYMENTS' && styles.navLabelActive]} numberOfLines={1}>
              {t.myPayments}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('PROFILE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'PROFILE' && styles.navIconActive]}>👤</Text>
            <Text style={[styles.navLabel, activeTab === 'PROFILE' && styles.navLabelActive]} numberOfLines={1}>
              {t.profile}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. COLLECTOR BOTTOM NAV */}
      {isCollector(userRole) && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('HOME')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'HOME' && styles.navIconActive]}>🏛️</Text>
            <Text style={[styles.navLabel, activeTab === 'HOME' && styles.navLabelActive]} numberOfLines={1}>
              {lang === 'ta' ? 'முகப்பு' : 'Home'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('COLLECT')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'COLLECT' && styles.navIconActive]}>💵</Text>
            <Text style={[styles.navLabel, activeTab === 'COLLECT' && styles.navLabelActive]} numberOfLines={1}>
              {lang === 'ta' ? 'வசூல்' : 'Collect'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('DONATIONS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'DONATIONS' && styles.navIconActive]}>🤝</Text>
            <Text style={[styles.navLabel, activeTab === 'DONATIONS' && styles.navLabelActive]} numberOfLines={1}>
              {t.donations}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('EVENTS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'EVENTS' && styles.navIconActive]}>🛕</Text>
            <Text style={[styles.navLabel, activeTab === 'EVENTS' && styles.navLabelActive]} numberOfLines={1}>
              {t.events}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('PROFILE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'PROFILE' && styles.navIconActive]}>👤</Text>
            <Text style={[styles.navLabel, activeTab === 'PROFILE' && styles.navLabelActive]} numberOfLines={1}>
              {t.profile}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. SANGAM ADMIN BOTTOM NAV */}
      {isSangamAdmin(userRole) && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('DASHBOARD')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'DASHBOARD' && styles.navIconActive]}>📊</Text>
            <Text style={[styles.navLabel, activeTab === 'DASHBOARD' && styles.navLabelActive]} numberOfLines={1}>
              {t.dashboard}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('MEMBERS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'MEMBERS' && styles.navIconActive]}>👥</Text>
            <Text style={[styles.navLabel, activeTab === 'MEMBERS' && styles.navLabelActive]} numberOfLines={1}>
              {t.members}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('COLLECTIONS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'COLLECTIONS' && styles.navIconActive]}>📑</Text>
            <Text style={[styles.navLabel, activeTab === 'COLLECTIONS' && styles.navLabelActive]} numberOfLines={1}>
              {t.collections}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('DONATIONS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'DONATIONS' && styles.navIconActive]}>🤝</Text>
            <Text style={[styles.navLabel, activeTab === 'DONATIONS' && styles.navLabelActive]} numberOfLines={1}>
              {t.donations}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleTabChange('MORE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'MORE' && styles.navIconActive]}>☰</Text>
            <Text style={[styles.navLabel, activeTab === 'MORE' && styles.navLabelActive]} numberOfLines={1}>
              {t.more}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    backgroundColor: '#0B3C2D',
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  barTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    flexShrink: 1
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6
  },
  badgeAdmin: {
    backgroundColor: '#FEF3C7'
  },
  badgeCollector: {
    backgroundColor: '#E0F2FE'
  },
  badgeMember: {
    backgroundColor: '#DCFCE7'
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F172A'
  },
  barSlogan: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14
  },
  langToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold'
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 3
  },
  navIcon: {
    fontSize: 19,
    marginBottom: 2,
    opacity: 0.6
  },
  navIconActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }]
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center'
  },
  navLabelActive: {
    color: '#0B3C2D',
    fontWeight: '900'
  },
  subScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 12
  },
  backBtnText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#0B3C2D'
  },
  subScreenTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  }
});
