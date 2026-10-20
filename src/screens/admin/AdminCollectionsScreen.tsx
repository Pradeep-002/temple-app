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
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { apiRequest, getUserSession } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';
import { buildReceiptHtml, printOrShareReceipt, ReceiptData } from '../../utils/receiptGenerator';

interface AdminCollectionsProps {
  lang?: MobileLanguage;
  userRole?: string;
  sangamName?: string;
  sangamSlogan?: string;
}

const MONTH_NAMES = [
  { value: 1, en: 'January', ta: 'ஜனவரி', short: 'Jan' },
  { value: 2, en: 'February', ta: 'பிப்ரவரி', short: 'Feb' },
  { value: 3, en: 'March', ta: 'மார்ச்', short: 'Mar' },
  { value: 4, en: 'April', ta: 'ஏப்ரல்', short: 'Apr' },
  { value: 5, en: 'May', ta: 'மே', short: 'May' },
  { value: 6, en: 'June', ta: 'ஜூன்', short: 'Jun' },
  { value: 7, en: 'July', ta: 'ஜூலை', short: 'Jul' },
  { value: 8, en: 'August', ta: 'ஆகஸ்ட்', short: 'Aug' },
  { value: 9, en: 'September', ta: 'செப்டம்பர்', short: 'Sep' },
  { value: 10, en: 'October', ta: 'அக்டோபர்', short: 'Oct' },
  { value: 11, en: 'November', ta: 'நவம்பர்', short: 'Nov' },
  { value: 12, en: 'December', ta: 'டிசம்பர்', short: 'Dec' }
];

