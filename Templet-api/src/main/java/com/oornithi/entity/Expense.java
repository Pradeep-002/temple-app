package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id", nullable = false)
    private UUID sangamId;

    @Column(name = "event_id")
    private UUID eventId;

    @Column(name = "expense_category", nullable = false)
    private String expenseCategory; // Maintenance, Transport, Food, Office, Temple, Event, Utilities, Other

    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "expense_date")
    private LocalDate expenseDate;

    @Column(name = "paid_to")
    private String paidTo;

    @Column(name = "payment_mode")
    private String paymentMode;

    @Column(name = "reference_number")
    private String referenceNumber;

    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
