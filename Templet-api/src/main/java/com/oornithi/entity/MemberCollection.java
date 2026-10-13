package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "member_collections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id", nullable = false)
    private UUID sangamId;

    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @Column(name = "config_id")
    private UUID configId;

    @Column(name = "month_name", nullable = false)
    private String monthName; // e.g. "September"

    @Column(nullable = false)
    private Integer year; // e.g. 2026

    @Column(name = "period_order", nullable = false)
    private Integer periodOrder; // 1 to 12

    @Column(name = "expected_amount", nullable = false)
    private BigDecimal expectedAmount;

    @Column(name = "paid_amount", nullable = false)
    private BigDecimal paidAmount;

    @Column(name = "balance_amount", nullable = false)
    private BigDecimal balanceAmount;

    @Column(nullable = false)
    private String status; // PENDING, PARTIAL, PAID

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
