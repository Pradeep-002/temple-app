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
import { apiRequest } from '../../services/api.service';
import { mobileTranslations, MobileLanguage } from '../../i18n/translations';
import { hasPermission, UserRole } from '../../utils/permissions';

interface AdminEventsProps {
  lang?: MobileLanguage;
  userRole?: UserRole | string;
}

export const AdminEventsScreen: React.FC<AdminEventsProps> = ({
  lang = 'ta',
  userRole = 'SANGAM_ADMIN'
}) => {
  const t = mobileTranslations[lang];
  const canCreateEvent = hasPermission(userRole as UserRole, 'CREATE_EVENT');
  const canAddExpense = hasPermission(userRole as UserRole, 'ADD_EVENT_EXPENSE');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // Create Event Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [tamilEventName, setTamilEventName] = useState('');
  const [templeName, setTempleName] = useState('');
  const [eventType, setEventType] = useState('Festival');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [expectedBudget, setExpectedBudget] = useState('');
  const [description, setDescription] = useState('');
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // Event Details & Expense Modal
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInlineExpenseForm, setShowInlineExpenseForm] = useState(false);
  const [eventExpenses, setEventExpenses] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Add Expense to Event Modal
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseCat, setExpenseCat] = useState('Decoration / Flowers');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [expensePayMode, setExpensePayMode] = useState('UPI');
  const [expenseRef, setExpenseRef] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/events');
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data);
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
    loadEvents();
  };

  const openEventDetails = async (event: any) => {
    setShowAddExpenseModal(false);
    setShowInlineExpenseForm(false);
    setSelectedEvent(event);
    setShowDetailModal(true);
    setLoadingDetails(true);

    try {
      const res = await apiRequest(`/events/${event.id}`);
      if (res.success && res.data) {
        setSelectedEvent(res.data);
        setEventExpenses(res.data.expenses || []);
      }
    } catch (err) {
      // fallback
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert(t.error, 'Please enter event name');
      return;
    }
    if (!startDate.trim()) {
      Alert.alert(t.error, 'Please enter start date (YYYY-MM-DD)');
      return;
    }

    setSubmittingEvent(true);
    try {
      const payload: any = {
        eventName: eventName.trim(),
        tamilEventName: tamilEventName.trim() || undefined,
        templeName: templeName.trim() || undefined,
        eventType,
        startDate: startDate.trim(),
        endDate: endDate.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined
      };
      const budgetNum = parseFloat(expectedBudget);
      if (!isNaN(budgetNum) && budgetNum > 0) {
        payload.expectedBudget = budgetNum;
      }

      const res = await apiRequest('/events', 'POST', payload);
      if (res.success) {
        setShowCreateModal(false);
        Alert.alert(t.appName, t.eventSuccess);
        loadEvents();
      } else {
        Alert.alert(t.error, res.message || 'Failed to create event');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error');
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleAddEventExpense = async () => {
    if (!selectedEvent || !selectedEvent.id) return;
    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t.error, 'Please enter a valid amount');
      return;
    }

    setSubmittingExpense(true);
    try {
      const payload = {
        eventId: selectedEvent.id,
        expenseCategory: expenseCat.trim(),
        description: expenseDesc.trim() || undefined,
        amount: amountNum,
        expenseDate: new Date().toISOString().split('T')[0],
        vendorName: vendorName.trim() || undefined,
        paymentMode: expensePayMode,
        referenceNumber: expenseRef.trim() || undefined
      };

      const res = await apiRequest('/events/expense', 'POST', payload);
      if (res.success) {
        setShowAddExpenseModal(false);
        setShowInlineExpenseForm(false);
        setExpenseAmount('');
        setExpenseDesc('');
        setVendorName('');
        setExpenseRef('');
        Alert.alert(t.appName, t.expenseSuccess);

        // Optimistically update
        if (res.data) {
          setEventExpenses((prev) => [res.data, ...prev]);
          setSelectedEvent((prev: any) => {
            if (!prev) return prev;
            const updatedTotal = Number(prev.totalExpenses || 0) + amountNum;
            const budget = Number(prev.expectedBudget || 0);
            return {
              ...prev,
              totalExpenses: updatedTotal,
              remainingBudget: budget - updatedTotal
            };
          });
        }
        // reload event details & main list
        openEventDetails(selectedEvent);
        loadEvents();
      } else {
        Alert.alert(t.error, res.message || 'Failed to add expense');
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || 'Network error');
    } finally {
      setSubmittingExpense(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP BAR */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>{t.sangamEvents}</Text>
          <Text style={styles.pageSub}>{events.length} {t.events}</Text>
        </View>

        {canCreateEvent && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setShowDetailModal(false);
              setShowAddExpenseModal(false);
              setShowInlineExpenseForm(false);
              setShowCreateModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ {t.createEvent}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. EVENT LIST */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#0B3C2D']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0B3C2D" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛕</Text>
              <Text style={styles.emptyText}>{t.noUpcomingEvents}</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const budget = item.expectedBudget != null ? Number(item.expectedBudget) : 0;
          const expenses = item.totalExpenses != null ? Number(item.totalExpenses) : 0;
          const remaining = item.remainingBudget != null ? Number(item.remainingBudget) : (budget - expenses);

          return (
            <TouchableOpacity
              style={styles.eventCard}
              onPress={() => openEventDetails(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.eventName}>{item.eventName}</Text>
                  {item.tamilEventName ? (
                    <Text style={styles.tamilName}>{item.tamilEventName}</Text>
                  ) : null}
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status || 'UPCOMING'}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaItem}>📅 {item.startDate} {item.endDate ? `to ${item.endDate}` : ''}</Text>
                {item.location ? <Text style={styles.metaItem}>📍 {item.location}</Text> : null}
              </View>

              {budget > 0 && (
                <View style={styles.budgetRow}>
                  <View style={styles.budgetItem}>
                    <Text style={styles.budgetLabel}>{t.expectedBudget}</Text>
                    <Text style={styles.budgetVal}>₹{budget.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.budgetItem}>
                    <Text style={styles.budgetLabel}>{t.totalEventExpenses}</Text>
                    <Text style={[styles.budgetVal, { color: '#DC2626' }]}>₹{expenses.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.budgetItem}>
                    <Text style={styles.budgetLabel}>{t.remainingBudget}</Text>
                    <Text style={[styles.budgetVal, { color: remaining >= 0 ? '#16A34A' : '#DC2626' }]}>
                      ₹{remaining.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.cardActionsRow}>
                {canAddExpense ? (
                  <TouchableOpacity
                    style={styles.cardAddExpenseBtn}
                    onPress={() => {
                      setShowDetailModal(false);
                      setShowInlineExpenseForm(false);
                      setSelectedEvent(item);
                      setShowAddExpenseModal(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cardAddExpenseText}>+ {t.addEventExpense}</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
                <View style={styles.viewRow}>
                  <Text style={styles.viewDetailsText}>{t.viewDetails} ➔</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* 3. CREATE EVENT MODAL */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.createEvent}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Event Name (English) *</Text>
              <TextInput
                style={styles.textInput}
                value={eventName}
                onChangeText={setEventName}
                placeholder="e.g. Panguni Uthiram Festival 2026"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Event Name (Tamil)</Text>
              <TextInput
                style={styles.textInput}
                value={tamilEventName}
                onChangeText={setTamilEventName}
                placeholder="e.g. பங்குனி உத்திரத் திருவிழா 2026"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Temple / Venue Name</Text>
              <TextInput
                style={styles.textInput}
                value={templeName}
                onChangeText={setTempleName}
                placeholder="e.g. Sri Mutharamman Temple"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.rowTwo}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-04-10"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>End Date (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="2026-04-15"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Budget / எதிர்பார்த்த பட்ஜெட் (₹)</Text>
              <TextInput
                style={styles.textInput}
                value={expectedBudget}
                onChangeText={setExpectedBudget}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Location / இடம்</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Temple Grounds / Mandapam"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>{t.description}</Text>
              <TextInput
                style={[styles.textInput, { height: 50 }]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Details of rituals, timings, pooja schedule"
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submittingEvent && { opacity: 0.7 }]}
              onPress={handleCreateEvent}
              disabled={submittingEvent}
            >
              {submittingEvent ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{t.submit}</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 4. EVENT DETAILS & EXPENSES MODAL */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDetailModal(false);
          setShowInlineExpenseForm(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowDetailModal(false);
            setShowInlineExpenseForm(false);
          }}
        >
          <TouchableOpacity
            style={[styles.modalCard, { maxHeight: '90%' }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedEvent?.eventName}</Text>
                {selectedEvent?.tamilEventName ? (
                  <Text style={styles.modalSub}>{selectedEvent.tamilEventName}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => {
                setShowDetailModal(false);
                setShowInlineExpenseForm(false);
              }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Event Info Card */}
              <View style={styles.detailCard}>
                <Text style={styles.detailItem}>📅 {selectedEvent?.startDate} {selectedEvent?.endDate ? `to ${selectedEvent.endDate}` : ''}</Text>
                {selectedEvent?.location ? <Text style={styles.detailItem}>📍 {selectedEvent.location}</Text> : null}
                {selectedEvent?.description ? <Text style={styles.detailDesc}>{selectedEvent.description}</Text> : null}
              </View>

              {/* Budget Overview */}
              <View style={styles.budgetBanner}>
                <View style={styles.bannerItem}>
                  <Text style={styles.bannerLabel}>{t.expectedBudget}</Text>
                  <Text style={styles.bannerVal}>₹{Number(selectedEvent?.expectedBudget || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerItem}>
                  <Text style={styles.bannerLabel}>{t.totalEventExpenses}</Text>
                  <Text style={[styles.bannerVal, { color: '#F87171' }]}>
                    ₹{Number(selectedEvent?.totalExpenses || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerItem}>
                  <Text style={styles.bannerLabel}>{t.remainingBudget}</Text>
                  <Text style={[styles.bannerVal, { color: '#4ADE80' }]}>
                    ₹{Number(selectedEvent?.remainingBudget || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Expenses Section */}
              <View style={styles.expenseHeaderRow}>
                <Text style={styles.expenseHeading}>{t.eventExpenses} ({eventExpenses.length})</Text>
                {canAddExpense && (
                  <TouchableOpacity
                    style={[styles.addExpSmallBtn, showInlineExpenseForm && styles.addExpSmallBtnActive]}
                    onPress={() => setShowInlineExpenseForm(!showInlineExpenseForm)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addExpSmallText}>
                      {showInlineExpenseForm ? '✕ Close Form' : `+ ${t.addEventExpense}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* INLINE ADD EXPENSE FORM */}
              {showInlineExpenseForm && (
                <View style={styles.inlineExpenseBox}>
                  <View style={styles.inlineExpenseHeader}>
                    <Text style={styles.inlineExpenseTitle}>📝 {t.addEventExpense}</Text>
                    <TouchableOpacity onPress={() => setShowInlineExpenseForm(false)}>
                      <Text style={styles.inlineExpenseClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>{t.expenseCategory} *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={expenseCat}
                    onChangeText={setExpenseCat}
                    placeholder="e.g. Sound & Lighting / Flowers / Food"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputLabel}>{t.amount} (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={expenseAmount}
                    onChangeText={setExpenseAmount}
                    keyboardType="numeric"
                    placeholder="5000"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputLabel}>{t.paidTo}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={vendorName}
                    onChangeText={setVendorName}
                    placeholder="Vendor Name / Phone"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputLabel}>{t.paymentMode} *</Text>
                  <View style={styles.modeRow}>
                    {['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE'].map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.miniChip, expensePayMode === mode && styles.miniChipActive]}
                        onPress={() => setExpensePayMode(mode)}
                      >
                        <Text style={[styles.miniChipText, expensePayMode === mode && styles.miniChipTextActive]}>
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>{t.description}</Text>
                  <TextInput
                    style={[styles.textInput, { height: 48 }]}
                    value={expenseDesc}
                    onChangeText={setExpenseDesc}
                    multiline
                    placeholder="Expense details / items purchased"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={styles.inputLabel}>{t.referenceNo}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={expenseRef}
                    onChangeText={setExpenseRef}
                    placeholder="UTR / Ref No"
                    placeholderTextColor="#94A3B8"
                  />

                  <View style={styles.inlineBtnRow}>
                    <TouchableOpacity
                      style={styles.inlineCancelBtn}
                      onPress={() => setShowInlineExpenseForm(false)}
                    >
                      <Text style={styles.inlineCancelText}>{t.cancel}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.inlineSubmitBtn, submittingExpense && { opacity: 0.7 }]}
                      onPress={handleAddEventExpense}
                      disabled={submittingExpense}
                    >
                      {submittingExpense ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.inlineSubmitText}>✓ {t.submit}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {loadingDetails ? (
                <ActivityIndicator size="small" color="#0B3C2D" style={{ marginVertical: 20 }} />
              ) : eventExpenses.length === 0 ? (
                <View style={styles.emptyExpenseBox}>
                  <Text style={styles.emptyExpenseText}>{t.noExpensesForEvent}</Text>
                </View>
              ) : (
                eventExpenses.map((exp: any, idx: number) => (
                  <View key={idx} style={styles.expItemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.expCat}>{exp.expenseCategory}</Text>
                      {exp.vendorName ? <Text style={styles.expVendor}>Paid to: {exp.vendorName}</Text> : null}
                      {exp.description ? <Text style={styles.expDesc}>{exp.description}</Text> : null}
                      <Text style={styles.expDate}>{exp.expenseDate || ''} • {exp.paymentMode || 'UPI'}</Text>
                    </View>
                    <Text style={styles.expAmount}>₹{Number(exp.amount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 5. STANDALONE ADD EVENT EXPENSE MODAL */}
      <Modal visible={showAddExpenseModal} transparent animationType="slide" onRequestClose={() => setShowAddExpenseModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddExpenseModal(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t.addEventExpense}</Text>
                {selectedEvent?.eventName ? (
                  <Text style={styles.modalSub}>{selectedEvent.eventName}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setShowAddExpenseModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t.expenseCategory} *</Text>
              <TextInput
                style={styles.textInput}
                value={expenseCat}
                onChangeText={setExpenseCat}
                placeholder="e.g. Sound & Lighting / Flowers"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>{t.amount} (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                keyboardType="numeric"
                placeholder="5000"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>{t.paidTo}</Text>
              <TextInput
                style={styles.textInput}
                value={vendorName}
                onChangeText={setVendorName}
                placeholder="Vendor Name / Phone"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>{t.description}</Text>
              <TextInput
                style={[styles.textInput, { height: 50 }]}
                value={expenseDesc}
                onChangeText={setExpenseDesc}
                multiline
                placeholder="Expense details"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>{t.paymentMode} *</Text>
              <View style={styles.modeRow}>
                {['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.miniChip, expensePayMode === mode && styles.miniChipActive]}
                    onPress={() => setExpensePayMode(mode)}
                  >
                    <Text style={[styles.miniChipText, expensePayMode === mode && styles.miniChipTextActive]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t.referenceNo}</Text>
              <TextInput
                style={styles.textInput}
                value={expenseRef}
                onChangeText={setExpenseRef}
                placeholder="UTR / Ref No"
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submittingExpense && { opacity: 0.7 }]}
              onPress={handleAddEventExpense}
              disabled={submittingExpense}
            >
              {submittingExpense ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{t.submit}</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  pageSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  addBtn: {
    backgroundColor: '#0B3C2D',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12
  },
  listContent: {
    padding: 12,
    paddingBottom: 30
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  eventName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  tamilName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309'
  },
  metaRow: {
    marginTop: 8,
    gap: 4
  },
  metaItem: {
    fontSize: 11,
    color: '#64748B'
  },
  budgetRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center'
  },
  budgetLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B'
  },
  budgetVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0B3C2D',
    marginTop: 2
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3C2D'
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
  modalSub: {
    fontSize: 12,
    color: '#D97706',
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
  rowTwo: {
    flexDirection: 'row'
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
  detailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  detailItem: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 4
  },
  detailDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16
  },
  budgetBanner: {
    flexDirection: 'row',
    backgroundColor: '#0B3C2D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  bannerItem: {
    flex: 1,
    alignItems: 'center'
  },
  bannerDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  bannerLabel: {
    fontSize: 9,
    color: '#E2E8F0',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  bannerVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2
  },
  expenseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4
  },
  expenseHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  addExpSmallBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  addExpSmallText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  emptyExpenseBox: {
    padding: 16,
    alignItems: 'center'
  },
  emptyExpenseText: {
    fontSize: 11.5,
    color: '#94A3B8'
  },
  expItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  expCat: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  expVendor: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1
  },
  expDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1
  },
  expDate: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2
  },
  expAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626'
  },
  miniChip: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 4
  },
  miniChipActive: {
    backgroundColor: '#0B3C2D'
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  miniChipTextActive: {
    color: '#FFFFFF'
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  cardAddExpenseBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  cardAddExpenseText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626'
  },
  inlineExpenseBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#FECACA'
  },
  inlineExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  inlineExpenseTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0B3C2D'
  },
  inlineExpenseClose: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
    paddingHorizontal: 6
  },
  inlineBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  inlineCancelBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  inlineCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  inlineSubmitBtn: {
    flex: 2,
    backgroundColor: '#0B3C2D',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  inlineSubmitText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  addExpSmallBtnActive: {
    backgroundColor: '#64748B'
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2
  }
});
