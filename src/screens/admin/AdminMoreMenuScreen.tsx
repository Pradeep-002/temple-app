import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

interface AdminMoreMenuProps {
  lang?: MobileLanguage;
  onSelectScreen: (screen: string) => void;
  onLogout?: () => void;
}

export const AdminMoreMenuScreen: React.FC<AdminMoreMenuProps> = ({
  lang = 'ta',
  onSelectScreen
}) => {
  const t = mobileTranslations[lang];

  const menuItems = [
    { id: 'DONATIONS', title: t.donations, icon: '🤝', desc: 'Record & view temple donations' },
    { id: 'EXPENSES', title: t.expenses, icon: '💸', desc: 'Sangam pooja & operational expenses' },
    { id: 'EVENTS', title: t.events, icon: '🛕', desc: 'Manage festivals, poojas & event budgets' },
    { id: 'LEDGER', title: t.ledger, icon: '📜', desc: 'Audit trail of credits, debits & balance' },
    { id: 'SETTINGS', title: t.settings, icon: '⚙️', desc: 'Sangam name, slogan, contact & passwords' },
    { id: 'PROFILE', title: t.profile, icon: '👤', desc: 'Personal profile & app preferences' }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeader}>{t.more}</Text>

      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => onSelectScreen(item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B3C2D',
    marginBottom: 12
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    alignItems: 'center',
    textAlign: 'center'
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center'
  },
  desc: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14
  }
});
