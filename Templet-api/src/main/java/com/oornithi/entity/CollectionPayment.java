package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "collection_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectionPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id", nullable = false)
    private UUID sangamId;

    @Column(name = "member_collection_id", nullable = false)
    private UUID memberCollectionId;

    @Column(name = "receipt_number", nullable = false, unique = true)
    private String receiptNumber;

    @Column(name = "amount_paid", nullable = false)
    private BigDecimal amountPaid;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "payment_mode", nullable = false)
    private String paymentMode; // CASH, UPI, BANK_TRANSFER, OTHER

    @Column(name = "reference_number")
    private String referenceNumber;

    private String remarks;

    @Column(name = "collected_by_id")
    private UUID collectedById;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
