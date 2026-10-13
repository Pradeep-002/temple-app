import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { apiRequest, getUserSession, saveUserSession } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';

interface CycleOption {
  id: string;
  collectionName: string;
  monthlyAmount: number;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  status: 'ACTIVE' | 'COMPLETED' | string;
}

interface PaymentItem {
  memberCollectionId: string;
  monthName: string;
  year: number;
  periodOrder: number;
  expectedAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | string;
  paymentDate?: string | null;
  paymentMode?: string | null;
  receiptNumber?: string | null;
  referenceNumber?: string | null;
  collectedBy?: string | null;
}

interface PaymentSummary {
  activeConfigId?: string;
  collectionName?: string;
  cycleStatus?: string;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  monthlyExpectedAmount: number;
  totalExpected: number;
  totalPaid: number;
  totalOutstanding: number;
  currentStatus: string;
  cycles?: CycleOption[];
  payments: PaymentItem[];
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MemberPaymentsScreen = ({
  lang = 'ta',
  sangamName: propSangamName,
  sangamSlogan: propSangamSlogan,
  onBrandingUpdate
}: {
  lang?: MobileLanguage;
  sangamName?: string;
  sangamSlogan?: string;
  onBrandingUpdate?: (slogan: string, sangamName?: string) => void;
}) => {
  const t = mobileTranslations[lang];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Live Sangam Settings (configured in Settings Page)
  const [sangamSettings, setSangamSettings] = useState<{
    name?: string;
    slogan?: string;
    address?: string;
    mobileNumber?: string;
  }>({
    name: propSangamName ? propSangamName.trim() : undefined,
    slogan: propSangamSlogan ? propSangamSlogan.trim() : undefined
  });

  // Receipt Modal State
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const fetchLatestSangamSettings = async () => {
    let fallbackName = propSangamName ? propSangamName.trim() : sangamSettings.name;
    let fallbackSlogan = propSangamSlogan ? propSangamSlogan.trim() : sangamSettings.slogan;
    let fallbackMemberName = 'Member';
    let fallbackMemberCode = '—';

    try {
      const session = await getUserSession();
      if (session) {
        if (!fallbackName && session.sangamName) fallbackName = session.sangamName.trim();
        if (!fallbackSlogan && session.slogan) fallbackSlogan = session.slogan.trim();
        if (session.name) fallbackMemberName = session.name.trim();
        if (session.memberCode) fallbackMemberCode = session.memberCode;
      }

      const infoRes = await apiRequest('/sangam/info');
      if (infoRes.success && infoRes.data) {
        const info = infoRes.data;
        const liveSlogan = info.slogan ? String(info.slogan).trim() : fallbackSlogan;
        const liveName = info.name ? String(info.name).trim() : fallbackName;
        const liveAddress = [info.address, info.village, info.district]
          .filter((part: any) => part && String(part).trim())
          .map((part: any) => String(part).trim())
          .join(', ');
        const liveMobile = info.mobileNumber ? String(info.mobileNumber).trim() : '';

        const updatedSettings = {
          name: liveName,
          slogan: liveSlogan,
          address: liveAddress,
          mobileNumber: liveMobile
        };
        setSangamSettings(updatedSettings);

        if (session && (liveSlogan !== session.slogan || (liveName && liveName !== session.sangamName))) {
          await saveUserSession({
            ...session,
            slogan: liveSlogan || session.slogan,
            sangamName: liveName || session.sangamName
          });
        }
        if (onBrandingUpdate && liveSlogan) {
          onBrandingUpdate(liveSlogan, liveName);
        }

        return {
          ...updatedSettings,
          memberName: fallbackMemberName,
          memberCode: fallbackMemberCode
        };
      }
    } catch (e) {
      // network fallback
    }

    return {
      name: fallbackName,
      slogan: fallbackSlogan,
      address: sangamSettings.address || '',
      mobileNumber: sangamSettings.mobileNumber || '',
      memberName: fallbackMemberName,
      memberCode: fallbackMemberCode
    };
  };

  const loadPayments = async (configIdToLoad?: string | null) => {
    setLoading(true);
    try {
      const targetConfigId = configIdToLoad !== undefined ? configIdToLoad : selectedConfigId;
      const endpoint = targetConfigId
        ? `/collections/my-payments?configId=${targetConfigId}`
        : '/collections/my-payments';

      const [res] = await Promise.all([
        apiRequest(endpoint),
        fetchLatestSangamSettings()
      ]);

      if (res.success && res.data) {
        setSummary(res.data);
        if (res.data.activeConfigId) {
          setSelectedConfigId(res.data.activeConfigId);
        }
        const years = Array.from(
          new Set((res.data.payments || []).map((p: PaymentItem) => p.year))
        ).sort((a: any, b: any) => b - a) as number[];
        setAvailableYears(years);
      }
    } catch (err) {
      console.error('Failed to load member payments', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPayments(selectedConfigId);
  };

  const handleSelectCycle = (cycle: CycleOption) => {
    if (cycle.id === selectedConfigId) return;
    setSelectedConfigId(cycle.id);
    setSelectedYear('ALL');
    setSelectedStatus('ALL');
    loadPayments(cycle.id);
  };

  const openReceipt = async (item: PaymentItem) => {
    if (item.status === 'PENDING' && !item.receiptNumber) {
      const liveInfo = await fetchLatestSangamSettings();
      setSelectedReceipt({
        receiptNumber: 'PENDING',
        sangamName: (liveInfo.name || sangamSettings.name || propSangamName || 'Oor Nithi Sangam').trim(),
        sangamSlogan: (liveInfo.slogan || sangamSettings.slogan || propSangamSlogan || '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️').trim(),
        sangamAddress: (liveInfo.address || sangamSettings.address || '').trim(),
        sangamMobile: (liveInfo.mobileNumber || sangamSettings.mobileNumber || '').trim(),
        memberName: liveInfo.memberName || 'Member',
        memberCode: liveInfo.memberCode || '—',
        monthName: item.monthName,
        year: item.year,
        amountPaid: 0,
        expectedAmount: item.expectedAmount,
        status: item.status,
        isPending: true
      });
      setReceiptModalVisible(true);
      return;
    }

    setLoadingReceipt(true);
    setReceiptModalVisible(true);
    try {
      const [res, liveInfo] = await Promise.all([
        apiRequest(`/collections/receipt/${item.memberCollectionId}`),
        fetchLatestSangamSettings()
      ]);

      const resolvedSlogan = (
        liveInfo.slogan ||
        res?.data?.sangamSlogan ||
        res?.data?.slogan ||
        sangamSettings.slogan ||
        propSangamSlogan ||
        '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️'
      ).trim();

      const resolvedSangamName = (
        liveInfo.name ||
        res?.data?.sangamName ||
        sangamSettings.name ||
        propSangamName ||
        'Oor Nithi Sangam'
      ).trim();

      const resolvedAddress = (
        liveInfo.address ||
        res?.data?.sangamAddress ||
        sangamSettings.address ||
        ''
      ).trim();

      const resolvedMobile = (
        liveInfo.mobileNumber ||
        res?.data?.sangamMobile ||
        sangamSettings.mobileNumber ||
        ''
      ).trim();

      if (res.success && res.data) {
        setSelectedReceipt({
          ...res.data,
          sangamName: resolvedSangamName,
          sangamSlogan: resolvedSlogan,
          slogan: resolvedSlogan,
          sangamAddress: resolvedAddress,
          sangamMobile: resolvedMobile
        });
      } else {
        setSelectedReceipt({
          receiptNumber: item.receiptNumber || 'REC-' + item.memberCollectionId.substring(0, 8).toUpperCase(),
          sangamName: resolvedSangamName,
          sangamSlogan: resolvedSlogan,
          slogan: resolvedSlogan,
          sangamAddress: resolvedAddress,
          sangamMobile: resolvedMobile,
          memberName: liveInfo.memberName || 'Member',
          memberCode: liveInfo.memberCode || '—',
          monthName: item.monthName,
          year: item.year,
          amountPaid: item.paidAmount,
          expectedAmount: item.expectedAmount,
          paymentMode: item.paymentMode || 'CASH',
          paymentDate: item.paymentDate,
          collectedBy: item.collectedBy || 'Admin',
          referenceNumber: item.referenceNumber || '—',
          status: item.status
        });
      }
    } catch (err) {
      setSelectedReceipt({
        receiptNumber: item.receiptNumber || 'REC-' + item.memberCollectionId.substring(0, 8).toUpperCase(),
        sangamName: (sangamSettings.name || propSangamName || 'Oor Nithi Sangam').trim(),
        sangamSlogan: (sangamSettings.slogan || propSangamSlogan || '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️').trim(),
        sangamAddress: (sangamSettings.address || '').trim(),
        sangamMobile: (sangamSettings.mobileNumber || '').trim(),
        monthName: item.monthName,
        year: item.year,
        amountPaid: item.paidAmount,
        expectedAmount: item.expectedAmount,
        paymentMode: item.paymentMode || 'CASH',
        paymentDate: item.paymentDate,
        collectedBy: item.collectedBy || 'Admin',
        status: item.status
      });
    } finally {
      setLoadingReceipt(false);
    }
  };

  const buildReceiptHtml = (receipt: any, liveSlogan?: string, liveSangamName?: string) => {
    const sloganText = (
      liveSlogan ||
      receipt?.sangamSlogan ||
      receipt?.slogan ||
      sangamSettings.slogan ||
      propSangamSlogan ||
      '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️'
    ).trim();
    const sangamNameText = (
      liveSangamName ||
      receipt?.sangamName ||
      sangamSettings.name ||
      propSangamName ||
      'Oor Nithi Sangam'
    ).trim();
    const sangamAddressText = (receipt?.sangamAddress || sangamSettings.address || '').trim();
    const sangamMobileText = (receipt?.sangamMobile || sangamSettings.mobileNumber || '').trim();

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${receipt.receiptNumber || 'Payment'}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .receipt-container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #d4af37;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
    .header-banner {
      background: linear-gradient(135deg, #0b3c2d 0%, #166534 100%);
      color: #ffffff;
      padding: 24px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .slogan {
      font-size: 13px;
      color: #fde047;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      text-align: center;
      width: 100%;
    }
    .sangam-name {
      font-size: 22px;
      font-weight: 900;
      margin: 0;
      letter-spacing: 0.5px;
      text-align: center;
      width: 100%;
    }
    .sangam-address {
      font-size: 11px;
      color: #e2e8f0;
      margin-top: 6px;
      line-height: 1.4;
      text-align: center;
      width: 100%;
    }
    .title-ribbon {
      background: #fef3c7;
      border-bottom: 1.5px dashed #d4af37;
      padding: 8px 12px;
      text-align: center;
      font-size: 12px;
      font-weight: 800;
      color: #b45309;
      letter-spacing: 1px;
    }
    .content-body {
      padding: 24px;
    }
    .meta-box {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .meta-val {
      font-size: 13px;
      font-weight: 800;
      color: #0b3c2d;
      margin-top: 2px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .info-table tr td {
      padding: 9px 4px;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-table .lbl {
      color: #64748b;
      font-weight: 600;
      width: 45%;
    }
    .info-table .val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .amount-card {
      background: #dcfce7;
      border: 1.5px solid #86efac;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .amount-label {
      font-size: 11px;
      font-weight: 800;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-num {
      font-size: 32px;
      font-weight: 900;
      color: #14532d;
      margin-top: 4px;
    }
    .stamp-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      margin-top: 12px;
    }
    .sign-col {
      font-size: 10px;
      color: #64748b;
      border-top: 1px dashed #94a3b8;
      padding-top: 6px;
      text-align: center;
      width: 120px;
    }
    .paid-stamp {
      border: 2px solid #166534;
      background: #f0fdf4;
      color: #166534;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 1px;
      padding: 6px 12px;
      border-radius: 8px;
      transform: rotate(-3deg);
    }
    .footer-note {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header-banner">
      <div class="slogan">${sloganText}</div>
      <h1 class="sangam-name">${sangamNameText}</h1>
      <div class="sangam-address">
        ${sangamAddressText ? `${sangamAddressText}` : ''}${sangamAddressText && sangamMobileText ? ' • ' : ''}${sangamMobileText ? `Ph: ${sangamMobileText}` : ''}
      </div>
    </div>
    <div class="title-ribbon">
      மாதாந்திர சந்தா ரசீது • COLLECTION RECEIPT
    </div>
    <div class="content-body">
      <div class="meta-box">
        <div class="meta-item">
          <span class="meta-label">ரசீது எண் / RECEIPT NO</span>
          <span class="meta-val">${receipt.receiptNumber || '—'}</span>
        </div>
        <div class="meta-item" style="text-align: right;">
          <span class="meta-label">தேதி / DATE</span>
          <span class="meta-val">${receipt.paymentDate ? receipt.paymentDate.substring(0, 10) : '—'}</span>
        </div>
      </div>

      <table class="info-table">
        <tr>
          <td class="lbl">உறுப்பினர் / Member Name</td>
          <td class="val">${receipt.memberName || 'Member'}</td>
        </tr>
        <tr>
          <td class="lbl">உறுப்பினர் எண் / Member Code</td>
          <td class="val">${receipt.memberCode || '—'}</td>
        </tr>
        <tr>
          <td class="lbl">மாதம் & ஆண்டு / Period</td>
          <td class="val">${receipt.monthName} ${receipt.year}</td>
        </tr>
        <tr>
          <td class="lbl">செலுத்தும் முறை / Mode</td>
          <td class="val">${receipt.paymentMode || 'CASH'}</td>
        </tr>
        ${receipt.referenceNumber ? `
        <tr>
          <td class="lbl">பரிவர்த்தனை எண் / Ref No</td>
          <td class="val">${receipt.referenceNumber}</td>
        </tr>` : ''}
        ${receipt.collectedBy ? `
        <tr>
          <td class="lbl">வசூலித்தவர் / Collected By</td>
          <td class="val">${receipt.collectedBy}</td>
        </tr>` : ''}
      </table>

      <div class="amount-card">
        <div class="amount-label">AMOUNT PAID / வசூலான தொகை</div>
        <div class="amount-num">₹${receipt.amountPaid || 0}</div>
      </div>

      <div class="stamp-row">
        <div class="sign-col">உறுப்பினர் கையொப்பம்<br>(Member Sign)</div>
        <div class="paid-stamp">✓ VERIFIED PAID</div>
        <div class="sign-col">நிர்வாகி கையொப்பம்<br>(Admin Sign)</div>
      </div>

      <div class="footer-note">
        இது கணினி மூலம் உருவாக்கப்பட்ட அதிகாரப்பூர்வ ரசீது • Powered by Oor Nithi Mobile App
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadPdf = async (receipt: any) => {
    if (!receipt || receipt.isPending) {
      Alert.alert('Notice', 'Receipt PDF is only available for completed or recorded contributions.');
      return;
    }

    setDownloadingPdf(true);
    try {
      const liveInfo = await fetchLatestSangamSettings();
      const html = buildReceiptHtml(receipt, liveInfo.slogan, liveInfo.name);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
            dialogTitle: `Download Receipt ${receipt.receiptNumber || ''}`
          });
        } else {
          Alert.alert('Receipt Ready', `Receipt PDF generated successfully.`);
        }
      }
    } catch (err: any) {
      console.error('Failed to generate or share PDF', err);
      Alert.alert('Error', 'Unable to generate receipt PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const payments = summary?.payments || [];
  const filteredPayments = payments.filter((item) => {
    if (selectedYear !== 'ALL' && item.year.toString() !== selectedYear) {
      return false;
    }
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const activeCycles = summary?.cycles || [];
  const selectedCycleObj = activeCycles.find((c) => c.id === selectedConfigId);

  return (
    <View style={styles.container}>
      {/* CONFIGURED CYCLE SELECTOR BANNER */}
      <View style={styles.cycleBanner}>
        <View style={styles.cycleHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.cycleTitleGroup}>
              <Text style={styles.cycleFolderIcon}>📂</Text>
              <Text style={styles.cycleName} numberOfLines={1}>
                {summary?.collectionName || 'Configured Cycle'}
              </Text>
            </View>
            <Text style={styles.cyclePeriod}>
              {summary?.startMonth && summary?.endMonth
                ? `${MONTH_NAMES[(summary.startMonth - 1) % 12]} ${summary.startYear} — ${MONTH_NAMES[(summary.endMonth - 1) % 12]} ${summary.endYear}`
                : 'Active Collection Period'}
            </Text>
          </View>
          <View style={[
            styles.cycleStatusBadge,
            summary?.cycleStatus === 'ACTIVE' ? styles.statusPaidBg : styles.cycleCompletedBg
          ]}>
            <Text style={[
              styles.cycleStatusText,
              summary?.cycleStatus === 'ACTIVE' ? styles.statusPaidText : styles.cycleCompletedText
            ]}>
              {summary?.cycleStatus || 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Cycle Switcher Pills (when Sangam has configured multiple cycles) */}
        {activeCycles.length > 1 && (
          <View style={styles.cycleSwitcherWrapper}>
            <Text style={styles.switchCycleLabel}>
              {t.collectionCycle || 'Switch Cycle'}:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cyclePillsContainer}>
              {activeCycles.map((cyc) => {
                const isSelected = cyc.id === selectedConfigId;
                return (
                  <TouchableOpacity
                    key={cyc.id}
                    onPress={() => handleSelectCycle(cyc)}
                    style={[styles.cyclePill, isSelected && styles.cyclePillSelected]}
                  >
                    <Text style={[styles.cyclePillText, isSelected && styles.cyclePillTextSelected]}>
                      {cyc.collectionName} ({cyc.status === 'ACTIVE' ? '🟢' : '⚪'})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* SUMMARY STATS CARD */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summarySub}>{t.monthlyAmount}</Text>
            <Text style={styles.summaryAmount}>₹{summary?.monthlyExpectedAmount || 0}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            summary?.currentStatus === 'UP_TO_DATE' ? styles.statusPaidBg :
            summary?.currentStatus === 'PARTIALLY_PAID' ? styles.statusPartialBg : styles.statusPendingBg
          ]}>
            <Text style={[
              styles.statusBadgeText,
              summary?.currentStatus === 'UP_TO_DATE' ? styles.statusPaidText :
              summary?.currentStatus === 'PARTIALLY_PAID' ? styles.statusPartialText : styles.statusPendingText
            ]}>
              {summary?.currentStatus === 'UP_TO_DATE' ? `✓ ${t.upToDate}` :
               summary?.currentStatus === 'PARTIALLY_PAID' ? `• ${t.partiallyPaid}` : `! ${t.pending}`}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.totalPaid}</Text>
            <Text style={[styles.metricVal, { color: '#166534' }]}>₹{summary?.totalPaid || 0}</Text>
          </View>
          <View style={styles.metricSeparator} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{t.totalOutstanding}</Text>
            <Text style={[styles.metricVal, { color: '#DC2626' }]}>₹{summary?.totalOutstanding || 0}</Text>
          </View>
        </View>
      </View>

      {/* FILTER CONTROLS */}
      <View style={styles.filterSection}>
        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {['ALL', 'PAID', 'PENDING', 'PARTIAL'].map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setSelectedStatus(st)}
              style={[styles.pill, selectedStatus === st && styles.pillActive]}
            >
              <Text style={[styles.pillText, selectedStatus === st && styles.pillTextActive]}>
                {st === 'ALL' ? t.all : st === 'PAID' ? t.paid : st === 'PENDING' ? t.pending : t.partiallyPaid}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Year Filter */}
        {availableYears.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearPills}>
            <TouchableOpacity
              onPress={() => setSelectedYear('ALL')}
              style={[styles.yearChip, selectedYear === 'ALL' && styles.yearChipActive]}
            >
              <Text style={[styles.yearChipText, selectedYear === 'ALL' && styles.yearChipTextActive]}>
                {t.all}
              </Text>
            </TouchableOpacity>
            {availableYears.map((yr) => (
              <TouchableOpacity
                key={yr}
                onPress={() => setSelectedYear(yr.toString())}
                style={[styles.yearChip, selectedYear === yr.toString() && styles.yearChipActive]}
              >
                <Text style={[styles.yearChipText, selectedYear === yr.toString() && styles.yearChipTextActive]}>
                  {yr}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* PAYMENTS LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0B3C2D" />
          <Text style={styles.loadingText}>Loading payment records...</Text>
        </View>
      ) : filteredPayments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyTitle}>{t.noTransactions}</Text>
          <Text style={styles.emptySub}>No collection records match the selected cycle and filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.memberCollectionId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => {
            const isPaid = item.status === 'PAID';
            const isPartial = item.status === 'PARTIAL';
            return (
              <TouchableOpacity
                style={styles.paymentCard}
                activeOpacity={0.75}
                onPress={() => openReceipt(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.monthBadge}>
                    <Text style={styles.monthName}>{item.monthName}</Text>
                    <Text style={styles.yearName}>{item.year}</Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text style={styles.paidAmountText}>
                      ₹{item.paidAmount} <Text style={styles.expectedText}>/ ₹{item.expectedAmount}</Text>
                    </Text>
                    <View style={[
                      styles.itemStatusPill,
                      isPaid ? styles.statusPaidBg : isPartial ? styles.statusPartialBg : styles.statusPendingBg
                    ]}>
                      <Text style={[
                        styles.itemStatusText,
                        isPaid ? styles.statusPaidText : isPartial ? styles.statusPartialText : styles.statusPendingText
                      ]}>
                        {isPaid ? `✓ ${t.paid}` : isPartial ? `• ${t.partiallyPaid}` : `! ${t.pending}`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateSub}>
                    {item.paymentDate ? `📅 ${item.paymentDate.substring(0, 10)}` : '⏳ Not paid yet'}
                  </Text>
                  <View style={styles.actionRow}>
                    <Text style={styles.receiptActionText}>
                      {isPaid || isPartial ? 'View Receipt 📄' : 'View Details ›'}
                    </Text>
                    {(isPaid || isPartial) && (
                      <TouchableOpacity
                        style={styles.quickPdfBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          openReceipt(item);
                        }}
                      >
                        <Text style={styles.quickPdfBtnText}>📥 PDF</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* RECEIPT PREVIEW & DOWNLOAD MODAL */}
      <Modal
        visible={receiptModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {loadingReceipt ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0B3C2D" />
                <Text style={{ marginTop: 12, color: '#64748B', fontWeight: 'bold' }}>Loading Receipt...</Text>
              </View>
            ) : selectedReceipt ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Official Receipt Card */}
                <View style={styles.receiptContainer}>
                  <View style={styles.receiptHeaderBlock}>
                    <Text style={styles.receiptSlogan}>
                      {(
                        selectedReceipt.sangamSlogan ||
                        selectedReceipt.slogan ||
                        sangamSettings.slogan ||
                        propSangamSlogan ||
                        '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️'
                      ).trim()}
                    </Text>
                    <Text style={styles.receiptSangam}>
                      {(
                        selectedReceipt.sangamName ||
                        sangamSettings.name ||
                        propSangamName ||
                        'Oor Nithi Sangam'
                      ).trim()}
                    </Text>
                    {(selectedReceipt.sangamAddress || sangamSettings.address) ? (
                      <Text style={styles.receiptAddress}>
                        📍 {String(selectedReceipt.sangamAddress || sangamSettings.address).trim()}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.receiptTitleTag}>
                    <Text style={styles.receiptTitleTagText}>
                      மாதாந்திர சந்தா ரசீது • COLLECTION RECEIPT
                    </Text>
                  </View>

                  <View style={styles.receiptMetaRow}>
                    <View>
                      <Text style={styles.metaLabel}>ரசீது எண் / RECEIPT NO</Text>
                      <Text style={styles.metaVal}>{selectedReceipt.receiptNumber || '—'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.metaLabel}>தேதி / DATE</Text>
                      <Text style={styles.metaVal}>
                        {selectedReceipt.paymentDate ? selectedReceipt.paymentDate.substring(0, 10) : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.receiptDetailsBox}>
                    <View style={styles.detailLine}>
                      <Text style={styles.detailKey}>உறுப்பினர் / Member:</Text>
                      <Text style={styles.detailVal}>{selectedReceipt.memberName || 'Member'}</Text>
                    </View>
                    <View style={styles.detailLine}>
                      <Text style={styles.detailKey}>உறுப்பினர் எண் / Code:</Text>
                      <Text style={styles.detailVal}>{selectedReceipt.memberCode || '—'}</Text>
                    </View>
                    <View style={styles.detailLine}>
                      <Text style={styles.detailKey}>மாதம் / Month:</Text>
                      <Text style={styles.detailVal}>{selectedReceipt.monthName} {selectedReceipt.year}</Text>
                    </View>
                    <View style={styles.detailLine}>
                      <Text style={styles.detailKey}>செலுத்தும் முறை / Mode:</Text>
                      <Text style={styles.detailVal}>{selectedReceipt.paymentMode || 'CASH'}</Text>
                    </View>
                    {selectedReceipt.referenceNumber ? (
                      <View style={styles.detailLine}>
                        <Text style={styles.detailKey}>பரிவர்த்தனை எண் / Ref:</Text>
                        <Text style={styles.detailVal}>{selectedReceipt.referenceNumber}</Text>
                      </View>
                    ) : null}
                    {selectedReceipt.collectedBy ? (
                      <View style={styles.detailLine}>
                        <Text style={styles.detailKey}>வசூலித்தவர் / Collector:</Text>
                        <Text style={styles.detailVal}>{selectedReceipt.collectedBy}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Amount Highlight */}
                  <View style={styles.amountHighlightBox}>
                    <Text style={styles.amountHighlightLabel}>AMOUNT PAID / வசூலான தொகை</Text>
                    <Text style={styles.amountHighlightVal}>₹{selectedReceipt.amountPaid || 0}</Text>
                  </View>

                  {/* Stamp */}
                  <View style={styles.stampRow}>
                    <Text style={styles.stampSignText}>உறுப்பினர் கையொப்பம்</Text>
                    <View style={styles.paidStamp}>
                      <Text style={styles.paidStampText}>
                        {selectedReceipt.isPending ? 'PENDING' : '✓ VERIFIED PAID'}
                      </Text>
                    </View>
                    <Text style={styles.stampSignText}>நிர்வாகி கையொப்பம்</Text>
                  </View>

                  <Text style={styles.receiptFooterText}>
                    இது கணினி மூலம் உருவாக்கப்பட்ட அதிகாரப்பூர்வ ரசீது • Powered by Oor Nithi
                  </Text>
                </View>

                {/* Action Buttons: Download PDF & Close */}
                <View style={styles.modalBtnRow}>
                  {!selectedReceipt.isPending && (
                    <TouchableOpacity
                      style={[styles.downloadPdfBtn, downloadingPdf && { opacity: 0.7 }]}
                      onPress={() => handleDownloadPdf(selectedReceipt)}
                      disabled={downloadingPdf}
                    >
                      {downloadingPdf ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.downloadPdfBtnText}>📥 {t.downloadPdf || 'Download PDF'}</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.closeModalBtn, selectedReceipt.isPending && { flex: 1 }]}
                    onPress={() => setReceiptModalVisible(false)}
                  >
                    <Text style={styles.closeModalBtnText}>{t.close}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 12 },

  // Cycle Banner
  cycleBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#0B3C2D',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  cycleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cycleTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  cycleFolderIcon: { fontSize: 16 },
  cycleName: { fontSize: 15, fontWeight: '800', color: '#0B3C2D' },
  cyclePeriod: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 3 },
  cycleStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14
  },
  cycleStatusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cycleCompletedBg: { backgroundColor: '#F1F5F9' },
  cycleCompletedText: { color: '#64748B' },

  cycleSwitcherWrapper: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  switchCycleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  cyclePillsContainer: {
    flexDirection: 'row',
    gap: 8
  },
  cyclePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cyclePillSelected: {
    backgroundColor: '#0B3C2D',
    borderColor: '#0B3C2D'
  },
  cyclePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  cyclePillTextSelected: {
    color: '#FFFFFF'
  },

  // Summary Card
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summarySub: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  summaryAmount: { fontSize: 24, fontWeight: '900', color: '#0B3C2D', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricSeparator: { width: 1, height: 32, backgroundColor: '#E2E8F0' },
  metricLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  metricVal: { fontSize: 18, fontWeight: '900', marginTop: 2 },

  // Filters
  filterSection: { marginBottom: 10 },
  filterPills: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  pillActive: { backgroundColor: '#0B3C2D', borderColor: '#0B3C2D' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  pillTextActive: { color: '#FFFFFF' },
  yearPills: { flexDirection: 'row', gap: 8 },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E2E8F0'
  },
  yearChipActive: { backgroundColor: '#D97706' },
  yearChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  yearChipTextActive: { color: '#FFFFFF' },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748B', fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  emptySub: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },

  // Payment Cards
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80
  },
  monthName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  yearName: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 1 },
  amountCol: { alignItems: 'flex-end' },
  paidAmountText: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  expectedText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  itemStatusPill: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  itemStatusText: { fontSize: 10, fontWeight: '800' },
  statusPaidBg: { backgroundColor: '#DCFCE7' },
  statusPaidText: { color: '#166534' },
  statusPendingBg: { backgroundColor: '#FEE2E2' },
  statusPendingText: { color: '#991B1B' },
  statusPartialBg: { backgroundColor: '#FEF3C7' },
  statusPartialText: { color: '#B45309' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
  },
  dateSub: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  receiptActionText: { fontSize: 11, fontWeight: '700', color: '#0B3C2D' },
  quickPdfBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  quickPdfBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309'
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '90%'
  },
  receiptContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 16
  },
  receiptHeaderBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    paddingHorizontal: 8
  },
  receiptSlogan: {
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D97706',
    marginBottom: 4
  },
  receiptSangam: {
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#78350F',
    marginTop: 2
  },
  receiptAddress: {
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 10,
    color: '#92400E',
    marginTop: 4
  },
  receiptTitleTag: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 5,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center'
  },
  receiptTitleTagText: { fontSize: 10, fontWeight: '900', color: '#B45309', textTransform: 'uppercase' },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10
  },
  metaLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8' },
  metaVal: { fontSize: 11, fontWeight: '800', color: '#78350F', marginTop: 2 },
  receiptDetailsBox: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10
  },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailKey: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  detailVal: { fontSize: 11, color: '#0F172A', fontWeight: '700' },
  amountHighlightBox: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  amountHighlightLabel: { fontSize: 10, fontWeight: '800', color: '#15803D', textTransform: 'uppercase' },
  amountHighlightVal: { fontSize: 24, fontWeight: '900', color: '#14532D', marginTop: 2 },
  stampRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  stampSignText: { fontSize: 9, color: '#64748B', borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 2 },
  paidStamp: {
    borderWidth: 1.5,
    borderColor: '#166534',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#DCFCE7'
  },
  paidStampText: { fontSize: 9, fontWeight: '900', color: '#166534' },
  receiptFooterText: { textAlign: 'center', fontSize: 9, color: '#94A3B8', marginTop: 8 },

  modalBtnRow: {
    flexDirection: 'row',
    gap: 10
  },
  downloadPdfBtn: {
    flex: 1,
    backgroundColor: '#0B3C2D',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  downloadPdfBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  closeModalBtn: {
    backgroundColor: '#64748B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeModalBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }
});
