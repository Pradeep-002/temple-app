package com.oornithi.service;

import com.oornithi.dto.FinancialDTO;
import com.oornithi.entity.CollectionPayment;
import com.oornithi.entity.Donation;
import com.oornithi.entity.Expense;
import com.oornithi.entity.Sangam;
import com.oornithi.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final UserRepository userRepository;
    private final MemberCollectionRepository memberCollectionRepository;
    private final DonationRepository donationRepository;
    private final ExpenseRepository expenseRepository;
    private final EventExpenseRepository eventExpenseRepository;
    private final CollectionPaymentRepository paymentRepository;
    private final LedgerService ledgerService;
    private final SangamRepository sangamRepository;

    public ReportService(UserRepository userRepository,
                         MemberCollectionRepository memberCollectionRepository,
                         DonationRepository donationRepository,
                         ExpenseRepository expenseRepository,
                         EventExpenseRepository eventExpenseRepository,
                         CollectionPaymentRepository paymentRepository,
                         LedgerService ledgerService,
                         SangamRepository sangamRepository) {
        this.userRepository = userRepository;
        this.memberCollectionRepository = memberCollectionRepository;
        this.donationRepository = donationRepository;
        this.expenseRepository = expenseRepository;
        this.eventExpenseRepository = eventExpenseRepository;
        this.paymentRepository = paymentRepository;
        this.ledgerService = ledgerService;
        this.sangamRepository = sangamRepository;
    }

    public FinancialDTO.SangamDashboardResponse getSangamDashboard(UUID sangamId) {
        long totalMembers = userRepository.countBySangamIdAndRole(sangamId, "MEMBER");

        BigDecimal totalCollection = memberCollectionRepository.sumTotalPaidBySangamId(sangamId);
        if (totalCollection == null) totalCollection = BigDecimal.ZERO;

        BigDecimal totalPending = memberCollectionRepository.sumTotalPendingBySangamId(sangamId);
        if (totalPending == null) totalPending = BigDecimal.ZERO;

        BigDecimal totalDonations = donationRepository.sumAmountBySangamId(sangamId);
        if (totalDonations == null) totalDonations = BigDecimal.ZERO;

        BigDecimal totalGeneralExpenses = expenseRepository.sumAmountBySangamId(sangamId);
        if (totalGeneralExpenses == null) totalGeneralExpenses = BigDecimal.ZERO;

        BigDecimal totalEventExpenses = eventExpenseRepository.sumAmountBySangamId(sangamId);
        if (totalEventExpenses == null) totalEventExpenses = BigDecimal.ZERO;

        BigDecimal totalExpenses = totalGeneralExpenses.add(totalEventExpenses);
        BigDecimal availableBalance = ledgerService.getCurrentBalance(sangamId);
        if (availableBalance == null || (availableBalance.compareTo(BigDecimal.ZERO) == 0 && (totalCollection.compareTo(BigDecimal.ZERO) > 0 || totalDonations.compareTo(BigDecimal.ZERO) > 0))) {
            availableBalance = totalCollection.add(totalDonations).subtract(totalExpenses);
        }

        // Build Recent Activities
        List<FinancialDTO.RecentActivity> activities = new ArrayList<>();

        List<CollectionPayment> payments = paymentRepository.findBySangamId(sangamId);
        payments.stream()
                .sorted(Comparator.comparing(CollectionPayment::getPaymentDate).reversed())
                .limit(5)
                .forEach(p -> activities.add(FinancialDTO.RecentActivity.builder()
                        .type("COLLECTION")
                        .title("Collection Receipt #" + p.getReceiptNumber())
                        .amount(p.getAmountPaid())
                        .date(p.getPaymentDate())
                        .status("COMPLETED")
                        .build()));

        List<Donation> donations = donationRepository.findBySangamId(sangamId);
        donations.stream()
                .sorted(Comparator.comparing(Donation::getCreatedAt).reversed())
                .limit(5)
                .forEach(d -> activities.add(FinancialDTO.RecentActivity.builder()
                        .type("DONATION")
                        .title("Donation by " + d.getDonorName())
                        .amount(d.getAmount())
                        .date(d.getCreatedAt())
                        .status("RECEIVED")
                        .build()));

        List<Expense> expenses = expenseRepository.findBySangamId(sangamId);
        expenses.stream()
                .sorted(Comparator.comparing(Expense::getCreatedAt).reversed())
                .limit(5)
                .forEach(e -> activities.add(FinancialDTO.RecentActivity.builder()
                        .type("EXPENSE")
                        .title("Expense: " + e.getExpenseCategory())
                        .amount(e.getAmount())
                        .date(e.getCreatedAt())
                        .status("PAID")
                        .build()));

        List<FinancialDTO.RecentActivity> sortedActivities = activities.stream()
                .filter(a -> a.getDate() != null)
                .sorted(Comparator.comparing(FinancialDTO.RecentActivity::getDate).reversed())
                .limit(10)
                .collect(Collectors.toList());

        Sangam sangam = sangamRepository.findById(sangamId).orElse(null);
        String sangamName = sangam != null ? sangam.getName() : "";
        String slogan = (sangam != null && sangam.getSlogan() != null && !sangam.getSlogan().isBlank())
                ? sangam.getSlogan()
                : "🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️";

        return FinancialDTO.SangamDashboardResponse.builder()
                .sangamName(sangamName)
                .slogan(slogan)
                .totalMembers(totalMembers)
                .thisMonthCollection(totalCollection)
                .thisMonthPending(totalPending)
                .totalCollection(totalCollection)
                .totalDonations(totalDonations)
                .totalExpenses(totalExpenses)
                .totalEventExpenses(totalEventExpenses)
                .availableBalance(availableBalance)
                .recentActivities(sortedActivities)
                .build();
    }
}
