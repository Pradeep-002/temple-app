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
import java.util.List;
import java.util.UUID;

public class EventDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateEventRequest {
        @NotBlank(message = "Event name is required")
        private String eventName;

        private String tamilEventName;
        private String templeName;
        private String eventType;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;
        private LocalDate endDate;

        private String location;
        private String description;
        private BigDecimal expectedBudget;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateEventRequest {
        @NotBlank(message = "Event name is required")
        private String eventName;

        private String tamilEventName;
        private String templeName;
        private String eventType;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;
        private LocalDate endDate;

        private String location;
        private String description;
        private BigDecimal expectedBudget;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateEventExpenseRequest {
        @NotNull(message = "Event ID is required")
        private UUID eventId;

        @NotBlank(message = "Expense category is required")
        private String expenseCategory;

        private String description;

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        private BigDecimal amount;

        private LocalDate expenseDate;
        private String vendorName;
        private String paymentMode;
        private String referenceNumber;
        private String remarks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventExpenseResponse {
        private UUID id;
        private UUID eventId;
        private String expenseCategory;
        private String description;
        private BigDecimal amount;
        private LocalDate expenseDate;
        private String vendorName;
        private String paymentMode;
        private String referenceNumber;
        private String remarks;
        private String receiptUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventSummaryResponse {
        private UUID id;
        private String eventName;
        private String tamilEventName;
        private String templeName;
        private String eventType;
        private LocalDate startDate;
        private LocalDate endDate;
        private String location;
        private String description;
        private BigDecimal expectedBudget;
        private BigDecimal totalExpenses;
        private BigDecimal remainingBudget;
        private String status;
        private List<EventExpenseResponse> expenses;
    }
}
