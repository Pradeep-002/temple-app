import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { apiRequest, getUserSession, saveUserSession } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

interface AdminSettingsProps {
  lang?: MobileLanguage;
  onBrandingUpdate?: (slogan: string, sangamName?: string) => void;
  onLogout?: () => void;
}

export const AdminSettingsScreen: React.FC<AdminSettingsProps> = ({
  lang = 'ta',
  onBrandingUpdate,
  onLogout
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Default Password
  const [defaultPassword, setDefaultPassword] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/sangam/settings');
      if (res.success && res.data) {
        const d = res.data;
        setName(d.name || '');
        setSlogan(d.slogan || '');
        setMobileNumber(d.mobileNumber || '');
        setEmail(d.email || '');
        setLocation(d.location || '');
        setAddress(d.address || '');
        setVillage(d.village || '');
        setDistrict(d.district || '');
        setState(d.state || '');
        setPincode(d.pincode || '');
      }
    } catch (e) {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!name.trim()) {
      Alert.alert(t.error, 'Sangam name is required');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      Alert.alert(t.error, 'Contact mobile number must be 10 digits');
      return;
    }

    setSavingSettings(true);
    try {
      const payload = {
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        mobileNumber: cleanMobile,
        email: email.trim() || undefined,
        location: location.trim() || undefined,
        address: address.trim() || undefined,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined
      };

      const res = await apiRequest('/sangam/settings', 'PUT', payload);
      if (res.success) {
        Alert.alert(t.appName, t.settingsSuccess);
        // update branding
        if (onBrandingUpdate && (slogan.trim() || name.trim())) {
          onBrandingUpdate(slogan.trim(), name.trim());
        }
        // update local user session
        const session = await getUserSession();
        if (session) {
          await saveUserSession({
            ...session,
            sangamName: name.trim(),
            slogan: slogan.trim()
          });
        }
      } else {
        Alert.alert(t.error, res.message || 'Failed to save settings');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateDefaultPassword = async () => {
    if (!defaultPassword || defaultPassword.length < 4) {
      Alert.alert(t.error, 'Password must be at least 4 characters');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiRequest('/sangam/settings/default-password', 'PUT', {
        defaultPassword: defaultPassword.trim()
      });
      if (res.success) {
        Alert.alert(t.appName, 'Default member password updated successfully!');
        setDefaultPassword('');
      } else {
        Alert.alert(t.error, res.message || 'Failed to update default password');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0B3C2D" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. SANGAM BRANDING & CONTACT CARD */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>🏛️ {t.sangamSettings}</Text>

        <Text style={styles.inputLabel}>{t.sangamName} *</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Oor Nithi Sangam"
        />

        <Text style={styles.inputLabel}>{t.slogan}</Text>
        <TextInput
          style={styles.textInput}
          value={slogan}
          onChangeText={setSlogan}
          placeholder="e.g. 🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️"
        />

        <Text style={styles.inputLabel}>{t.mobileNumber} * (10 digits)</Text>
        <TextInput
          style={styles.textInput}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="9876543210"
        />

        <Text style={styles.inputLabel}>{t.email}</Text>
        <TextInput
          style={styles.textInput}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="sangam@example.com"
        />

        <Text style={styles.inputLabel}>{t.address}</Text>
        <TextInput
          style={[styles.textInput, { height: 60 }]}
          value={address}
          onChangeText={setAddress}
          multiline
          placeholder="Temple Street / Address"
        />

        <View style={styles.rowTwo}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.inputLabel}>Village / ஊர்</Text>
            <TextInput
              style={styles.textInput}
              value={village}
              onChangeText={setVillage}
              placeholder="Village Name"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.inputLabel}>District / மாவட்டம்</Text>
            <TextInput
              style={styles.textInput}
              value={district}
              onChangeText={setDistrict}
              placeholder="District"
            />
          </View>
        </View>

        <View style={styles.rowTwo}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.inputLabel}>State / மாநிலம்</Text>
            <TextInput
              style={styles.textInput}
              value={state}
              onChangeText={setState}
              placeholder="Tamil Nadu"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.inputLabel}>Pincode / அஞ்சல் குறியீடு</Text>
            <TextInput
              style={styles.textInput}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              placeholder="628001"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, savingSettings && { opacity: 0.7 }]}
          onPress={handleSaveSettings}
          disabled={savingSettings}
        >
          {savingSettings ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>💾 {t.saveSettings}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. DEFAULT MEMBER PASSWORD CARD */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>🔑 {t.defaultPassword}</Text>
        <Text style={styles.cardHint}>
          When new members are created, this default password is used for their initial mobile login.
        </Text>

        <Text style={styles.inputLabel}>{t.newPassword}</Text>
        <TextInput
          style={styles.textInput}
          value={defaultPassword}
          onChangeText={setDefaultPassword}
          placeholder="e.g. Sangam@123"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.passwordBtn, savingPassword && { opacity: 0.7 }]}
          onPress={handleUpdateDefaultPassword}
          disabled={savingPassword}
        >
          {savingPassword ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <Text style={styles.passwordBtnText}>🔒 {t.updateDefaultPassword}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B3C2D',
    marginBottom: 6
  },
  cardHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16
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
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A'
  },
  rowTwo: {
    flexDirection: 'row'
  },
  saveBtn: {
    backgroundColor: '#0B3C2D',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  passwordBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14
  },
  passwordBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 13
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 20
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 14
  }
});