export const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminCollectionsScreen: React.FC<AdminCollectionsProps> = ({
  lang = 'ta',
  userRole: propUserRole,
  sangamName: propSangamName,
  sangamSlogan: propSangamSlogan
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [switchingCycle, setSwitchingCycle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // User Role & Permissions State
  const [currentUserRole, setCurrentUserRole] = useState<string>(propUserRole || 'SANGAM_ADMIN');
  const isAdmin = currentUserRole === 'SANGAM_ADMIN' || currentUserRole === 'SUPER_ADMIN';

  // Cycle Picker Modal State
  const [showCyclePickerModal, setShowCyclePickerModal] = useState(false);

  // Create Next Cycle Modal State
  const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
  const [submittingNewCycle, setNewCycleSubmitting] = useState(false);
  const [completingCycle, setCompletingCycle] = useState(false);

  // New Cycle Form State
  const [newCycleName, setNewCycleName] = useState('');
  const [newMonthlyAmount, setNewMonthlyAmount] = useState('500');
  const [newStartMonth, setNewStartMonth] = useState(9);
  const [newStartYear, setNewStartYear] = useState(2029);
  const [newEndMonth, setNewEndMonth] = useState(8);
  const [newEndYear, setNewEndYear] = useState(2030);
  const [newDueDate, setNewDueDate] = useState('10');
  const [newGracePeriod, setNewGracePeriod] = useState('5');

  // Month Picker Target ('START' | 'END' | null)
  const [monthPickerTarget, setMonthPickerTarget] = useState<'START' | 'END' | null>(null);

  // Payment Collection Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateStr);
  const [dateError, setDateError] = useState<string>('');
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Bulk Mark All Paid State
  const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);

  useEffect(() => {
    getUserSession().then((s) => {
      if (s?.role) setCurrentUserRole(s.role);
    });
    loadMatrix();
  }, []);

  const handleMarkAllPaid = (member: any) => {
    if (processingMemberId) return;

    const totalPending = Number(member.totalPending || 0);
    if (totalPending <= 0) {
      Alert.alert(lang === 'ta' ? 'தகவல்' : 'Information', 'All cycle payments are already paid.');
      return;
    }

    Alert.alert(
      lang === 'ta' ? 'வசூல் உறுதிப்படுத்தல்' : 'Confirm Payment',
      lang === 'ta'
        ? `Are you sure you want to mark all pending cycle payments as paid for ${member.memberName}?`
        : `Are you sure you want to mark all pending cycle payments as paid for ${member.memberName}?`,
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        {
          text: lang === 'ta' ? 'ஆம், செலுத்து' : 'Yes, Mark All Paid',
          onPress: async () => {
            try {
              setProcessingMemberId(member.memberId);
              const res = await apiRequest(
                `/collections/member/${member.memberId}/mark-all-paid`,
                'POST',
                {
                  configId: selectedCycleId || undefined,
                  paymentMode: 'CASH',
                  paymentDate: getTodayDateStr(),
                  remarks: 'Bulk Mark All Paid'
                }
              );

              if (res.success) {
                Alert.alert(
                  lang === 'ta' ? 'வெற்றி' : 'Success',
                  res.data?.message || `Successfully marked all pending cycles as paid for ${member.memberName}.`
                );
                // Refresh matrix data to update balances, totals, and monthly statuses
                loadMatrix(selectedCycleId || undefined);
              } else {
                Alert.alert(t.error || 'Error', res.message || 'Failed to mark all cycle payments as paid.');
              }
            } catch (err: any) {
              Alert.alert(t.error || 'Error', err.message || 'Network error occurred');
            } finally {
              setProcessingMemberId(null);
            }
          }
        }
      ]
    );
  };

  const loadMatrix = async (configId?: string) => {
    try {
      setLoading(true);
      const url = configId ? `/collections/matrix?configId=${configId}` : '/collections/matrix';
      const res = await apiRequest(url);
      if (res && res.success && res.data) {
        setMatrixData(res.data);
        if (res.data.cycles && Array.isArray(res.data.cycles)) {
          setCycles(res.data.cycles);
        }
        if (res.data.activeConfig) {
          setSelectedCycleId(res.data.activeConfig.id);
        } else if (configId) {
          setSelectedCycleId(configId);
        }
      } else {
        Alert.alert(t.error || 'Error', res?.message || 'Failed to load collection cycle');
      }
    } catch (e: any) {
      console.warn('loadMatrix error:', e);
      Alert.alert(t.error || 'Error', e?.message || 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatrix(selectedCycleId || undefined);
  };

  const handleCycleChange = async (cycleId: string) => {
    try {
      setSwitchingCycle(true);
      setSelectedCycleId(cycleId);
      setShowCyclePickerModal(false);
      await loadMatrix(cycleId);
    } finally {
      setSwitchingCycle(false);
    }
  };

  const handleOpenCreateCycleModal = () => {
    const current = matrixData?.activeConfig || (cycles.length > 0 ? cycles[0] : null);
    let nextStartMonth = 9;
    let nextStartYear = new Date().getFullYear();
    let nextEndMonth = 8;
    let nextEndYear = nextStartYear + 1;
    let monthlyRate = 500;
    let dueDate = 10;
    let grace = 5;

    if (current) {
      monthlyRate = current.monthlyAmount || 500;
      dueDate = current.dueDate || 10;
      grace = current.gracePeriod || 5;

      const endYr = current.endYear || current.startYear || new Date().getFullYear();
      const endMo = current.endMonth || 12;

      nextStartYear = endMo === 12 ? endYr + 1 : endYr;
      nextStartMonth = endMo === 12 ? 1 : endMo + 1;
      nextEndYear = nextStartYear + 1;
      nextEndMonth = nextStartMonth === 1 ? 12 : nextStartMonth - 1;
    }

    setNewCycleName(`Monthly Sangam Fund ${nextStartYear}-${nextEndYear}`);
    setNewMonthlyAmount(String(monthlyRate));
    setNewStartMonth(nextStartMonth);
    setNewStartYear(nextStartYear);
    setNewEndMonth(nextEndMonth);
    setNewEndYear(nextEndYear);
    setNewDueDate(String(dueDate));
    setNewGracePeriod(String(grace));
    setShowCreateCycleModal(true);
  };

  const handleSubmitCreateCycle = async () => {
    const amount = parseFloat(newMonthlyAmount);
    if (!newCycleName.trim()) {
      Alert.alert(t.error || 'Error', lang === 'ta' ? 'சுழற்சி பெயரை உள்ளிடவும்' : 'Please enter cycle name');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t.error || 'Error', lang === 'ta' ? 'சரியான மாதாந்திர தொகையை உள்ளிடவும்' : 'Please enter a valid monthly amount');
      return;
    }

    setNewCycleSubmitting(true);
    try {
      const payload = {
        collectionName: newCycleName.trim(),
        monthlyAmount: amount,
        startMonth: newStartMonth,
        startYear: newStartYear,
        endMonth: newEndMonth,
        endYear: newEndYear,
        dueDate: parseInt(newDueDate, 10) || 10,
        gracePeriod: parseInt(newGracePeriod, 10) || 5
      };

      const res = await apiRequest('/collections/config', 'POST', payload);
      if (res.success && res.data) {
        setShowCreateCycleModal(false);
        Alert.alert(
          lang === 'ta' ? 'வெற்றி' : 'Success',
          lang === 'ta'
            ? `புதிய வசூல் சுழற்சி "${newCycleName}" வெற்றிகரமாக உருவாக்கப்பட்டது!`
            : `Collection cycle "${newCycleName}" created successfully!`
        );
        const newCycleId = res.data.id;
        setSelectedCycleId(newCycleId);
        loadMatrix(newCycleId);
      } else {
        Alert.alert(t.error || 'Error', res.message || 'Failed to create collection cycle');
      }
    } catch (err: any) {
      Alert.alert(t.error || 'Error', err.message || 'Network error occurred');
    } finally {
      setNewCycleSubmitting(false);
    }
  };

  const handleCompleteCycle = (configId: string, cycleName: string) => {
    Alert.alert(
      lang === 'ta' ? 'சுழற்சியை முடிக்க' : 'Complete Cycle',
      lang === 'ta'
        ? `நிச்சயமாக "${cycleName}" வசூல் சுழற்சியை முடித்ததாக குறிக்க விரும்புகிறீர்களா?`
        : `Are you sure you want to mark "${cycleName}" as completed?`,
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        {
          text: lang === 'ta' ? 'ஆம், முடிக்க' : 'Yes, Complete',
          style: 'destructive',
          onPress: async () => {
            try {
              setCompletingCycle(true);
              const res = await apiRequest(`/collections/cycles/${configId}/complete`, 'PUT');
              if (res.success) {
                Alert.alert(
                  lang === 'ta' ? 'வெற்றி' : 'Success',
                  lang === 'ta' ? 'சுழற்சி முடித்ததாக மாற்றப்பட்டது' : 'Cycle marked as completed'
                );
                loadMatrix(configId);
              } else {
                Alert.alert(t.error || 'Error', res.message || 'Failed to complete cycle');
              }
            } catch (err: any) {
              Alert.alert(t.error || 'Error', err.message || 'Network error');
            } finally {
              setCompletingCycle(false);
            }
          }
        }
      ]
    );
  };

  const handleCellPress = (row: any, cell: any) => {
    if (cell.status === 'N/A') return;

    if (cell.status === 'PAID') {
      // Show receipt
      fetchAndShowReceipt(row, cell);
      return;
    }

    // Open Collect Payment Modal
    setSelectedRow(row);
    setSelectedCell(cell);
    setAmountPaid(String(cell.balanceAmount || cell.expectedAmount || 500));
    setPaymentDate(getTodayDateStr());
    setDateError('');
    setPaymentMode('UPI');
    setReferenceNumber('');
    setRemarks('');
    setShowPaymentModal(true);
  };

  const fetchAndShowReceipt = async (row: any, cell: any) => {
    try {
      const session = await getUserSession();
      const sangamName = session?.sangamName || propSangamName || 'Oor Nithi Sangam';
      const sangamSlogan = session?.slogan || propSangamSlogan;

      let rData: ReceiptData = {
        receiptNumber: 'REC-' + (cell.collectionId ? cell.collectionId.substring(0, 8).toUpperCase() : Date.now()),
        sangamName,
        sangamSlogan,
        memberName: row.memberName,
        memberCode: row.memberCode,
        monthName: cell.monthName,
        year: cell.year,
        amountPaid: Number(cell.paidAmount || cell.expectedAmount || 500),
        expectedAmount: cell.expectedAmount,
        paymentMode: 'CASH',
        paymentDate: new Date(),
        collectedBy: 'Admin'
      };

      if (cell.collectionId) {
        const res = await apiRequest(`/collections/receipt/${cell.collectionId}`);
        if (res.success && res.data) {
          rData = {
            ...rData,
            ...res.data,
            sangamName: res.data.sangamName || sangamName,
            sangamSlogan: res.data.sangamSlogan || sangamSlogan
          };
        }
      }

      setReceiptData(rData);
      setShowReceiptModal(true);
    } catch (err) {
      // fallback
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedCell || !selectedCell.collectionId) {
      Alert.alert(t.error, 'Invalid collection slot');
      return;
    }
    const amountNum = parseFloat(amountPaid);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t.error, 'Please enter a valid amount');
      return;
    }

    const todayStr = getTodayDateStr();
    const trimmedDate = paymentDate ? paymentDate.trim() : '';
    if (!trimmedDate) {
      Alert.alert(t.error, lang === 'ta' ? 'வசூல் தேதியை உள்ளிடவும்' : 'Please enter payment date');
      return;
    }
    if (trimmedDate > todayStr) {
      Alert.alert(
        t.error,
        t.futureDateError || (lang === 'ta'
          ? 'எதிர்கால தேதியை தேர்வு செய்ய முடியாது. இன்று அல்லது முந்தைய தேதியை மட்டுமே தேர்வு செய்யவும்.'
          : 'Future payment date is not allowed. Only today or previous dates can be chosen.')
      );
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload = {
        memberCollectionId: selectedCell.collectionId,
        amountPaid: amountNum,
        paymentDate: trimmedDate,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined
      };

      const res = await apiRequest('/collections/payment', 'POST', payload);
      if (res.success) {
        setShowPaymentModal(false);
        const receiptResp = res.data;
        const session = await getUserSession();

        const receipt: ReceiptData = {
          receiptNumber: receiptResp?.receiptNumber || 'REC-' + Date.now(),
          sangamName: receiptResp?.sangamName || session?.sangamName || propSangamName || 'Oor Nithi Sangam',
          sangamSlogan: receiptResp?.sangamSlogan || session?.slogan || propSangamSlogan,
          sangamAddress: receiptResp?.sangamAddress,
          sangamMobile: receiptResp?.sangamMobile,
          memberName: receiptResp?.memberName || selectedRow?.memberName,
          memberCode: receiptResp?.memberCode || selectedRow?.memberCode,
          monthName: receiptResp?.monthName || selectedCell?.monthName,
          year: receiptResp?.year || selectedCell?.year,
          amountPaid: receiptResp?.amountPaid || amountNum,
          expectedAmount: selectedCell?.expectedAmount,
          paymentMode,
          paymentDate: receiptResp?.paymentDate || trimmedDate,
          collectedBy: receiptResp?.collectedBy || session?.name || 'Admin',
          referenceNumber: referenceNumber.trim() || undefined
        };

        setReceiptData(receipt);
        setShowReceiptModal(true);
        loadMatrix(selectedCycleId || undefined);
      } else {
        Alert.alert(t.error, res.message || 'Payment submission failed');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Calendar and Date Range Helpers
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

  const activeConfig = (selectedCycleId ? cycles.find(c => c.id === selectedCycleId) : null) || matrixData?.activeConfig;
  const grandTotalPaid = matrixData?.grandTotalPaid != null ? Number(matrixData.grandTotalPaid) : 0;
  const grandTotalPending = matrixData?.grandTotalPending != null ? Number(matrixData.grandTotalPending) : 0;
  const rows = matrixData?.rows || [];

  const filteredRows = rows.filter((r: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.memberName && r.memberName.toLowerCase().includes(q)) ||
      (r.memberCode && r.memberCode.toLowerCase().includes(q)) ||
      (r.mobileNumber && r.mobileNumber.includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP CYCLE SELECTOR & ACTIONS HEADER */}
      <View style={styles.cycleHeaderCard}>
        <View style={styles.cycleTopRow}>
          <View style={styles.cycleTitleGroup}>
            <Text style={styles.cycleSectionIcon}>📂</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cycleSectionLabel}>
                {lang === 'ta' ? 'வசூல் சுழற்சி' : 'Collection Cycle'}
              </Text>
              <Text style={styles.cycleHeaderStatusHint}>
                {lang === 'ta' ? 'மாதாந்திர சந்தா சுழற்சிகள்' : 'Monthly Member Dues'}
              </Text>
            </View>
          </View>

          {/* Admin Action: Start Next Cycle */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.newCycleBtn}
              activeOpacity={0.8}
              onPress={handleOpenCreateCycleModal}
            >
              <Text style={styles.newCycleBtnIcon}>➕</Text>
              <Text style={styles.newCycleBtnText}>
                {lang === 'ta' ? 'புதிய சுழற்சி' : 'Next Cycle'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CYCLE SWITCHER SELECTOR BUTTON */}
        <TouchableOpacity
          style={styles.cycleSelectorTrigger}
          activeOpacity={0.7}
          disabled={switchingCycle || loading}
          onPress={() => setShowCyclePickerModal(true)}
        >
          <View style={styles.cycleSelectorLeft}>
            <View style={[
              styles.cycleStatusDot,
              activeConfig?.status === 'ACTIVE' ? styles.dotActive : styles.dotCompleted
            ]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cycleSelectorTitle} numberOfLines={1}>
                {activeConfig?.collectionName || 'Select Cycle'}
              </Text>
              <Text style={styles.cycleSelectorSub}>
                {activeConfig ? (
                  `${MONTH_NAMES.find(m => m.value === activeConfig.startMonth)?.short || activeConfig.startMonth}/${activeConfig.startYear} – ${MONTH_NAMES.find(m => m.value === activeConfig.endMonth)?.short || activeConfig.endMonth}/${activeConfig.endYear}`
                ) : 'Tap to choose cycle'}
                {activeConfig?.status ? ` • [${activeConfig.status}]` : ''}
              </Text>
            </View>
          </View>
          {switchingCycle || loading ? (
            <View style={styles.cycleSelectorLoadingRight}>
              <ActivityIndicator size="small" color="#0B3C2D" />
            </View>
          ) : (
            <View style={styles.cycleSelectorRight}>
              <Text style={styles.cycleSwitchPromptText}>
                {lang === 'ta' ? 'மாற்ற' : 'Switch'}
              </Text>
              <Text style={styles.cycleDropdownArrow}>▼</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* CURRENT CYCLE METADATA PILLS */}
        {activeConfig && (
          <View style={styles.cycleMetaRow}>
            <View style={styles.cycleMetaPill}>
              <Text style={styles.cycleMetaText}>
                📅 {lang === 'ta' ? 'தவணை' : 'Due'}: {activeConfig.dueDate || 10}-ஆம் தேதி
              </Text>
            </View>
            <View style={styles.cycleMetaPill}>
              <Text style={styles.cycleMetaText}>
                ⏳ {lang === 'ta' ? 'சலுகை' : 'Grace'}: {activeConfig.gracePeriod || 5} {lang === 'ta' ? 'நாட்கள்' : 'days'}
              </Text>
            </View>
            <View style={[styles.cycleMetaPill, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
              <Text style={[styles.cycleMetaText, { color: '#047857', fontWeight: '800' }]}>
                ₹{activeConfig.monthlyAmount || 500} / {lang === 'ta' ? 'மாதம்' : 'mo'}
              </Text>
            </View>

            {/* Mark Completed button if ACTIVE and Admin */}
            {isAdmin && activeConfig.status === 'ACTIVE' && (
              <TouchableOpacity
                style={styles.completeCycleMiniBtn}
                activeOpacity={0.7}
                disabled={completingCycle}
                onPress={() => handleCompleteCycle(activeConfig.id, activeConfig.collectionName)}
              >
                <Text style={styles.completeCycleMiniText}>
                  🏁 {completingCycle ? '...' : (lang === 'ta' ? 'முடிக்க' : 'Complete')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 2. SUMMARY METRICS BANNER */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t.totalPaid}</Text>
          <Text style={styles.summaryValPaid}>₹{grandTotalPaid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t.totalPending}</Text>
          <Text style={styles.summaryValPending}>₹{grandTotalPending.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t.monthlyAmount}</Text>
          <Text style={styles.summaryVal}>₹{activeConfig?.monthlyAmount || 500}</Text>
        </View>
      </View>

      {/* 3. SEARCH BOX */}
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

      {/* 4. MEMBER MATRIX LIST */}
      {loading ? (
        <View style={styles.cycleLoadingContainer}>
          <ActivityIndicator size="large" color="#0B3C2D" />
        </View>
      ) : (
        <FlatList
          data={filteredRows}
          keyExtractor={(item) => item.memberId || item.memberCode || Math.random().toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📑</Text>
              <Text style={styles.emptyText}>{t.noRecords}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const totalPending = Number(item.totalPending || 0);
            const isProcessing = processingMemberId === item.memberId;
            const isAllPaid = totalPending <= 0;

            return (
              <View style={styles.matrixRowCard}>
                <View style={styles.rowTop}>
                  <View style={styles.rowMember}>
                    <Text style={styles.rowCode}>{item.memberCode || 'MEMBER'}</Text>
                    <Text style={styles.rowName} numberOfLines={1}>{item.memberName}</Text>
                  </View>
                  <View style={styles.rowTotalsWrapper}>
                    <View style={styles.rowTotals}>
                      <Text style={styles.paidText}>Paid: ₹{Number(item.totalPaid || 0).toFixed(0)}</Text>
                      <Text style={styles.pendingText}>Pending: ₹{totalPending.toFixed(0)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.markAllPaidBtn,
                        isAllPaid && styles.markAllPaidBtnDisabled
                      ]}
                      disabled={isProcessing}
                      onPress={() => handleMarkAllPaid(item)}
                      activeOpacity={0.7}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={[
                          styles.markAllPaidBtnText,
                          isAllPaid && styles.markAllPaidBtnTextDisabled
                        ]}>
                          {isAllPaid ? '✓ All Paid' : (lang === 'ta' ? 'அனைத்தும் செலுத்து' : 'Mark All Paid')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* MONTH SLOTS */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsScroll}>
                {Array.isArray(item.months) &&
                  item.months.map((m: any, idx: number) => {
                    const isPaid = m.status === 'PAID';
                    const isPending = m.status === 'PENDING';
                    const isPartial = m.status === 'PARTIAL';

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.monthBadge,
                          isPaid ? styles.monthPaid : isPending ? styles.monthPending : isPartial ? styles.monthPartial : styles.monthNA
                        ]}
                        onPress={() => handleCellPress(item, m)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.monthName, isPaid && styles.textWhite]}>
                          {m.monthName}
                        </Text>
                        <Text style={[styles.monthStatusText, isPaid && styles.textYellow]}>
                          {isPaid ? '✓ Paid' : `₹${m.balanceAmount || m.expectedAmount || 500}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          ); }}
        />
      )}

      {/* 5. PAYMENT MODAL */}
      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t.collectPayment}</Text>
                <Text style={styles.modalSub}>{selectedRow?.memberName} • {selectedCell?.monthName} {selectedCell?.year}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t.amount} (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={amountPaid}
                onChangeText={setAmountPaid}
                keyboardType="numeric"
              />

              {/* PAYMENT DATE FIELD */}
              <Text style={styles.inputLabel}>
                {t.paymentDate} / {lang === 'ta' ? 'வசூல் தேதி' : 'Payment Date'} *
              </Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.textInput, styles.dateTextInput, dateError ? styles.textInputError : null]}
                  value={paymentDate}
                  onChangeText={(text) => {
                    setPaymentDate(text);
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
                      if (paymentDate && paymentDate.length === 10) {
                        const parts = paymentDate.split('-');
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
                  style={[styles.quickDateChip, paymentDate === todayDateStr && styles.quickDateChipActive]}
                  onPress={() => {
                    setPaymentDate(todayDateStr);
                    setDateError('');
                  }}
                >
                  <Text style={[styles.quickDateChipText, paymentDate === todayDateStr && styles.quickDateChipTextActive]}>
                    ✓ {lang === 'ta' ? 'இன்று (Today)' : 'Today'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickDateChip, paymentDate === yesterdayDateStr && styles.quickDateChipActive]}
                  onPress={() => {
                    setPaymentDate(yesterdayDateStr);
                    setDateError('');
                  }}
                >
                  <Text style={[styles.quickDateChipText, paymentDate === yesterdayDateStr && styles.quickDateChipTextActive]}>
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
                placeholder="UTR / Trans ID (optional)"
              />

              <Text style={styles.inputLabel}>{t.remarks}</Text>
              <TextInput
                style={styles.textInput}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Remarks (optional)"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submittingPayment && { opacity: 0.7 }]}
              onPress={handleSubmitPayment}
              disabled={submittingPayment}
            >
              {submittingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{t.submit}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. RECEIPT MODAL */}
      <Modal visible={showReceiptModal} transparent animationType="fade" onRequestClose={() => setShowReceiptModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderTitle}>✓ {t.receiptDetails}</Text>
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
                    <Text style={styles.receiptField}>{t.name}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.memberName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>{t.memberCode}:</Text>
                    <Text style={styles.receiptVal}>{receiptData.memberCode || '—'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptField}>Period:</Text>
                    <Text style={styles.receiptVal}>{receiptData.monthName} {receiptData.year}</Text>
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

      {/* 7. CYCLE PICKER MODAL */}
      <Modal
        visible={showCyclePickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCyclePickerModal(false)}
      >
        <View style={styles.modalBottomSheetContainer}>
          <View style={styles.cyclePickerCard}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.cyclePickerHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.cyclePickerTitle}>
                  {lang === 'ta' ? 'வசூல் சுழற்சியைத் தேர்ந்தெடுக்கவும்' : 'Select Collection Cycle'}
                </Text>
                <Text style={styles.cyclePickerSub}>
                  {lang === 'ta'
                    ? 'விவரங்களைக் காண சுழற்சியைத் தொடவும்'
                    : 'Tap a cycle to view its member collection status'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cyclePickerCloseBtn}
                onPress={() => setShowCyclePickerModal(false)}
              >
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {cycles.map((c) => {
                const isSelected = (selectedCycleId === c.id) || (activeConfig?.id === c.id);
                const isActive = c.status === 'ACTIVE';
                const isThisLoading = switchingCycle && selectedCycleId === c.id;

                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.cyclePickerItem,
                      isSelected && styles.cyclePickerItemActive
                    ]}
                    disabled={switchingCycle}
                    activeOpacity={0.7}
                    onPress={() => handleCycleChange(c.id)}
                  >
                    <View style={styles.cyclePickerItemTop}>
                      <Text style={[styles.cyclePickerItemName, isSelected && styles.cyclePickerItemNameActive]}>
                        {c.collectionName}
                      </Text>
                      {isThisLoading ? (
                        <ActivityIndicator size="small" color="#0B3C2D" />
                      ) : (
                        <View style={[
                          styles.cycleStatusBadge,
                          isActive ? styles.badgeActive : styles.badgeCompleted
                        ]}>
                          <Text style={[
                            styles.cycleStatusBadgeText,
                            isActive ? styles.badgeActiveText : styles.badgeCompletedText
                          ]}>
                            {isActive ? (lang === 'ta' ? 'தற்போது இயங்குவது' : 'ACTIVE') : (lang === 'ta' ? 'முடிவடைந்தது' : 'COMPLETED')}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cyclePickerItemBottom}>
                      <Text style={styles.cyclePickerTenure}>
                        🗓️ {MONTH_NAMES.find(m => m.value === c.startMonth)?.short || c.startMonth}/{c.startYear} – {MONTH_NAMES.find(m => m.value === c.endMonth)?.short || c.endMonth}/{c.endYear}
                      </Text>
                      <Text style={styles.cyclePickerRate}>
                        ₹{c.monthlyAmount || 500} / {lang === 'ta' ? 'மாதம்' : 'mo'}
                      </Text>
                    </View>

                    {isSelected && (
                      <View style={styles.cycleSelectedIndicator}>
                        <Text style={styles.cycleSelectedIndicatorText}>
                          ✓ {lang === 'ta' ? 'தற்போது தேர்ந்தெடுக்கப்பட்டுள்ளது' : 'Currently Selected'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.cyclePickerDoneBtn}
              onPress={() => setShowCyclePickerModal(false)}
            >
              <Text style={styles.cyclePickerDoneBtnText}>{t.close || 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 8. CREATE NEXT COLLECTION CYCLE MODAL */}
      <Modal
        visible={showCreateCycleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateCycleModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBottomSheetContainer}
        >
          <View style={styles.createCycleCard}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.createCycleHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.createCycleTitle}>
                  ➕ {lang === 'ta' ? 'புதிய வசூல் சுழற்சி தொடங்கு' : 'Start Next Collection Cycle'}
                </Text>
                <Text style={styles.createCycleSub}>
                  {lang === 'ta'
                    ? 'புதிய ஆண்டிற்கான மாதாந்திர சந்தா அட்டவணையை உருவாக்கவும்'
                    : 'Set up collection period, rate, and due dates for members'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cyclePickerCloseBtn}
                onPress={() => setShowCreateCycleModal(false)}
              >
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingBottom: 6 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Cycle Name */}
              <View style={styles.createCycleFieldGroup}>
                <Text style={styles.inputLabel}>
                  {lang === 'ta' ? 'சுழற்சி பெயர் (Cycle Name) *' : 'Collection Cycle Name *'}
                </Text>
                <TextInput
                  style={styles.cycleInput}
                  value={newCycleName}
                  onChangeText={setNewCycleName}
                  placeholder="e.g. Monthly Sangam Fund 2029-2030"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Monthly Amount */}
              <View style={styles.createCycleFieldGroup}>
                <Text style={styles.inputLabel}>
                  {lang === 'ta' ? 'மாதாந்திர சந்தா தொகை (Monthly Amount ₹) *' : 'Monthly Amount (₹) *'}
                </Text>
                <TextInput
                  style={styles.cycleInput}
                  value={newMonthlyAmount}
                  onChangeText={setNewMonthlyAmount}
                  keyboardType="numeric"
                  placeholder="e.g. 500"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Start Tenure: Month & Year */}
              <View style={styles.createCycleFieldGroup}>
                <Text style={styles.inputLabel}>
                  {lang === 'ta' ? 'தொடக்க காலம் (Start Tenure) *' : 'Start Month & Year *'}
                </Text>
                <View style={styles.tenureRow}>
                  {/* Month Picker Button */}
                  <TouchableOpacity
                    style={styles.tenureMonthBtn}
                    activeOpacity={0.7}
                    onPress={() => setMonthPickerTarget('START')}
                  >
                    <Text style={styles.tenureMonthLabel}>
                      {MONTH_NAMES.find(m => m.value === newStartMonth)?.[lang === 'ta' ? 'ta' : 'en'] || `Month ${newStartMonth}`}
                    </Text>
                    <Text style={styles.tenureDropdownIcon}>▼</Text>
                  </TouchableOpacity>

                  {/* Year Stepper */}
                  <View style={styles.yearStepper}>
                    <TouchableOpacity
                      style={styles.yearStepBtn}
                      activeOpacity={0.7}
                      onPress={() => setNewStartYear(y => y - 1)}
                    >
                      <Text style={styles.yearStepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.yearStepVal}>{newStartYear}</Text>
                    <TouchableOpacity
                      style={styles.yearStepBtn}
                      activeOpacity={0.7}
                      onPress={() => setNewStartYear(y => y + 1)}
                    >
                      <Text style={styles.yearStepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* End Tenure: Month & Year */}
              <View style={styles.createCycleFieldGroup}>
                <Text style={styles.inputLabel}>
                  {lang === 'ta' ? 'முடிவு காலம் (End Tenure) *' : 'End Month & Year *'}
                </Text>
                <View style={styles.tenureRow}>
                  {/* Month Picker Button */}
                  <TouchableOpacity
                    style={styles.tenureMonthBtn}
                    activeOpacity={0.7}
                    onPress={() => setMonthPickerTarget('END')}
                  >
                    <Text style={styles.tenureMonthLabel}>
                      {MONTH_NAMES.find(m => m.value === newEndMonth)?.[lang === 'ta' ? 'ta' : 'en'] || `Month ${newEndMonth}`}
                    </Text>
                    <Text style={styles.tenureDropdownIcon}>▼</Text>
                  </TouchableOpacity>

                  {/* Year Stepper */}
                  <View style={styles.yearStepper}>
                    <TouchableOpacity
                      style={styles.yearStepBtn}
                      activeOpacity={0.7}
                      onPress={() => setNewEndYear(y => y - 1)}
                    >
                      <Text style={styles.yearStepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.yearStepVal}>{newEndYear}</Text>
                    <TouchableOpacity
                      style={styles.yearStepBtn}
                      activeOpacity={0.7}
                      onPress={() => setNewEndYear(y => y + 1)}
                    >
                      <Text style={styles.yearStepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Due Date & Grace Period Row */}
              <View style={styles.createCycleDualRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>
                    {lang === 'ta' ? 'தவணை நாள் (Due Day)' : 'Due Day of Month'}
                  </Text>
                  <TextInput
                    style={[styles.cycleInput, { textAlign: 'center' }]}
                    value={newDueDate}
                    onChangeText={setNewDueDate}
                    keyboardType="number-pad"
                    placeholder="10"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>
                    {lang === 'ta' ? 'சலுகை (Grace Days)' : 'Grace Period (Days)'}
                  </Text>
                  <TextInput
                    style={[styles.cycleInput, { textAlign: 'center' }]}
                    value={newGracePeriod}
                    onChangeText={setNewGracePeriod}
                    keyboardType="number-pad"
                    placeholder="5"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.cycleInfoTip}>
                <Text style={styles.cycleInfoTipText}>
                  ℹ️ {lang === 'ta'
                    ? 'சுழற்சி உருவாக்கப்பட்டவுடன், அனைத்து உறுப்பினர்களுக்கும் மாத தவணைகள் தானாக உருவாக்கப்படும்.'
                    : 'Creating this cycle will automatically generate monthly slots for all active members in the Sangam.'}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.createCycleActions}>
              <TouchableOpacity
                style={styles.createCycleCancelBtn}
                activeOpacity={0.8}
                onPress={() => setShowCreateCycleModal(false)}
              >
                <Text style={styles.createCycleCancelBtnText}>{t.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createCycleSubmitBtn, submittingNewCycle && { opacity: 0.7 }]}
                activeOpacity={0.8}
                disabled={submittingNewCycle}
                onPress={handleSubmitCreateCycle}
              >
                {submittingNewCycle ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createCycleSubmitBtnText}>
                    ✓ {lang === 'ta' ? 'சுழற்சியை தொடங்கு' : 'Start Cycle'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 9. QUICK MONTH SELECTOR MODAL (FOR START/END MONTH) */}
      <Modal
        visible={monthPickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthPickerTarget(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.monthPickerCard}>
            <Text style={styles.monthPickerTitle}>
              {lang === 'ta' ? 'மாதத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Month'}
            </Text>
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((m) => {
                const isSelected = monthPickerTarget === 'START'
                  ? newStartMonth === m.value
                  : newEndMonth === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={[styles.monthGridBtn, isSelected && styles.monthGridBtnActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (monthPickerTarget === 'START') {
                        setNewStartMonth(m.value);
                      } else {
                        setNewEndMonth(m.value);
                      }
                      setMonthPickerTarget(null);
                    }}
                  >
                    <Text style={[styles.monthGridBtnText, isSelected && styles.monthGridBtnTextActive]}>
                      {m[lang === 'ta' ? 'ta' : 'en']}
                    </Text>
                    <Text style={[styles.monthGridBtnSub, isSelected && styles.monthGridBtnSubActive]}>
                      {m.short}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.monthPickerCancelBtn}
              activeOpacity={0.7}
              onPress={() => setMonthPickerTarget(null)}
            >
              <Text style={styles.monthPickerCancelBtnText}>{t.cancel || 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 10. CALENDAR DATE PICKER MODAL (FOR PAYMENT DATE) */}
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
                const isSelected = paymentDate === cellDateStr;
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
                        setPaymentDate(cellDateStr);
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
  cycleScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  cycleTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  cycleTabActive: {
    backgroundColor: '#0B3C2D'
  },
  cycleTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  cycleTabTextActive: {
    color: '#FFFFFF'
  },
  cycleTabStatus: {
    fontSize: 9,
    color: '#64748B'
  },
  cycleTabStatusActive: {
    color: '#FDE047'
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#0B3C2D',
    margin: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#E2E8F0',
    textTransform: 'uppercase'
  },
  summaryValPaid: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4ADE80',
    marginTop: 2
  },
  summaryValPending: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F87171',
    marginTop: 2
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2
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
  matrixRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  rowMember: {
    flex: 1
  },
  rowCode: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  rowTotalsWrapper: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start'
  },
  rowTotals: {
    alignItems: 'flex-end'
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A'
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 1
  },
  markAllPaidBtn: {
    backgroundColor: '#0B3C2D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  markAllPaidBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1'
  },
  markAllPaidBtnText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800'
  },
  markAllPaidBtnTextDisabled: {
    color: '#94A3B8'
  },
  slotsScroll: {
    flexDirection: 'row',
    paddingTop: 4
  },
  monthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
    minWidth: 58
  },
  monthPaid: {
    backgroundColor: '#0B3C2D',
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  monthPending: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  monthPartial: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  monthNA: {
    backgroundColor: '#F1F5F9'
  },
  monthName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  },
  monthStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2
  },
  textWhite: {
    color: '#FFFFFF'
  },
  textYellow: {
    color: '#FDE047'
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
  cycleLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
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
    alignItems: 'flex-start',
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
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
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

  // Cycle Header Card
  cycleHeaderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  cycleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  cycleTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  cycleSectionIcon: {
    fontSize: 20,
    marginRight: 8
  },
  cycleSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  cycleActiveName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B3C2D',
    marginTop: 1
  },
  cycleHeaderStatusHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3C2D',
    marginTop: 1
  },
  newCycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B3C2D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  newCycleBtnIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    marginRight: 4
  },
  newCycleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  cycleSelectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  cycleSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  cycleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  dotActive: {
    backgroundColor: '#16A34A'
  },
  dotCompleted: {
    backgroundColor: '#94A3B8'
  },
  cycleSelectorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  cycleSelectorSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1
  },
  cycleSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  cycleSelectorLoadingRight: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cycleSwitchPromptText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B3C2D',
    marginRight: 4
  },
  cycleDropdownArrow: {
    fontSize: 9,
    color: '#0B3C2D'
  },
  cycleMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  cycleMetaPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cycleMetaText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  completeCycleMiniBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto'
  },
  completeCycleMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309'
  },

  // Modal Overlays
  modalBottomSheetContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    width: '100%'
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  bottomSheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12
  },

  // Cycle Picker Bottom Sheet Styles
  cyclePickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12
  },
  cyclePickerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12
  },
  cyclePickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  cyclePickerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  cyclePickerCloseBtn: {
    padding: 6
  },
  cyclePickerItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  cyclePickerItemActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#0B3C2D'
  },
  cyclePickerItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  cyclePickerItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 8
  },
  cyclePickerItemNameActive: {
    color: '#0B3C2D'
  },
  cycleStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5
  },
  cycleStatusBadgeText: {
    fontSize: 9.5,
    fontWeight: '700'
  },
  badgeActive: {
    backgroundColor: '#DCFCE7'
  },
  badgeActiveText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D'
  },
  badgeCompleted: {
    backgroundColor: '#F1F5F9'
  },
  badgeCompletedText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B'
  },
  cyclePickerItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  cyclePickerTenure: {
    fontSize: 11.5,
    color: '#64748B'
  },
  cyclePickerRate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3C2D'
  },
  cycleSelectedIndicator: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0'
  },
  cycleSelectedIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D'
  },
  cyclePickerDoneBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10
  },
  cyclePickerDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },

  // Create Cycle Bottom Sheet Styles
  createCycleCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12
  },
  createCycleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8
  },
  createCycleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  createCycleSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  createCycleFieldGroup: {
    marginBottom: 10
  },
  createCycleDualRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10
  },
  cycleInput: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: '#0F172A'
  },
  tenureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  tenureMonthBtn: {
    flex: 1.2,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12
  },
  tenureMonthLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  tenureDropdownIcon: {
    fontSize: 10,
    color: '#64748B'
  },
  yearStepper: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    overflow: 'hidden'
  },
  yearStepBtn: {
    width: 44,
    height: '100%',
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  yearStepBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 22
  },
  yearStepVal: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  cycleInfoTip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 8
  },
  cycleInfoTipText: {
    fontSize: 11.5,
    color: '#15803D',
    lineHeight: 17
  },
  createCycleActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  createCycleCancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  createCycleCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  createCycleSubmitBtn: {
    flex: 1.5,
    height: 48,
    backgroundColor: '#0B3C2D',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  createCycleSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },

  // Month Picker Sub-modal
  monthPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 360,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10
  },
  monthPickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B3C2D',
    marginBottom: 12
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 12
  },
  monthGridBtn: {
    width: '30%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center'
  },
  monthGridBtnActive: {
    backgroundColor: '#0B3C2D',
    borderColor: '#0B3C2D'
  },
  monthGridBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B'
  },
  monthGridBtnTextActive: {
    color: '#FFFFFF'
  },
  monthGridBtnSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1
  },
  monthGridBtnSubActive: {
    color: '#FDE047'
  },
  monthPickerCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginTop: 4
  },
  monthPickerCancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B'
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
  textInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
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
  quickDateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4
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

  // Calendar Modal Styles
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
