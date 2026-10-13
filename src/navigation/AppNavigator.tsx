import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { clearUserSession, apiRequest, saveUserSession, UserSession } from '../services/api.service';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { CollectorDashboardScreen } from '../screens/collector/CollectorDashboardScreen';
import { MemberDashboardScreen } from '../screens/member/MemberDashboardScreen';
import { MemberPaymentsScreen } from '../screens/member/MemberPaymentsScreen';
import { MemberProfileScreen } from '../screens/member/MemberProfileScreen';
import { MobileLanguage, mobileTranslations } from '../i18n/translations';

type MemberTab = 'HOME' | 'PAYMENTS' | 'PROFILE';

export const AppNavigator = ({ user, setUser }: { user: any; setUser: (u: any) => void }) => {
  const [activeTab, setActiveTab] = useState<MemberTab>('HOME');
  const [lang, setLang] = useState<MobileLanguage>('ta');

  useEffect(() => {
    if (user?.token) {
      refreshSangamBranding();
    }
  }, [user?.token, activeTab]);

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
    setUser(null);
  };

  const isMember = user.role === 'MEMBER';
  const t = mobileTranslations[lang];

  return (
    <View style={styles.container}>
      {/* TOP APP BAR */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barTitle} numberOfLines={1}>
            {user.sangamName ? String(user.sangamName).trim() : 'Oor Nithi (ஊர் நிதி)'}
          </Text>
          <Text style={styles.barSlogan} numberOfLines={1}>
            {user.slogan ? String(user.slogan).trim() : '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️'}
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.langToggleBtn}
            onPress={() => setLang(lang === 'en' ? 'ta' : 'en')}
          >
            <Text style={styles.langToggleText}>{lang === 'en' ? 'தமிழ்' : 'EN'}</Text>
          </TouchableOpacity>

          {!isMember && (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutTopBtn}>
              <Text style={styles.logoutText}>{t.logout}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* BODY CONTENT */}
      <View style={{ flex: 1 }}>
        {isMember ? (
          <>
            {activeTab === 'HOME' && (
              <MemberDashboardScreen
                lang={lang}
                onNavigateToPayments={() => setActiveTab('PAYMENTS')}
                onNavigateToProfile={() => setActiveTab('PROFILE')}
                onBrandingUpdate={handleBrandingUpdate}
              />
            )}
            {activeTab === 'PAYMENTS' && (
              <MemberPaymentsScreen
                lang={lang}
                sangamName={user.sangamName}
                sangamSlogan={user.slogan}
                onBrandingUpdate={handleBrandingUpdate}
              />
            )}
            {activeTab === 'PROFILE' && (
              <MemberProfileScreen
                lang={lang}
                setLang={setLang}
                onLogout={handleLogout}
              />
            )}
          </>
        ) : (
          <CollectorDashboardScreen onSelectMember={() => {}} />
        )}
      </View>

      {/* MEMBER BOTTOM NAVIGATION BAR */}
      {isMember && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('HOME')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'HOME' && styles.navIconActive]}>
              🏛️
            </Text>
            <Text style={[styles.navLabel, activeTab === 'HOME' && styles.navLabelActive]}>
              {lang === 'ta' ? 'முகப்பு' : 'Home'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('PAYMENTS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'PAYMENTS' && styles.navIconActive]}>
              💳
            </Text>
            <Text style={[styles.navLabel, activeTab === 'PAYMENTS' && styles.navLabelActive]}>
              {t.myPayments}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('PROFILE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, activeTab === 'PROFILE' && styles.navIconActive]}>
              👤
            </Text>
            <Text style={[styles.navLabel, activeTab === 'PROFILE' && styles.navLabelActive]}>
              {t.profile}
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
  barTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  barSlogan: { color: '#FCD34D', fontSize: 10, fontWeight: '700', marginTop: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langToggleBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14
  },
  langToggleText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  logoutTopBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  logoutText: { color: '#FCA5A5', fontWeight: 'bold', fontSize: 12 },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8
  },
  navItem: { alignItems: 'center', flex: 1, paddingVertical: 4 },
  navIcon: { fontSize: 20, marginBottom: 2, opacity: 0.6 },
  navIconActive: { opacity: 1, transform: [{ scale: 1.15 }] },
  navLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  navLabelActive: { color: '#0B3C2D', fontWeight: '900' }
});
