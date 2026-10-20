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
import { getTodayDateStr, getYesterdayDateStr } from './AdminCollectionsScreen';

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
  const [formJoinDate, setFormJoinDate] = useState<string>(getTodayDateStr);
  const [dateError, setDateError] = useState<string>('');

  // Calendar Date Picker Modal State
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth() + 1);

  const MONTH_NAMES = [
    { value: 1, en: 'January', ta: 'ஜனவரி' },
    { value: 2, en: 'February', ta: 'பிப்ரவரி' },
    { value: 3, en: 'March', ta: 'மார்ச்' },
    { value: 4, en: 'April', ta: 'ஏப்ரல்' },
    { value: 5, en: 'May', ta: 'மே' },
    { value: 6, en: 'June', ta: 'ஜூன்' },
    { value: 7, en: 'July', ta: 'ஜூலை' },
    { value: 8, en: 'August', ta: 'ஆகஸ்ட்' },
    { value: 9, en: 'September', ta: 'செப்டம்பர்' },
    { value: 10, en: 'October', ta: 'அக்டோபர்' },
    { value: 11, en: 'November', ta: 'நவம்பர்' },
    { value: 12, en: 'December', ta: 'டிசம்பர்' }
  ];

  const todayDateStr = getTodayDateStr();
  const yesterdayDateStr = getYesterdayDateStr();
  const realNow = new Date();
  const currentRealYear = realNow.getFullYear();
  const currentRealMonth = realNow.getMonth() + 1;

  const canGoNextMonth = calendarYear < currentRealYear || (calendarYear === currentRealYear && calendarMonth < currentRealMonth);

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const daysInCalendarMonth = new Date(calendarYear, calendarMonth, 0).getDate();
  const firstDayCalendarIndex = new Date(calendarYear, calendarMonth - 1, 1).getDay();

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
    setFormJoinDate(getTodayDateStr());
    setDateError('');
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
    setFormJoinDate(member.joinDate ? String(member.joinDate).split('T')[0] : getTodayDateStr());
    setDateError('');
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

    const trimmedJoinDate = (formJoinDate || getTodayDateStr()).trim();
    if (trimmedJoinDate > todayDateStr) {
      Alert.alert(t.error, t.futureDateError || 'Future date is not allowed for join date');
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
        address: formAddress.trim() || undefined,
        joinDate: trimmedJoinDate || undefined
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

              {/* Join Date Field */}
              <Text style={styles.inputLabel}>
                {lang === 'ta' ? 'இணைந்த தேதி (Join Date) *' : 'Join Date *'}
              </Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.textInput, styles.dateTextInput, dateError ? styles.textInputError : null]}
                  value={formJoinDate}
                  onChangeText={(text) => {
                    setFormJoinDate(text);
                    if (text.trim() > todayDateStr) {
                      setDateError(t.futureDateError || 'Future date is not allowed for join date');
                    } else {
                      setDateError('');
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.calendarPickerBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      if (formJoinDate && formJoinDate.length === 10) {
                        const parts = formJoinDate.split('-');
                        const y = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10);
                        if (!isNaN(y) && !isNaN(m)) {
                          setCalendarYear(y);
                          setCalendarMonth(m);
                        }
                      } else {
                        setCalendarYear(currentRealYear);
                        setCalendarMonth(currentRealMonth);
                      }
                    } catch (e) {
                      setCalendarYear(currentRealYear);
                      setCalendarMonth(currentRealMonth);
                    }
                    setShowDatePickerModal(true);
                  }}
                >
                  <Text style={styles.calendarPickerBtnText}>📅 {lang === 'ta' ? 'நாட்காட்டி' : 'Calendar'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quickDateChipsRow}>
                <TouchableOpacity
                  style={[styles.quickDateChip, formJoinDate === todayDateStr && styles.quickDateChipActive]}
                  onPress={() => {
                    setFormJoinDate(todayDateStr);
                    setDateError('');
                  }}
                >
                  <Text style={[styles.quickDateChipText, formJoinDate === todayDateStr && styles.quickDateChipTextActive]}>
                    ✓ {lang === 'ta' ? 'இன்று (Today)' : 'Today'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickDateChip, formJoinDate === yesterdayDateStr && styles.quickDateChipActive]}
                  onPress={() => {
                    setFormJoinDate(yesterdayDateStr);
                    setDateError('');
                  }}
                >
                  <Text style={[styles.quickDateChipText, formJoinDate === yesterdayDateStr && styles.quickDateChipTextActive]}>
                    {lang === 'ta' ? 'நேற்று (Yesterday)' : 'Yesterday'}
                  </Text>
                </TouchableOpacity>
              </View>

              {dateError ? (
                <Text style={styles.dateErrorText}>⚠️ {dateError}</Text>
              ) : (
                <Text style={styles.dateHelperText}>
                  {lang === 'ta' ? 'இன்று அல்லது முந்தைய தேதியை மட்டுமே தேர்ந்தெடுக்க முடியும்' : 'Only today or previous dates can be selected'}
                </Text>
              )}

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

      {/* 5. CALENDAR DATE PICKER MODAL (FOR JOIN DATE) */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.calendarModalCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarNavBtnText}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.calendarMonthTitle}>
                {MONTH_NAMES.find(m => m.value === calendarMonth)?.[lang === 'ta' ? 'ta' : 'en'] || `Month ${calendarMonth}`} {calendarYear}
              </Text>

              <TouchableOpacity
                style={[styles.calendarNavBtn, !canGoNextMonth && styles.calendarNavBtnDisabled]}
                onPress={handleNextMonth}
                disabled={!canGoNextMonth}
                activeOpacity={0.7}
              >
                <Text style={[styles.calendarNavBtnText, !canGoNextMonth && { color: '#CBD5E1' }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday Names */}
            <View style={styles.calendarWeekRow}>
              {(lang === 'ta'
                ? ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச']
                : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
              ).map((dayName, idx) => (
                <Text key={idx} style={styles.calendarWeekDayText}>
                  {dayName}
                </Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.calendarGrid}>
              {/* Empty leading offset cells */}
              {Array.from({ length: firstDayCalendarIndex }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.calendarDayCell} />
              ))}

              {/* Day numbers */}
              {Array.from({ length: daysInCalendarMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isFuture = cellDateStr > todayDateStr;
                const isSelected = formJoinDate === cellDateStr;
                const isToday = cellDateStr === todayDateStr;

                if (isFuture) {
                  return (
                    <View key={`day-${dayNum}`} style={styles.calendarDayCell}>
                      <View style={[styles.calendarDayBtn, styles.calendarDayBtnDisabled]}>
                        <Text style={[styles.calendarDayText, styles.calendarDayTextDisabled]}>
                          {dayNum}
                        </Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <View key={`day-${dayNum}`} style={styles.calendarDayCell}>
                    <TouchableOpacity
                      style={[
                        styles.calendarDayBtn,
                        isToday && styles.calendarDayBtnToday,
                        isSelected && styles.calendarDayBtnSelected
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setFormJoinDate(cellDateStr);
                        setDateError('');
                        setShowDatePickerModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday && styles.calendarDayTextToday,
                          isSelected && styles.calendarDayTextSelected
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <Text style={styles.calendarBottomNote}>
              {lang === 'ta'
                ? 'ℹ️ எதிர்கால தேதிகள் முடக்கப்பட்டுள்ளன (இன்று/முந்தைய தேதிகள் மட்டுமே)'
                : 'ℹ️ Future dates are disabled (Today & past dates only)'}
            </Text>

            <TouchableOpacity
              style={styles.calendarCloseBtn}
              activeOpacity={0.7}
              onPress={() => setShowDatePickerModal(false)}
            >
              <Text style={styles.calendarCloseBtnText}>{t.cancel || 'Cancel'}</Text>
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
  textInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
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
  },
  quickDateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    marginTop: 4
  },
  quickDateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  quickDateChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A'
  },
  quickDateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  quickDateChipTextActive: {
    color: '#15803D',
    fontWeight: '700'
  },
  dateErrorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2,
    marginBottom: 4
  },
  dateHelperText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 4
  },

  // Payment Date & Calendar Picker Styles
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  dateTextInput: {
    flex: 1
  },
  calendarPickerBtn: {
    backgroundColor: '#0B3C2D',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  calendarPickerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },

  // Calendar Modal Styles
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  calendarModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '92%',
    maxWidth: 380,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 4
  },
  calendarNavBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  calendarNavBtnDisabled: {
    opacity: 0.3
  },
  calendarNavBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  calendarMonthTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  calendarWeekRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6
  },
  calendarWeekDayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: 12
  },
  calendarDayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2
  },
  calendarDayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  calendarDayBtnSelected: {
    backgroundColor: '#0B3C2D'
  },
  calendarDayBtnToday: {
    borderWidth: 1.5,
    borderColor: '#D4AF37'
  },
  calendarDayBtnDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.3
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B'
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  calendarDayTextDisabled: {
    color: '#94A3B8'
  },
  calendarDayTextToday: {
    color: '#0B3C2D',
    fontWeight: '800'
  },
  calendarBottomNote: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 10,
    textAlign: 'center'
  },
  calendarCloseBtn: {
    paddingVertical: 9,
    paddingHorizontal: 28,
    backgroundColor: '#F1F5F9',
    borderRadius: 8
  },
  calendarCloseBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B'
  }
});
