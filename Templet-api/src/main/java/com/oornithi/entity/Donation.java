package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id", nullable = false)
    private UUID sangamId;

    @Column(name = "event_id")
    private UUID eventId;

    @Column(name = "donor_name", nullable = false)
    private String donorName;

    @Column(name = "donor_mobile")
    private String donorMobile;

    @Column(name = "donation_purpose", nullable = false)
    private String donationPurpose;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "donation_date")
    private LocalDate donationDate;

    @Column(name = "payment_mode")
    private String paymentMode;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "receipt_number", nullable = false, unique = true)
    private String receiptNumber;

    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
