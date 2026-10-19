import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiRequest, getUserSession, saveUserSession, clearUserSession, UserSession, getMediaUrl } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

export const MemberProfileScreen = ({
  lang,
  setLang,
  onLogout
}: {
  lang: MobileLanguage;
  setLang: (l: MobileLanguage) => void;
  onLogout: () => void;
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Edit Profile State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile Photo State
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [photoPreviewVisible, setPhotoPreviewVisible] = useState(false);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePickFromGallery = async () => {
    setPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to choose a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoPreviewUri(asset.uri);
        setPhotoBase64(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null);
        setPhotoPreviewVisible(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to open image gallery');
    }
  };

  const handleTakePhoto = async () => {
    setPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture a profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoPreviewUri(asset.uri);
        setPhotoBase64(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null);
        setPhotoPreviewVisible(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to open camera');
    }
  };

  const handleSavePhoto = async () => {
    if (!photoBase64 && !photoPreviewUri) {
      Alert.alert('Error', 'No photo selected to save');
      return;
    }

    setSavingPhoto(true);
    try {
      const res = await apiRequest('/members/me/photo', 'POST', {
        photoBase64: photoBase64,
        fileName: 'profile.jpg'
      });

      if (res.success && res.data) {
        setProfile(res.data);
        const session = await getUserSession();
        if (session) {
          const updatedSession: UserSession = {
            ...session,
            profileImageUrl: res.data.profileImageUrl
          };
          await saveUserSession(updatedSession);
        }
        setPhotoPreviewVisible(false);
        setPhotoPreviewUri(null);
        setPhotoBase64(null);
        Alert.alert('Success', t.photoSuccess || 'Profile photo updated successfully!');
      } else {
        Alert.alert('Upload Failed', res.message || 'Could not upload profile photo');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network request failed while uploading photo');
    } finally {
      setSavingPhoto(false);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/members/me');
      if (res.success && res.data) {
        setProfile(res.data);
        setEditName(res.data.name || '');
        setEditEmail(res.data.email || '');
        setEditAddress(res.data.address || '');
      } else {
        // Fallback to local session
        const session = await getUserSession();
        if (session) {
          setProfile(session);
          setEditName(session.name || '');
          setEditEmail(session.email || '');
        }
      }
    } catch (err) {
      const session = await getUserSession();
      if (session) {
        setProfile(session);
        setEditName(session.name || '');
        setEditEmail(session.email || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Member name is required');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiRequest('/members/me', 'PUT', {
        name: editName.trim(),
        email: editEmail.trim(),
        address: editAddress.trim()
      });

      if (res.success && res.data) {
        setProfile(res.data);
        // Update local session
        const session = await getUserSession();
        if (session) {
          const updatedSession: UserSession = {
            ...session,
            name: res.data.name,
            email: res.data.email,
            address: res.data.address
          };
          await saveUserSession(updatedSession);
        }
        setEditModalVisible(false);
        Alert.alert('Success', t.updateSuccess);
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update profile');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network request failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiRequest('/auth/change-password', 'POST', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Success', 'Password changed successfully! Please use your new password for future logins.');
      } else {
        Alert.alert('Failed', res.message || 'Incorrect current password or invalid request');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0B3C2D" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* PROFILE HEADER CARD */}
      <View style={styles.headerCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            {profile?.profileImageUrl ? (
              <Image
                source={{ uri: getMediaUrl(profile.profileImageUrl) }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'M'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.cameraBadge}
            onPress={() => setPhotoPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.cameraBadgeIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.memberName} numberOfLines={2}>
            {profile?.name ? profile.name.trim() : 'Member'}
          </Text>
          <Text style={styles.memberSangam} numberOfLines={2}>
            {profile?.sangamName ? profile.sangamName.trim() : 'Sangam'}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>MEMBERSHIP: {profile?.memberCode || 'MEMBER'}</Text>
          </View>
          <View style={[styles.statusBadge, profile?.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, profile?.status === 'ACTIVE' ? styles.statusActiveText : styles.statusInactiveText]}>
              {profile?.status || 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            setEditName(profile?.name || '');
            setEditEmail(profile?.email || '');
            setEditAddress(profile?.address || '');
            setEditModalVisible(true);
          }}
        >
          <Text style={styles.editBtnText}>✏️ {t.editProfile}</Text>
        </TouchableOpacity>
      </View>

      {/* MEMBER DETAILS SECTION */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>MEMBER DETAILS</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>{t.name}</Text>
          <Text style={styles.infoVal}>{profile?.name}</Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.infoRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.infoKey}>{t.mobileNumber}</Text>
            <Text style={styles.lockIcon}> 🔒</Text>
          </View>
          <Text style={styles.infoVal}>{profile?.mobileNumber}</Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>{t.email || 'Email'}</Text>
          <Text style={styles.infoVal}>{profile?.email || '—'}</Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>{t.address}</Text>
          <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]}>
            {profile?.address || 'Not provided'}
          </Text>
        </View>
        <View style={styles.rowDivider} />

        <View style={styles.infoRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.infoKey}>{t.joinDate}</Text>
            <Text style={styles.lockIcon}> 🔒</Text>
          </View>
          <Text style={styles.infoVal}>{profile?.joinDate || '—'}</Text>
        </View>
      </View>

      {/* SECURITY & PREFERENCES */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>SECURITY & SETTINGS</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setPasswordModalVisible(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.actionIcon}>🔑</Text>
            <View>
              <Text style={styles.actionTitle}>{t.changePassword}</Text>
              <Text style={styles.actionSub}>Update your login credentials</Text>
            </View>
          </View>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.rowDivider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setLang(lang === 'en' ? 'ta' : 'en')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.actionIcon}>🌐</Text>
            <View>
              <Text style={styles.actionTitle}>Language / மொழி</Text>
              <Text style={styles.actionSub}>Current: {lang === 'en' ? 'English' : 'தமிழ்'}</Text>
            </View>
          </View>
          <Text style={styles.actionSwitchText}>Switch</Text>
        </TouchableOpacity>
      </View>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>🚪 {t.logout}</Text>
      </TouchableOpacity>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ {t.editProfile}</Text>
            <Text style={styles.modalSubtitle}>Your name, email, and address can be updated.</Text>

            <Text style={styles.inputLabel}>{t.name} *</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Full Name"
            />

            <Text style={styles.inputLabel}>{t.email || 'Email'}</Text>
            <TextInput
              style={styles.textInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="example@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>{t.address}</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Door No, Street, Village"
              multiline
            />

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={savingProfile}
              >
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>{t.saveChanges}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔒 {t.changePassword}</Text>
            <Text style={styles.modalSubtitle}>Choose a strong password with at least 6 characters.</Text>

            {/* Current Password */}
            <Text style={styles.inputLabel}>{t.currentPassword} *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showCurrentPw}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
              />
              <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} style={styles.eyeBtn}>
                <Text>{showCurrentPw ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <Text style={styles.inputLabel}>{t.newPassword} *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showNewPw}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
              />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} style={styles.eyeBtn}>
                <Text>{showNewPw ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={styles.inputLabel}>{t.confirmPassword} *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showConfirmPw}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
              />
              <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)} style={styles.eyeBtn}>
                <Text>{showConfirmPw ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPasswordModalVisible(false)}
                disabled={savingPassword}
              >
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>{t.saveChanges}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PHOTO SOURCE CHOOSER MODAL */}
      <Modal
        visible={photoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoPickerVisible(false)}
        >
          <View style={styles.photoPickerModal}>
            <Text style={styles.modalTitle}>📷 {t.uploadPhoto || 'Upload Profile Photo'}</Text>
            <Text style={styles.modalSubtitle}>Select source to choose your profile picture</Text>

            <TouchableOpacity style={styles.photoOptionBtn} onPress={handleTakePhoto}>
              <Text style={styles.photoOptionIcon}>📸</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoOptionTitle}>{t.takePhoto || 'Take Photo'}</Text>
                <Text style={styles.photoOptionSub}>Use camera to capture a new picture</Text>
              </View>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity style={styles.photoOptionBtn} onPress={handlePickFromGallery}>
              <Text style={styles.photoOptionIcon}>🖼️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoOptionTitle}>{t.chooseGallery || 'Choose from Gallery'}</Text>
                <Text style={styles.photoOptionSub}>Pick an existing photo from device storage</Text>
              </View>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 14, alignSelf: 'stretch', alignItems: 'center' }]}
              onPress={() => setPhotoPickerVisible(false)}
            >
              <Text style={styles.cancelBtnText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PHOTO PREVIEW & CONFIRMATION MODAL */}
      <Modal
        visible={photoPreviewVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingPhoto) {
            setPhotoPreviewVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoPreviewModal}>
            <Text style={styles.modalTitle}>📷 {t.uploadPhoto || 'Upload Profile Photo'}</Text>
            <Text style={styles.modalSubtitle}>Preview your new profile photo before saving</Text>

            {photoPreviewUri && (
              <View style={styles.previewImageContainer}>
                <Image
                  source={{ uri: photoPreviewUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </View>
            )}

            <View style={[styles.modalBtnsRow, { width: '100%', justifyContent: 'space-between' }]}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setPhotoPreviewVisible(false);
                  setPhotoPreviewUri(null);
                  setPhotoBase64(null);
                }}
                disabled={savingPhoto}
              >
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSavePhoto}
                disabled={savingPhoto}
              >
                {savingPhoto ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>{t.savingPhoto || 'Saving...'}</Text>
                  </View>
                ) : (
                  <Text style={styles.saveBtnText}>💾 {t.savePhoto || 'Save Photo'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 12 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: 'bold' },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3
  },
  avatarWrapper: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 12
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B3C2D',
    overflow: 'hidden'
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0B3C2D',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4
  },
  cameraBadgeIcon: {
    fontSize: 13,
    color: '#FFFFFF'
  },
  avatarInitial: { fontSize: 32, fontWeight: '900', color: '#0F172A' },
  nameBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  memberName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    alignSelf: 'center',
  },
  memberSangam: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    alignSelf: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  roleBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusActiveText: { color: '#166534' },
  statusInactive: { backgroundColor: '#F1F5F9' },
  statusInactiveText: { color: '#64748B' },
  editBtn: {
    marginTop: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  editBtnText: { color: '#EA580C', fontWeight: '700', fontSize: 12 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoKey: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  lockIcon: { fontSize: 10 },
  infoVal: { fontSize: 13, color: '#0F172A', fontWeight: '700' },
  rowDivider: { height: 1, backgroundColor: '#F8FAFC' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  actionIcon: { fontSize: 22, marginRight: 12 },
  actionTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  actionSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  actionChevron: { fontSize: 20, color: '#94A3B8', fontWeight: 'bold' },
  actionSwitchText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6
  },
  logoutBtnText: { color: '#DC2626', fontWeight: '800', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20
  },
  photoPickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20
  },
  photoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14
  },
  photoOptionIcon: {
    fontSize: 26,
    marginRight: 14
  },
  photoOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  photoOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  photoPreviewModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center'
  },
  previewImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: 16,
    borderWidth: 3,
    borderColor: '#0B3C2D'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  modalSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#334155', marginBottom: 4 },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
    color: '#0F172A'
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    marginBottom: 12
  },
  passwordInput: { flex: 1, padding: 10, fontSize: 13, color: '#0F172A' },
  eyeBtn: { padding: 10 },
  modalBtnsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' },
  cancelBtnText: { color: '#64748B', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { backgroundColor: '#0B3C2D', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }
});
