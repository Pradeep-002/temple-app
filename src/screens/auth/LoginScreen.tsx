import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { apiRequest, saveUserSession } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

export const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
  const [lang, setLang] = useState<MobileLanguage>('ta');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'mobile' | 'password' | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const t = mobileTranslations[lang];

  const handlePasswordFocus = () => {
    setFocusedInput('password');
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const cleanMobile = mobileNumber.trim();
    if (!cleanMobile || !password) {
      Alert.alert(
        lang === 'ta' ? 'தேவை' : 'Required',
        lang === 'ta' ? 'அலைபேசி எண் மற்றும் கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter mobile number and password'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/auth/login', 'POST', { mobileNumber: cleanMobile, password });
      setLoading(false);
      if (res.success && res.data) {
        await saveUserSession(res.data);
        onLoginSuccess(res.data);
      } else {
        Alert.alert(
          lang === 'ta' ? 'உள்நுழைவு தோல்வி' : 'Login Failed',
          res.message || (lang === 'ta' ? 'தவறான அலைபேசி எண் அல்லது கடவுச்சொல்' : 'Invalid credentials')
        );
      }
    } catch (e) {
      setLoading(false);
      Alert.alert(
        lang === 'ta' ? 'பிழை' : 'Error',
        lang === 'ta' ? 'இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்.' : 'Network request failed. Please try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* TOP SACRED SLOGAN & BRANDING */}
        <View style={styles.header}>
          <View style={styles.sloganPill}>
            <Text style={styles.sloganText}>🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️</Text>
          </View>

          <View style={styles.logoRing}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>ஊ</Text>
            </View>
          </View>

          <Text style={styles.title}>{t.appName}</Text>
          <Text style={styles.tamilSub}>
            {lang === 'ta' ? 'சங்க நிதி & மாதாந்திர சந்தா மேலாண்மை' : 'Temple Sangam Finance & Chanda'}
          </Text>

          {/* Language Switcher Pill */}
          <TouchableOpacity
            style={styles.langBtn}
            activeOpacity={0.7}
            onPress={() => setLang(lang === 'en' ? 'ta' : 'en')}
          >
            <Text style={styles.langGlobe}>🌐</Text>
            <Text style={styles.langText}>
              {lang === 'en' ? 'தமிழில் பார்க்க (தமிழ்)' : 'Switch to English'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOGIN CARD */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>
            {lang === 'ta' ? 'உள்நுழைவு' : 'Account Login'}
          </Text>
          <Text style={styles.cardSub}>
            {lang === 'ta'
              ? 'உங்கள் கணக்கில் நுழைய விவரங்களை அளிக்கவும்'
              : 'Enter your credentials to access your dashboard'}
          </Text>

          {/* MOBILE NUMBER INPUT */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>{t.mobileNumber} *</Text>
            <View
              style={[
                styles.inputContainer,
                focusedInput === 'mobile' && styles.inputFocused
              ]}
            >
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder={lang === 'ta' ? '10 இலக்க அலைபேசி எண்' : '10-digit mobile number'}
                placeholderTextColor="#94A3B8"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                maxLength={10}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput('mobile')}
                onBlur={() => setFocusedInput(null)}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* PASSWORD INPUT WITH EYE TOGGLE */}
          <View style={styles.fieldWrapper}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>{t.password} *</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                focusedInput === 'password' && styles.inputFocused
              ]}
            >
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                ref={passwordInputRef}
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={handlePasswordFocus}
                onBlur={() => setFocusedInput(null)}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator size="small" color="#0F172A" />
                <Text style={[styles.btnText, { marginLeft: 8 }]}>
                  {lang === 'ta' ? 'உள்நுழைகிறது...' : 'Signing in...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.btnText}>
                {lang === 'ta' ? 'உள்நுழைக →' : 'Login to Account →'}
              </Text>
            )}
          </TouchableOpacity>

          {/* SECURITY BADGE FOOTER */}
          <View style={styles.securityRow}>
            <Text style={styles.securityIcon}>🛡️</Text>
            <Text style={styles.securityText}>
              {lang === 'ta'
                ? 'பாதுகாப்பான மற்றும் மறைகுறியாக்கப்பட்ட அணுகல்'
                : 'Secured with 256-bit encryption'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#0B3C2D' // Maintained theme color
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 36,
    paddingBottom: 36
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  sloganPill: {
    backgroundColor: 'rgba(253, 230, 138, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14
  },
  sloganText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  logoRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)'
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#D4AF37', // Preserved gold theme
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A'
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  tamilSub: {
    fontSize: 11,
    color: '#FDE68A',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center'
  },
  langBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20
  },
  langGlobe: {
    fontSize: 12,
    marginRight: 6
  },
  langText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A'
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 18
  },
  fieldWrapper: {
    marginBottom: 16
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 50
  },
  inputFocused: {
    borderColor: '#D4AF37', // Golden focus border
    backgroundColor: '#FFFFFF',
    borderWidth: 2
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    height: '100%'
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    height: '100%'
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  eyeIcon: {
    fontSize: 16
  },
  btn: {
    backgroundColor: '#D4AF37', // Preserved gold theme
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  btnDisabled: {
    opacity: 0.7
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  btnText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.3
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18
  },
  securityIcon: {
    fontSize: 11,
    marginRight: 5
  },
  securityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8'
  }
});
