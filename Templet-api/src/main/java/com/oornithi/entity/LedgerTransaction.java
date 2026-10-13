package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ledger_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id", nullable = false)
    private UUID sangamId;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType; // MEMBER_COLLECTION, DONATION, EXPENSE, EVENT_EXPENSE

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "credit_amount")
    private BigDecimal creditAmount;

    @Column(name = "debit_amount")
    private BigDecimal debitAmount;

    @Column(name = "balance_after", nullable = false)
    private BigDecimal balanceAfter;

    private String description;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "transaction_date", updatable = false)
    private LocalDateTime transactionDate;
}
