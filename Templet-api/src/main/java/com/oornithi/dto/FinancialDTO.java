package com.oornithi.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class FinancialDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateDonationRequest {
        private UUID eventId;

        @NotBlank(message = "Donor name is required")
        private String donorName;

        private String donorMobile;

        @NotBlank(message = "Donation purpose is required")
        private String donationPurpose;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        private BigDecimal amount;

        private LocalDate donationDate;
        private String paymentMode;
        private String referenceNumber;
        private String remarks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateExpenseRequest {
        private UUID eventId;

        @NotBlank(message = "Expense category is required")
        private String expenseCategory;

        private String description;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        private BigDecimal amount;

        private LocalDate expenseDate;
        private String paidTo;
        private String paymentMode;
        private String referenceNumber;
        private String remarks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SangamDashboardResponse {
        private String sangamName;
        private String slogan;
        private long totalMembers;
        private BigDecimal thisMonthCollection;
        private BigDecimal thisMonthPending;
        private BigDecimal totalCollection;
        private BigDecimal totalDonations;
        private BigDecimal totalExpenses;
        private BigDecimal totalEventExpenses;
        private BigDecimal availableBalance;
        private List<RecentActivity> recentActivities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private String type; // COLLECTION, DONATION, EXPENSE
        private String title;
        private BigDecimal amount;
        private LocalDateTime date;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuperAdminDashboardResponse {
        private long totalSangams;
        private long activeSangams;
        private long trialSangams;
        private long expiredSangams;
        private long totalMembers;
        private BigDecimal totalCollections;
        private BigDecimal totalDonations;
        private BigDecimal totalExpenses;
    }
}
