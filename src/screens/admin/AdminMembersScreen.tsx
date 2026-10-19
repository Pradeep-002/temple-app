import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import { apiRequest, getMediaUrl } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

const MemberAvatar: React.FC<{ name?: string; profileImageUrl?: string }> = ({ name, profileImageUrl }) => {
  const [imageError, setImageError] = useState(false);

  if (profileImageUrl && !imageError) {
    return (
      <View style={styles.avatar}>
        <Image
          source={{ uri: getMediaUrl(profileImageUrl) }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{(name || 'M').charAt(0).toUpperCase()}</Text>
    </View>
  );
};

interface AdminMembersProps {
  lang?: MobileLanguage;
}

export const AdminMembersScreen: React.FC<AdminMembersProps> = ({ lang = 'ta' }) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MEMBER' | 'COLLECTOR' | 'SANGAM_ADMIN'>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'MEMBER' | 'COLLECTOR' | 'SANGAM_ADMIN'>('MEMBER');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formGender, setFormGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [formAddress, setFormAddress] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/members');
      if (res.success && Array.isArray(res.data)) {
        setMembers(res.data);
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
    loadMembers();
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedMemberId(null);
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormRole('MEMBER');
    setFormStatus('ACTIVE');
    setFormGender('MALE');
    setFormAddress('');
    setShowModal(true);
  };

  const openEditModal = (member: any) => {
    setIsEditing(true);
    setSelectedMemberId(member.id);
    setFormName(member.name || '');
    setFormMobile(member.mobileNumber || '');
    setFormEmail(member.email || '');
    setFormRole(member.role || 'MEMBER');
    setFormStatus(member.status || 'ACTIVE');
    setFormGender(member.gender || 'MALE');
    setFormAddress(member.address || '');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      Alert.alert(t.error, 'Please enter member name');
      return;
    }
    const cleanMobile = formMobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      Alert.alert(t.error, 'Mobile number must be exactly 10 digits');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        mobileNumber: cleanMobile,
        email: formEmail.trim() || undefined,
        role: formRole,
        gender: formGender,
        address: formAddress.trim() || undefined
      };

      let res;
      if (isEditing && selectedMemberId) {
        payload.status = formStatus;
        res = await apiRequest(`/members/${selectedMemberId}`, 'PUT', payload);
      } else {
        res = await apiRequest('/members', 'POST', payload);
      }

      if (res.success) {
        setShowModal(false);
        Alert.alert(t.appName, t.memberSuccess);
        loadMembers();
      } else {
        Alert.alert(t.error, res.message || 'Operation failed');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.memberCode && m.memberCode.toLowerCase().includes(q)) ||
      (m.mobileNumber && m.mobileNumber.includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER & ACTION BAR */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
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

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ {t.addMember}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. ROLE FILTER CHIPS */}
      <View style={styles.filterRow}>
        {(['ALL', 'MEMBER', 'COLLECTOR', 'SANGAM_ADMIN'] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>
              {r === 'ALL' ? t.filterAll : r === 'MEMBER' ? t.members : r === 'COLLECTOR' ? 'Collector' : 'Admin'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. MEMBERS LIST */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id || item.memberCode || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0B3C2D" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>{t.noRecords}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <MemberAvatar name={item.name} profileImageUrl={item.profileImageUrl} />

            <View style={styles.memberDetails}>
              <View style={styles.badgeRow}>
                <Text style={styles.memberCode}>{item.memberCode || 'MEMBER'}</Text>
                <View style={[styles.roleBadge, item.role === 'SANGAM_ADMIN' ? styles.adminBadge : item.role === 'COLLECTOR' ? styles.collectorBadge : styles.memberRoleBadge]}>
                  <Text style={styles.roleBadgeText}>{item.role}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{item.status || 'ACTIVE'}</Text>
                </View>
              </View>

              <Text style={styles.memberName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.memberMobile}>📞 {item.mobileNumber} {item.email ? `• ✉️ ${item.email}` : ''}</Text>
              {item.address ? <Text style={styles.memberAddress} numberOfLines={1}>📍 {item.address}</Text> : null}
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => openEditModal(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>✏️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* 4. ADD / EDIT MEMBER MODAL */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? t.editMember : t.addMember}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t.name} *</Text>
              <TextInput
                style={styles.textInput}
                value={formName}
                onChangeText={setFormName}
                placeholder="Full Name"
              />

              <Text style={styles.inputLabel}>{t.mobileNumber} * (10 digits)</Text>
              <TextInput
                style={styles.textInput}
                value={formMobile}
                onChangeText={setFormMobile}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="9876543210"
              />

              <Text style={styles.inputLabel}>{t.role} *</Text>
              <View style={styles.chipRow}>
                {(['MEMBER', 'COLLECTOR', 'SANGAM_ADMIN'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.selectChip, formRole === r && styles.selectChipActive]}
                    onPress={() => setFormRole(r)}
                  >
                    <Text style={[styles.selectChipText, formRole === r && styles.selectChipTextActive]}>
                      {r === 'MEMBER' ? 'Member' : r === 'COLLECTOR' ? 'Collector' : 'Admin'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isEditing && (
                <>
                  <Text style={styles.inputLabel}>{t.status} *</Text>
                  <View style={styles.chipRow}>
                    {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.selectChip, formStatus === s && styles.selectChipActive]}
                        onPress={() => setFormStatus(s)}
                      >
                        <Text style={[styles.selectChipText, formStatus === s && styles.selectChipTextActive]}>
                          {s === 'ACTIVE' ? t.active : t.inactive}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>{t.gender}</Text>
              <View style={styles.chipRow}>
                {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.selectChip, formGender === g && styles.selectChipActive]}
                    onPress={() => setFormGender(g)}
                  >
                    <Text style={[styles.selectChipText, formGender === g && styles.selectChipTextActive]}>
                      {g === 'MALE' ? t.male : g === 'FEMALE' ? t.female : t.other}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t.email}</Text>
              <TextInput
                style={styles.textInput}
                value={formEmail}
                onChangeText={setFormEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="member@example.com"
              />

              <Text style={styles.inputLabel}>{t.address}</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                value={formAddress}
                onChangeText={setFormAddress}
                multiline
                placeholder="Full address / Street / Village"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{t.save}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center'
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A'
  },
  clearIcon: {
    fontSize: 14,
    color: '#94A3B8'
  },
  addBtn: {
    backgroundColor: '#0B3C2D',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E2E8F0'
  },
  filterChipActive: {
    backgroundColor: '#0B3C2D'
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
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B3C2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  memberDetails: {
    flex: 1
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  memberCode: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0B3C2D'
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  memberRoleBadge: {
    backgroundColor: '#E0F2FE'
  },
  collectorBadge: {
    backgroundColor: '#FEF3C7'
  },
  adminBadge: {
    backgroundColor: '#EDE9FE'
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E293B'
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  statusActive: {
    backgroundColor: '#ECFDF5'
  },
  statusInactive: {
    backgroundColor: '#FEF2F2'
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981'
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  memberMobile: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  memberAddress: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginLeft: 6
  },
  editBtnText: {
    fontSize: 16
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0B3C2D'
  },
  closeBtn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94A3B8'
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
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A'
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4
  },
  selectChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  selectChipActive: {
    backgroundColor: '#0B3C2D',
    borderColor: '#0B3C2D'
  },
  selectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  selectChipTextActive: {
    color: '#FFFFFF'
  },
  submitBtn: {
    backgroundColor: '#0B3C2D',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  }
});
