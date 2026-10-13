package com.oornithi;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.AuthDTO;
import com.oornithi.dto.CollectionDTO;
import com.oornithi.dto.EventDTO;
import com.oornithi.dto.FinancialDTO;
import com.oornithi.dto.MemberDTO;
import com.oornithi.entity.Event;
import com.oornithi.entity.Sangam;
import com.oornithi.entity.User;
import com.oornithi.repository.SangamRepository;
import com.oornithi.repository.UserRepository;
import com.oornithi.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class MemberFeaturesTest {

    @Autowired
    private SangamRepository sangamRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberService memberService;

    @Autowired
    private AuthService authService;

    @Autowired
    private DonationService donationService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private EventService eventService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UUID sangamId;
    private User testMember;

    @BeforeEach
    void setUp() {
        Sangam sangam = sangamRepository.save(Sangam.builder()
                .name("Sri Mutharamman Sangam")
                .mobileNumber("9944001122")
                .status("ACTIVE")
                .slogan("🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️")
                .build());
        sangamId = sangam.getId();
        TenantContext.setCurrentTenant(sangamId);

        MemberDTO.CreateMemberRequest createRequest = MemberDTO.CreateMemberRequest.builder()
                .sangamId(sangamId)
                .name("Karthik Raja")
                .mobileNumber("9876543210")
                .email("karthik@example.com")
                .gender("Male")
                .address("123 Temple Street")
                .role("MEMBER")
                .build();
        MemberDTO.MemberResponse created = memberService.createMember(sangamId, createRequest);
        testMember = userRepository.findById(created.getId()).orElseThrow();
    }

    @Test
    @DisplayName("Member Financial Summary: Available Balance = Credits - Expenses without double counting")
    void testFinancialSummaryCalculation() {
        // 1. Record Donation = 5,000
        FinancialDTO.CreateDonationRequest donationReq = new FinancialDTO.CreateDonationRequest();
        donationReq.setDonorName("Annamalai");
        donationReq.setAmount(new BigDecimal("5000.00"));
        donationReq.setDonationPurpose("Kumbhabhishekam");
        donationReq.setPaymentMode("CASH");
        donationService.createDonation(sangamId, "Admin", donationReq);

        // 2. Record Expense = 1,500
        FinancialDTO.CreateExpenseRequest expenseReq = new FinancialDTO.CreateExpenseRequest();
        expenseReq.setExpenseCategory("Puja Items");
        expenseReq.setDescription("Flowers and Camphor");
        expenseReq.setAmount(new BigDecimal("1500.00"));
        expenseReq.setPaidTo("Flower Vendor");
        expenseReq.setPaymentMode("CASH");
        expenseService.createExpense(sangamId, "Admin", expenseReq);

        // 3. Create Collection Cycle: 500 per month
        CollectionDTO.CreateCollectionConfigRequest configReq = new CollectionDTO.CreateCollectionConfigRequest();
        configReq.setCollectionName("Yearly Chanda 2026");
        configReq.setMonthlyAmount(new BigDecimal("500.00"));
        configReq.setStartMonth(1);
        configReq.setStartYear(2026);
        configReq.setEndMonth(2);
        configReq.setEndYear(2026);
        collectionService.createCollectionConfig(sangamId, configReq);

        // Fetch member collection slots
        var slots = collectionService.getMemberCollections(sangamId, testMember.getId());
        assertFalse(slots.isEmpty());

        // Pay 1 slot = 500
        var slotToPay = slots.get(0);
        collectionService.recordPayment(sangamId, testMember.getId(), new CollectionDTO.RecordPaymentRequest(
                slotToPay.getId(), new BigDecimal("500.00"), "UPI", "UPI123456789", "Chanda paid"
        ));

        // Fetch dashboard
        FinancialDTO.SangamDashboardResponse dashboard = reportService.getSangamDashboard(sangamId);
        assertNotNull(dashboard);
        assertEquals("Sri Mutharamman Sangam", dashboard.getSangamName());
        assertEquals("🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️", dashboard.getSlogan());

        // Verification:
        // Total Donations = 5000
        assertEquals(0, new BigDecimal("5000.00").compareTo(dashboard.getTotalDonations()));
        // Total Cycle Collection = 500
        assertEquals(0, new BigDecimal("500.00").compareTo(dashboard.getTotalCollection()));
        // Total Expenses = 1500
        assertEquals(0, new BigDecimal("1500.00").compareTo(dashboard.getTotalExpenses()));
        // Available Balance = 5000 + 500 - 1500 = 4000
        assertEquals(0, new BigDecimal("4000.00").compareTo(dashboard.getAvailableBalance()));
    }

    @Test
    @DisplayName("Member Payment History: Correct summary, status, and isolation")
    void testMemberPaymentHistory() {
        // Create 2-month cycle
        CollectionDTO.CreateCollectionConfigRequest configReq = new CollectionDTO.CreateCollectionConfigRequest();
        configReq.setCollectionName("Cycle 2026");
        configReq.setMonthlyAmount(new BigDecimal("300.00"));
        configReq.setStartMonth(1);
        configReq.setStartYear(2026);
        configReq.setEndMonth(2);
        configReq.setEndYear(2026);
        collectionService.createCollectionConfig(sangamId, configReq);

        var slots = collectionService.getMemberCollections(sangamId, testMember.getId());
        assertEquals(2, slots.size());

        // Pay month 1
        collectionService.recordPayment(sangamId, testMember.getId(), new CollectionDTO.RecordPaymentRequest(
                slots.get(0).getId(), new BigDecimal("300.00"), "CASH", "REC-CASH-1", "Chanda paid"
        ));

        // Query payment history for this member
        CollectionDTO.MemberPaymentSummaryResponse history = collectionService.getMemberPaymentHistory(testMember.getId());
        assertNotNull(history);
        assertEquals(0, new BigDecimal("300.00").compareTo(history.getMonthlyExpectedAmount()));
        assertEquals(0, new BigDecimal("600.00").compareTo(history.getTotalExpected()));
        assertEquals(0, new BigDecimal("300.00").compareTo(history.getTotalPaid()));
        assertEquals(0, new BigDecimal("300.00").compareTo(history.getTotalOutstanding()));
        assertEquals("PARTIALLY_PAID", history.getCurrentStatus());
        assertEquals(2, history.getPayments().size());
        assertEquals("PAID", history.getPayments().get(0).getStatus());
        assertEquals("PENDING", history.getPayments().get(1).getStatus());
        assertNotNull(history.getPayments().get(0).getReceiptNumber());
    }

    @Test
    @DisplayName("Self Profile Update: Member can update Name, Email and Address; mobile/role/sangam strictly protected")
    void testMemberProfileUpdateRestrictions() {
        String originalMobile = testMember.getMobileNumber();
        String originalRole = testMember.getRole();
        UUID originalSangam = testMember.getSangamId();

        MemberDTO.UpdateProfileRequest updateReq = MemberDTO.UpdateProfileRequest.builder()
                .name("Karthik Raja Updated")
                .address("456 New North Street, Madurai")
                .email("karthik.new@oornithi.com")
                .build();

        MemberDTO.MemberResponse updated = memberService.updateSelfProfile(testMember.getId(), updateReq);
        assertEquals("Karthik Raja Updated", updated.getName());
        assertEquals("456 New North Street, Madurai", updated.getAddress());
        assertEquals("karthik.new@oornithi.com", updated.getEmail());

        // Verify restricted fields in database remain strictly intact
        User reloaded = userRepository.findById(testMember.getId()).orElseThrow();
        assertEquals("Karthik Raja Updated", reloaded.getName());
        assertEquals("456 New North Street, Madurai", reloaded.getAddress());
        assertEquals("karthik.new@oornithi.com", reloaded.getEmail());
        assertEquals(originalMobile, reloaded.getMobileNumber());
        assertEquals(originalRole, reloaded.getRole());
        assertEquals(originalSangam, reloaded.getSangamId());
    }

    @Test
    @DisplayName("Change Password: Validates existing password, prevents reuse, enforces length")
    void testChangePasswordFlow() {
        // User initial password in seeder/default
        String currentPlain = "temple123";
        testMember.setPassword(passwordEncoder.encode(currentPlain));
        userRepository.save(testMember);

        // 1. Wrong current password fails
        assertThrows(RuntimeException.class, () -> {
            authService.changePassword(testMember.getId(), new AuthDTO.ChangePasswordRequest(
                    "wrongpass", "newpass123", "newpass123"
            ));
        });

        // 2. Mismatched confirm password fails
        assertThrows(RuntimeException.class, () -> {
            authService.changePassword(testMember.getId(), new AuthDTO.ChangePasswordRequest(
                    currentPlain, "newpass123", "different123"
            ));
        });

        // 3. New password same as current password fails
        assertThrows(RuntimeException.class, () -> {
            authService.changePassword(testMember.getId(), new AuthDTO.ChangePasswordRequest(
                    currentPlain, currentPlain, currentPlain
            ));
        });

        // 4. Short password fails
        assertThrows(RuntimeException.class, () -> {
            authService.changePassword(testMember.getId(), new AuthDTO.ChangePasswordRequest(
                    currentPlain, "123", "123"
            ));
        });

        // 5. Valid password change succeeds
        authService.changePassword(testMember.getId(), new AuthDTO.ChangePasswordRequest(
                    currentPlain, "securePass2026", "securePass2026"
            ));

        User updatedUser = userRepository.findById(testMember.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("securePass2026", updatedUser.getPassword()));
        assertFalse(passwordEncoder.matches(currentPlain, updatedUser.getPassword()));
    }

    @Test
    @DisplayName("Sangam Events & Expenses: Accurately retrieves event details, description, budget, and expenses breakdown")
    void testEventsAndExpensesRetrievalForMember() {
        // 1. Create an event with budget and description
        EventDTO.CreateEventRequest createReq = new EventDTO.CreateEventRequest();
        createReq.setEventName("Panguni Uthiram Festival");
        createReq.setTamilEventName("பங்குனி உத்திர திருவிழா");
        createReq.setTempleName("Sri Mutharamman Kovil");
        createReq.setEventType("TEMPLE_FESTIVAL");
        createReq.setStartDate(LocalDate.of(2026, 3, 25));
        createReq.setEndDate(LocalDate.of(2026, 3, 27));
        createReq.setLocation("Main Temple Mandapam");
        createReq.setDescription("Annual temple festival with special pooja and Annadhanam");
        createReq.setExpectedBudget(new BigDecimal("50000.00"));

        Event createdEvent = eventService.createEvent(sangamId, createReq);
        assertNotNull(createdEvent.getId());

        // 2. Add an event expense
        EventDTO.CreateEventExpenseRequest expReq = new EventDTO.CreateEventExpenseRequest();
        expReq.setEventId(createdEvent.getId());
        expReq.setExpenseCategory("Melam");
        expReq.setDescription("Traditional Nadaswaram and Thavil");
        expReq.setAmount(new BigDecimal("12000.00"));
        expReq.setExpenseDate(LocalDate.of(2026, 3, 25));
        expReq.setVendorName("Madurai Melam Troupe");
        expReq.setPaymentMode("CASH");
        expReq.setRemarks("Full payment settled");

        eventService.addEventExpense(sangamId, "Admin", expReq);

        // 3. Query Sangam events
        var events = eventService.getSangamEvents(sangamId);
        assertFalse(events.isEmpty());

        var eventSummary = events.stream()
                .filter(e -> e.getId().equals(createdEvent.getId()))
                .findFirst()
                .orElseThrow();

        assertEquals("Panguni Uthiram Festival", eventSummary.getEventName());
        assertEquals("Annual temple festival with special pooja and Annadhanam", eventSummary.getDescription());
        assertEquals(new BigDecimal("50000.00"), eventSummary.getExpectedBudget());
        assertEquals(new BigDecimal("12000.00"), eventSummary.getTotalExpenses());
        assertEquals(new BigDecimal("38000.00"), eventSummary.getRemainingBudget());
        assertNotNull(eventSummary.getExpenses());
        assertEquals(1, eventSummary.getExpenses().size());

        var expense = eventSummary.getExpenses().get(0);
        assertEquals("Melam", expense.getExpenseCategory());
        assertEquals("Full payment settled", expense.getRemarks());
        assertEquals(new BigDecimal("12000.00"), expense.getAmount());
    }

    @Test
    @DisplayName("Profile Photo: Saves image, generates photo URL, and persists on Member profile")
    void testMemberProfilePhotoUploadAndRetrieval() {
        byte[] dummyJpg = new byte[]{ (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46 };

        MemberDTO.MemberResponse res = memberService.saveProfilePhoto(testMember.getId(), dummyJpg, "avatar.jpg");
        assertNotNull(res.getProfileImageUrl());
        assertTrue(res.getProfileImageUrl().startsWith("/api/members/photo/profile_"));

        // Verify loaded profile contains image url
        MemberDTO.MemberResponse loaded = memberService.getMemberById(sangamId, testMember.getId());
        assertEquals(res.getProfileImageUrl(), loaded.getProfileImageUrl());

        // Verify login response contains profileImageUrl
        User user = userRepository.findById(testMember.getId()).orElseThrow();
        assertEquals(res.getProfileImageUrl(), user.getProfileImageUrl());
    }
}
