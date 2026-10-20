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
  Alert
} from 'react-native';
import { apiRequest, getUserSession } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';
import { buildReceiptHtml, printOrShareReceipt, ReceiptData } from '../../utils/receiptGenerator';
import { getTodayDateStr, getYesterdayDateStr } from './AdminCollectionsScreen';

interface AdminDonationsProps {
  lang?: MobileLanguage;
  sangamName?: string;
  sangamSlogan?: string;
}

export const AdminDonationsScreen: React.FC<AdminDonationsProps> = ({
  lang = 'ta',
  sangamName: propSangamName,
  sangamSlogan: propSangamSlogan
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [donations, setDonations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Record Donation Modal
  const [showModal, setShowModal] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [donationDate, setDonationDate] = useState<string>(getTodayDateStr);
  const [dateError, setDateError] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

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
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/donations');
      if (res.success && Array.isArray(res.data)) {
        setDonations(res.data);
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
    loadDonations();
  };

  const todayDateStr = getTodayDateStr();
  const yesterdayDateStr = getYesterdayDateStr();

  const openAddModal = () => {
    setDonorName('');
    setDonorMobile('');
    setDonationPurpose('');
    setAmount('');
    setDonationDate(getTodayDateStr());
    setDateError('');
    setPaymentMode('UPI');
    setReferenceNumber('');
    setRemarks('');
    setShowModal(true);
  };

  const handleOpenDonationReceipt = async (item: any) => {
    try {
      const session = await getUserSession();
      const receipt: ReceiptData = {
        receiptNumber: item.receiptNumber || 'DON-' + (item.id || Date.now()),
        sangamName: session?.sangamName || propSangamName || 'Oor Nithi Sangam',
        sangamSlogan: session?.slogan || propSangamSlogan,
        memberName: item.donorName,
        amountPaid: Number(item.amount || 0),
        paymentMode: item.paymentMode || 'CASH',
        paymentDate: item.donationDate || new Date(),
        collectedBy: item.createdBy || session?.name || 'Admin',
        referenceNumber: item.referenceNumber || undefined,
        purpose: item.donationPurpose
      };
      setReceiptData(receipt);
      setShowReceiptModal(true);
    } catch (e) {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (!donorName.trim()) {
      Alert.alert(t.error, 'Please enter donor name');
      return;
    }
    if (!donationPurpose.trim()) {
      Alert.alert(t.error, 'Please enter donation purpose');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t.error, 'Please enter a valid amount');
      return;
    }

    const trimmedDate = (donationDate || getTodayDateStr()).trim();
    if (trimmedDate > todayDateStr) {
      Alert.alert(t.error, t.futureDateError || 'Future payment date is not allowed');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        donorName: donorName.trim(),
        donorMobile: donorMobile.trim() || undefined,
        donationPurpose: donationPurpose.trim(),
        amount: amountNum,
        donationDate: trimmedDate,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined
      };

      const res = await apiRequest('/donations', 'POST', payload);
      if (res.success) {
        setShowModal(false);
        const saved = res.data;
        const session = await getUserSession();

        const receipt: ReceiptData = {
          receiptNumber: saved?.receiptNumber || 'DON-' + Date.now(),
          sangamName: session?.sangamName || propSangamName || 'Oor Nithi Sangam',
          sangamSlogan: session?.slogan || propSangamSlogan,
          memberName: saved?.donorName || donorName.trim(),
          amountPaid: saved?.amount || amountNum,
          paymentMode,
          paymentDate: saved?.donationDate || trimmedDate,
          collectedBy: session?.name || 'Admin',
          referenceNumber: referenceNumber.trim() || undefined,
          purpose: saved?.donationPurpose || donationPurpose.trim()
        };

        setReceiptData(receipt);
        setShowReceiptModal(true);
        loadDonations();
      } else {
        Alert.alert(t.error, res.message || 'Failed to record donation');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSum = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const filteredDonations = donations.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (d.donorName && d.donorName.toLowerCase().includes(q)) ||
      (d.donationPurpose && d.donationPurpose.toLowerCase().includes(q)) ||
      (d.receiptNumber && d.receiptNumber.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>{t.totalDonations}</Text>
          <Text style={styles.summaryAmount}>₹{totalSum.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ {t.recordDonation}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. SEARCH BAR */}
      <View style={styles.searchSection}>
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
      </View>

      {/* 3. DONATIONS LIST */}
      <FlatList
        data={filteredDonations}
        keyExtractor={(item) => item.id || item.receiptNumber || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0B3C2D" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={styles.emptyText}>{t.noRecords}</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const dateStr = item.donationDate ? new Date(item.donationDate).toLocaleDateString('en-IN') : '';

          return (
            <View style={styles.donationCard}>
              <View style={styles.iconBox}>
                <Text style={{ fontSize: 20 }}>🤝</Text>
              </View>

              <View style={styles.detailsBox}>
                <View style={styles.titleRow}>
                  <Text style={styles.donorName} numberOfLines={1}>{item.donorName}</Text>
                  <Text style={styles.amountText}>₹{Number(item.amount || 0).toLocaleString('en-IN')}</Text>
                </View>

                <Text style={styles.purposeText} numberOfLines={1}>🎯 {item.donationPurpose}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.receiptNumber || 'REC'} • {dateStr}</Text>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{item.paymentMode || 'UPI'}</Text>
                  </View>
                </View>

                {/* Receipt / PDF Action Button */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.cardReceiptBtn}
                    onPress={() => handleOpenDonationReceipt(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cardReceiptBtnText}>📄 {lang === 'ta' ? 'ரசீது / PDF' : 'Receipt / PDF'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* 4. RECORD DONATION MODAL */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.recordDonation}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t.donorName} *</Text>
              <TextInput
                style={styles.textInput}
                value={donorName}
                onChangeText={setDonorName}
                placeholder="Full Name"
              />

              <Text style={styles.inputLabel}>{t.donorMobile}</Text>
              <TextInput
                style={styles.textInput}
                value={donorMobile}
                onChangeText={setDonorMobile}
                keyboardType="phone-pad"
                placeholder="Mobile Number (optional)"
              />

              <Text style={styles.inputLabel}>{t.donationPurpose} *</Text>
              <TextInput
                style={styles.textInput}
                value={donationPurpose}
                onChangeText={setDonationPurpose}
                placeholder="e.g. Festival Annadhanam / Kumbabishegam"
              />

              <Text style={styles.inputLabel}>{t.amount} (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="1000"
              />

              {/* PAYMENT DATE FIELD */}
              <Text style={styles.inputLabel}>
                {t.paymentDate} / {lang === 'ta' ? 'நன்கொடை தேதி' : 'Donation Date'} *
              </Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.textInput, styles.dateTextInput, dateError ? styles.textInputError : null]}
                  value={donationDate}
                  onChangeText={(text) => {
                    setDonationDate(text);
                    if (text.trim() > todayDateStr) {
                      setDateError(t.futureDateError || 'Future payment date is not allowed');
                    } else {
                      setDateError('');
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.calendarPickerBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      if (donationDate && donationDate.length === 10) {
                        const parts = donationDate.split('-');
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

              {/* Quick Preset Buttons (Today, Yesterday) */}
              <View style={styles.quickDateChipsRow}>
                <TouchableOpacity
                  style={[styles.quickDateChip, donationDate === todayDateStr && styles.quickDateChipActive]}
                  onPress={() => {
                    setDonationDate(todayDateStr);
                    setDateError('');
                  }}
                >
                  <Text style={[styles.quickDateChipText, donationDate === todayDateStr && styles.quickDateChipTextActive]}>
                    ✓ {lang === 'ta' ? 'இன்று (Today)' : 'Today'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickDateChip, donationDate === yesterdayDateStr && styles.quickDateChipActive]}
                  onPress={() => {
                    setDonationDate(yesterdayDateStr);
                    setDateError('');
                  }}
                >
                  <Text style={[styles.quickDateChipText, donationDate === yesterdayDateStr && styles.quickDateChipTextActive]}>
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

              <Text style={styles.inputLabel}>{t.paymentMode} *</Text>
              <View style={styles.modeRow}>
                {['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeChip, paymentMode === mode && styles.modeChipSelected]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text style={[styles.modeText, paymentMode === mode && styles.modeTextSelected]}>
                      {mode === 'UPI' ? 'UPI' : mode === 'CASH' ? t.cash : mode === 'BANK_TRANSFER' ? 'Bank' : 'Cheque'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t.referenceNo}</Text>
              <TextInput
                style={styles.textInput}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder="UTR / Cheque No (optional)"
              />

              <Text style={styles.inputLabel}>{t.remarks}</Text>
              <TextInput
                style={styles.textInput}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Optional notes"
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
                <Text style={styles.submitBtnText}>{t.submit}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. RECEIPT MODAL */}
      <Modal visible={showReceiptModal} transparent animationType="fade" onRequestClose={() => setShowReceiptModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderTitle}>✓ {t.donationSuccess}</Text>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {receiptData && (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.receiptBox}>
                  <Text style={styles.receiptSangam}>{receiptData.sangamName}</Text>
                  {receiptData.sangamSlogan && (
                    <Text style={styles.receiptSlogan}>{receiptData.sangamSlogan}</Text>
                  )}
                  <View style={styles.divider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.receipt}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.receiptNumber}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.donorName}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.memberName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.donationPurpose}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.purpose || '—'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.paymentMode}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.paymentMode}</Text>
                  </View>

                  <View style={styles.amountPill}>
                    <Text style={styles.amountPillLabel}>{t.amount}:</Text>
                    <Text style={styles.amountPillVal}>₹{receiptData.amountPaid.toFixed(2)}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={() => receiptData && printOrShareReceipt(receiptData, 'download')}
              >
                <Text style={styles.pdfBtnText}>📥 {lang === 'ta' ? 'PDF சேமிக்க' : 'Save PDF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => receiptData && printOrShareReceipt(receiptData, 'share')}
              >
                <Text style={styles.shareBtnText}>📤 {lang === 'ta' ? 'பகிர' : 'Share'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setShowReceiptModal(false)}
              >
                <Text style={styles.doneBtnText}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. CALENDAR DATE PICKER MODAL (FOR PAYMENT / DONATION DATE) */}
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
                const isSelected = donationDate === cellDateStr;
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
                        setDonationDate(cellDateStr);
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B3C2D',
    margin: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE047',
    textTransform: 'uppercase'
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2
  },
  addBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  addBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 12
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42
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
  listContent: {
    padding: 12,
    paddingBottom: 30
  },
  donationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  detailsBox: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  donorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A'
  },
  purposeText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  metaText: {
    fontSize: 10,
    color: '#94A3B8'
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 4
  },
  modeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569'
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4
  },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  modeChipSelected: {
    backgroundColor: '#0B3C2D',
    borderColor: '#0B3C2D'
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  modeTextSelected: {
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
  receiptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    margin: 20,
    padding: 20,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 420
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  receiptHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534'
  },
  receiptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  receiptSangam: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B3C2D',
    textAlign: 'center'
  },
  receiptSlogan: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3
  },
  receiptField: {
    fontSize: 11,
    color: '#64748B'
  },
  receiptVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A'
  },
  amountPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  amountPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534'
  },
  amountPillVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#14532D'
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16
  },
  pdfBtn: {
    flex: 1,
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  pdfBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 12
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  doneBtnText: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 12
  },

  // Card Actions & Receipt Button
  cardActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  cardReceiptBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  cardReceiptBtnText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700'
  },

  // Payment Date & Quick Presets
  textInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
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

  // Share Receipt Button
  shareBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
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
