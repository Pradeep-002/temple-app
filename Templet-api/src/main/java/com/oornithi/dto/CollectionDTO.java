package com.oornithi.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CollectionDTO {

    public static class CreateCollectionConfigRequest {
        @NotBlank(message = "Collection name is required")
        private String collectionName;

        @NotNull(message = "Monthly amount is required")
        @DecimalMin(value = "0.01", message = "Monthly amount must be greater than 0")
        private BigDecimal monthlyAmount;

        @NotNull(message = "Start month is required")
        private Integer startMonth;

        @NotNull(message = "Start year is required")
        private Integer startYear;

        @NotNull(message = "End month is required")
        private Integer endMonth;

        @NotNull(message = "End year is required")
        private Integer endYear;

        private Integer dueDate;
        private Integer gracePeriod;

        public CreateCollectionConfigRequest() {}

        public CreateCollectionConfigRequest(String collectionName, BigDecimal monthlyAmount, Integer startMonth,
                                             Integer startYear, Integer endMonth, Integer endYear, Integer dueDate, Integer gracePeriod) {
            this.collectionName = collectionName;
            this.monthlyAmount = monthlyAmount;
            this.startMonth = startMonth;
            this.startYear = startYear;
            this.endMonth = endMonth;
            this.endYear = endYear;
            this.dueDate = dueDate;
            this.gracePeriod = gracePeriod;
        }

        public String getCollectionName() { return collectionName; }
        public void setCollectionName(String collectionName) { this.collectionName = collectionName; }

        public BigDecimal getMonthlyAmount() { return monthlyAmount; }
        public void setMonthlyAmount(BigDecimal monthlyAmount) { this.monthlyAmount = monthlyAmount; }

        public Integer getStartMonth() { return startMonth; }
        public void setStartMonth(Integer startMonth) { this.startMonth = startMonth; }

        public Integer getStartYear() { return startYear; }
        public void setStartYear(Integer startYear) { this.startYear = startYear; }

        public Integer getEndMonth() { return endMonth; }
        public void setEndMonth(Integer endMonth) { this.endMonth = endMonth; }

        public Integer getEndYear() { return endYear; }
        public void setEndYear(Integer endYear) { this.endYear = endYear; }

        public Integer getDueDate() { return dueDate; }
        public void setDueDate(Integer dueDate) { this.dueDate = dueDate; }

        public Integer getGracePeriod() { return gracePeriod; }
        public void setGracePeriod(Integer gracePeriod) { this.gracePeriod = gracePeriod; }
    }

    public static class RecordPaymentRequest {
        @NotNull(message = "Member collection ID is required")
        private UUID memberCollectionId;

        @NotNull(message = "Amount paid is required")
        @DecimalMin(value = "0.01", message = "Paid amount must be greater than 0")
        private BigDecimal amountPaid;

        @NotBlank(message = "Payment mode is required")
        private String paymentMode;

        private String referenceNumber;
        private String remarks;
        private String paymentDate;

        public RecordPaymentRequest() {}

        public RecordPaymentRequest(UUID memberCollectionId, BigDecimal amountPaid, String paymentMode, String referenceNumber, String remarks) {
            this.memberCollectionId = memberCollectionId;
            this.amountPaid = amountPaid;
            this.paymentMode = paymentMode;
            this.referenceNumber = referenceNumber;
            this.remarks = remarks;
        }

        public UUID getMemberCollectionId() { return memberCollectionId; }
        public void setMemberCollectionId(UUID memberCollectionId) { this.memberCollectionId = memberCollectionId; }

        public BigDecimal getAmountPaid() { return amountPaid; }
        public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

        public String getPaymentMode() { return paymentMode; }
        public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

        public String getRemarks() { return remarks; }
        public void setRemarks(String remarks) { this.remarks = remarks; }

        public String getPaymentDate() { return paymentDate; }
        public void setPaymentDate(String paymentDate) { this.paymentDate = paymentDate; }
    }

    public static class MatrixCell {
        private UUID collectionId;
        private String monthName;
        private Integer year;
        private BigDecimal expectedAmount;
        private BigDecimal paidAmount;
        private BigDecimal balanceAmount;
        private String status;

        public MatrixCell() {}

        public MatrixCell(UUID collectionId, String monthName, Integer year, BigDecimal expectedAmount,
                          BigDecimal paidAmount, BigDecimal balanceAmount, String status) {
            this.collectionId = collectionId;
            this.monthName = monthName;
            this.year = year;
            this.expectedAmount = expectedAmount;
            this.paidAmount = paidAmount;
            this.balanceAmount = balanceAmount;
            this.status = status;
        }

        public static MatrixCellBuilder builder() { return new MatrixCellBuilder(); }

        public static class MatrixCellBuilder {
            private UUID collectionId;
            private String monthName;
            private Integer year;
            private BigDecimal expectedAmount;
            private BigDecimal paidAmount;
            private BigDecimal balanceAmount;
            private String status;

            public MatrixCellBuilder collectionId(UUID collectionId) { this.collectionId = collectionId; return this; }
            public MatrixCellBuilder monthName(String monthName) { this.monthName = monthName; return this; }
            public MatrixCellBuilder year(Integer year) { this.year = year; return this; }
            public MatrixCellBuilder expectedAmount(BigDecimal expectedAmount) { this.expectedAmount = expectedAmount; return this; }
            public MatrixCellBuilder paidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; return this; }
            public MatrixCellBuilder balanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; return this; }
            public MatrixCellBuilder status(String status) { this.status = status; return this; }
            public MatrixCell build() {
                return new MatrixCell(collectionId, monthName, year, expectedAmount, paidAmount, balanceAmount, status);
            }
        }

        public UUID getCollectionId() { return collectionId; }
        public void setCollectionId(UUID collectionId) { this.collectionId = collectionId; }

        public String getMonthName() { return monthName; }
        public void setMonthName(String monthName) { this.monthName = monthName; }

        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }

        public BigDecimal getExpectedAmount() { return expectedAmount; }
        public void setExpectedAmount(BigDecimal expectedAmount) { this.expectedAmount = expectedAmount; }

        public BigDecimal getPaidAmount() { return paidAmount; }
        public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

        public BigDecimal getBalanceAmount() { return balanceAmount; }
        public void setBalanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class MemberMatrixRow {
        private UUID memberId;
        private String memberCode;
        private String memberName;
        private String mobileNumber;
        private List<MatrixCell> months = new ArrayList<>();
        private BigDecimal totalExpected;
        private BigDecimal totalPaid;
        private BigDecimal totalPending;

        public MemberMatrixRow() {}

        public MemberMatrixRow(UUID memberId, String memberCode, String memberName, String mobileNumber,
                               List<MatrixCell> months, BigDecimal totalExpected, BigDecimal totalPaid, BigDecimal totalPending) {
            this.memberId = memberId;
            this.memberCode = memberCode;
            this.memberName = memberName;
            this.mobileNumber = mobileNumber;
            this.months = months;
            this.totalExpected = totalExpected;
            this.totalPaid = totalPaid;
            this.totalPending = totalPending;
        }

        public static MemberMatrixRowBuilder builder() { return new MemberMatrixRowBuilder(); }

        public static class MemberMatrixRowBuilder {
            private UUID memberId;
            private String memberCode;
            private String memberName;
            private String mobileNumber;
            private List<MatrixCell> months;
            private BigDecimal totalExpected;
            private BigDecimal totalPaid;
            private BigDecimal totalPending;

            public MemberMatrixRowBuilder memberId(UUID memberId) { this.memberId = memberId; return this; }
            public MemberMatrixRowBuilder memberCode(String memberCode) { this.memberCode = memberCode; return this; }
            public MemberMatrixRowBuilder memberName(String memberName) { this.memberName = memberName; return this; }
            public MemberMatrixRowBuilder mobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; return this; }
            public MemberMatrixRowBuilder months(List<MatrixCell> months) { this.months = months; return this; }
            public MemberMatrixRowBuilder totalExpected(BigDecimal totalExpected) { this.totalExpected = totalExpected; return this; }
            public MemberMatrixRowBuilder totalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; return this; }
            public MemberMatrixRowBuilder totalPending(BigDecimal totalPending) { this.totalPending = totalPending; return this; }
            public MemberMatrixRow build() {
                return new MemberMatrixRow(memberId, memberCode, memberName, mobileNumber, months, totalExpected, totalPaid, totalPending);
            }
        }

        public UUID getMemberId() { return memberId; }
        public void setMemberId(UUID memberId) { this.memberId = memberId; }

        public String getMemberCode() { return memberCode; }
        public void setMemberCode(String memberCode) { this.memberCode = memberCode; }

        public String getMemberName() { return memberName; }
        public void setMemberName(String memberName) { this.memberName = memberName; }

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

        public List<MatrixCell> getMonths() { return months; }
        public void setMonths(List<MatrixCell> months) { this.months = months; }

        public BigDecimal getTotalExpected() { return totalExpected; }
        public void setTotalExpected(BigDecimal totalExpected) { this.totalExpected = totalExpected; }

        public BigDecimal getTotalPaid() { return totalPaid; }
        public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }

        public BigDecimal getTotalPending() { return totalPending; }
        public void setTotalPending(BigDecimal totalPending) { this.totalPending = totalPending; }
    }

    public static class CollectionMatrixResponse {
        private com.oornithi.entity.CollectionConfig activeConfig;
        private List<com.oornithi.entity.CollectionConfig> cycles = new ArrayList<>();
        private List<String> monthHeaders = new ArrayList<>();
        private List<MemberMatrixRow> rows = new ArrayList<>();
        private BigDecimal grandTotalPaid;
        private BigDecimal grandTotalPending;

        public CollectionMatrixResponse() {}

        public CollectionMatrixResponse(com.oornithi.entity.CollectionConfig activeConfig,
                                        List<com.oornithi.entity.CollectionConfig> cycles,
                                        List<String> monthHeaders,
                                        List<MemberMatrixRow> rows,
                                        BigDecimal grandTotalPaid,
                                        BigDecimal grandTotalPending) {
            this.activeConfig = activeConfig;
            this.cycles = cycles;
            this.monthHeaders = monthHeaders;
            this.rows = rows;
            this.grandTotalPaid = grandTotalPaid;
            this.grandTotalPending = grandTotalPending;
        }

        public static CollectionMatrixResponseBuilder builder() { return new CollectionMatrixResponseBuilder(); }

        public static class CollectionMatrixResponseBuilder {
            private com.oornithi.entity.CollectionConfig activeConfig;
            private List<com.oornithi.entity.CollectionConfig> cycles = new ArrayList<>();
            private List<String> monthHeaders = new ArrayList<>();
            private List<MemberMatrixRow> rows = new ArrayList<>();
            private BigDecimal grandTotalPaid;
            private BigDecimal grandTotalPending;

            public CollectionMatrixResponseBuilder activeConfig(com.oornithi.entity.CollectionConfig activeConfig) { this.activeConfig = activeConfig; return this; }
            public CollectionMatrixResponseBuilder cycles(List<com.oornithi.entity.CollectionConfig> cycles) { this.cycles = cycles; return this; }
            public CollectionMatrixResponseBuilder monthHeaders(List<String> monthHeaders) { this.monthHeaders = monthHeaders; return this; }
            public CollectionMatrixResponseBuilder rows(List<MemberMatrixRow> rows) { this.rows = rows; return this; }
            public CollectionMatrixResponseBuilder grandTotalPaid(BigDecimal grandTotalPaid) { this.grandTotalPaid = grandTotalPaid; return this; }
            public CollectionMatrixResponseBuilder grandTotalPending(BigDecimal grandTotalPending) { this.grandTotalPending = grandTotalPending; return this; }
            public CollectionMatrixResponse build() {
                return new CollectionMatrixResponse(activeConfig, cycles, monthHeaders, rows, grandTotalPaid, grandTotalPending);
            }
        }

        public com.oornithi.entity.CollectionConfig getActiveConfig() { return activeConfig; }
        public void setActiveConfig(com.oornithi.entity.CollectionConfig activeConfig) { this.activeConfig = activeConfig; }

        public List<com.oornithi.entity.CollectionConfig> getCycles() { return cycles; }
        public void setCycles(List<com.oornithi.entity.CollectionConfig> cycles) { this.cycles = cycles; }

        public List<String> getMonthHeaders() { return monthHeaders; }
        public void setMonthHeaders(List<String> monthHeaders) { this.monthHeaders = monthHeaders; }

        public List<MemberMatrixRow> getRows() { return rows; }
        public void setRows(List<MemberMatrixRow> rows) { this.rows = rows; }

        public BigDecimal getGrandTotalPaid() { return grandTotalPaid; }
        public void setGrandTotalPaid(BigDecimal grandTotalPaid) { this.grandTotalPaid = grandTotalPaid; }

        public BigDecimal getGrandTotalPending() { return grandTotalPending; }
        public void setGrandTotalPending(BigDecimal grandTotalPending) { this.grandTotalPending = grandTotalPending; }
    }

    public static class ReceiptResponse {
        private String receiptNumber;
        private String sangamName;
        private String sangamAddress;
        private String sangamMobile;
        private String sangamSlogan;
        private String memberName;
        private String memberCode;
        private String monthName;
        private Integer year;
        private BigDecimal amountPaid;
        private String paymentMode;
        private LocalDateTime paymentDate;
        private String collectedBy;
        private String referenceNumber;

        public ReceiptResponse() {}

        public ReceiptResponse(String receiptNumber, String sangamName, String sangamAddress, String sangamMobile,
                               String sangamSlogan, String memberName, String memberCode, String monthName, Integer year,
                               BigDecimal amountPaid, String paymentMode, LocalDateTime paymentDate,
                               String collectedBy, String referenceNumber) {
            this.receiptNumber = receiptNumber;
            this.sangamName = sangamName;
            this.sangamAddress = sangamAddress;
            this.sangamMobile = sangamMobile;
            this.sangamSlogan = sangamSlogan;
            this.memberName = memberName;
            this.memberCode = memberCode;
            this.monthName = monthName;
            this.year = year;
            this.amountPaid = amountPaid;
            this.paymentMode = paymentMode;
            this.paymentDate = paymentDate;
            this.collectedBy = collectedBy;
            this.referenceNumber = referenceNumber;
        }

        public static ReceiptResponseBuilder builder() { return new ReceiptResponseBuilder(); }

        public static class ReceiptResponseBuilder {
            private String receiptNumber;
            private String sangamName;
            private String sangamAddress;
            private String sangamMobile;
            private String sangamSlogan;
            private String memberName;
            private String memberCode;
            private String monthName;
            private Integer year;
            private BigDecimal amountPaid;
            private String paymentMode;
            private LocalDateTime paymentDate;
            private String collectedBy;
            private String referenceNumber;

            public ReceiptResponseBuilder receiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; return this; }
            public ReceiptResponseBuilder sangamName(String sangamName) { this.sangamName = sangamName; return this; }
            public ReceiptResponseBuilder sangamAddress(String sangamAddress) { this.sangamAddress = sangamAddress; return this; }
            public ReceiptResponseBuilder sangamMobile(String sangamMobile) { this.sangamMobile = sangamMobile; return this; }
            public ReceiptResponseBuilder sangamSlogan(String sangamSlogan) { this.sangamSlogan = sangamSlogan; return this; }
            public ReceiptResponseBuilder memberName(String memberName) { this.memberName = memberName; return this; }
            public ReceiptResponseBuilder memberCode(String memberCode) { this.memberCode = memberCode; return this; }
            public ReceiptResponseBuilder monthName(String monthName) { this.monthName = monthName; return this; }
            public ReceiptResponseBuilder year(Integer year) { this.year = year; return this; }
            public ReceiptResponseBuilder amountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; return this; }
            public ReceiptResponseBuilder paymentMode(String paymentMode) { this.paymentMode = paymentMode; return this; }
            public ReceiptResponseBuilder paymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; return this; }
            public ReceiptResponseBuilder collectedBy(String collectedBy) { this.collectedBy = collectedBy; return this; }
            public ReceiptResponseBuilder referenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; return this; }
            public ReceiptResponse build() {
                return new ReceiptResponse(receiptNumber, sangamName, sangamAddress, sangamMobile, sangamSlogan, memberName, memberCode, monthName, year, amountPaid, paymentMode, paymentDate, collectedBy, referenceNumber);
            }
        }

        public String getReceiptNumber() { return receiptNumber; }
        public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

        public String getSangamName() { return sangamName; }
        public void setSangamName(String sangamName) { this.sangamName = sangamName; }

        public String getSangamAddress() { return sangamAddress; }
        public void setSangamAddress(String sangamAddress) { this.sangamAddress = sangamAddress; }

        public String getSangamMobile() { return sangamMobile; }
        public void setSangamMobile(String sangamMobile) { this.sangamMobile = sangamMobile; }

        public String getSangamSlogan() { return sangamSlogan; }
        public void setSangamSlogan(String sangamSlogan) { this.sangamSlogan = sangamSlogan; }

        public String getMemberName() { return memberName; }
        public void setMemberName(String memberName) { this.memberName = memberName; }

        public String getMemberCode() { return memberCode; }
        public void setMemberCode(String memberCode) { this.memberCode = memberCode; }

        public String getMonthName() { return monthName; }
        public void setMonthName(String monthName) { this.monthName = monthName; }

        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }

        public BigDecimal getAmountPaid() { return amountPaid; }
        public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

        public String getPaymentMode() { return paymentMode; }
        public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

        public LocalDateTime getPaymentDate() { return paymentDate; }
        public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

        public String getCollectedBy() { return collectedBy; }
        public void setCollectedBy(String collectedBy) { this.collectedBy = collectedBy; }

        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CycleOption {
        private UUID id;
        private String collectionName;
        private BigDecimal monthlyAmount;
        private Integer startMonth;
        private Integer startYear;
        private Integer endMonth;
        private Integer endYear;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberPaymentSummaryResponse {
        private UUID activeConfigId;
        private String collectionName;
        private String cycleStatus;
        private Integer startMonth;
        private Integer startYear;
        private Integer endMonth;
        private Integer endYear;
        private BigDecimal monthlyExpectedAmount;
        private BigDecimal totalExpected;
        private BigDecimal totalPaid;
        private BigDecimal totalOutstanding;
        private String currentStatus; // "UP_TO_DATE", "PARTIAL", "PENDING"
        private List<CycleOption> cycles;
        private List<MemberPaymentItemResponse> payments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberPaymentItemResponse {
        private UUID memberCollectionId;
        private String monthName;
        private Integer year;
        private Integer periodOrder;
        private BigDecimal expectedAmount;
        private BigDecimal paidAmount;
        private BigDecimal balanceAmount;
        private String status; // PENDING, PARTIAL, PAID
        private LocalDateTime paymentDate;
        private String paymentMode;
        private String receiptNumber;
        private String referenceNumber;
        private String collectedBy;
    }
}
