package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "collection_configurations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id", nullable = false)
    private UUID sangamId;

    @Column(name = "collection_name", nullable = false)
    private String collectionName;

    @Column(name = "collection_type")
    private String collectionType; // MONTHLY

    @Column(name = "monthly_amount", nullable = false)
    private BigDecimal monthlyAmount;

    @Column(name = "start_month", nullable = false)
    private Integer startMonth;

    @Column(name = "start_year", nullable = false)
    private Integer startYear;

    @Column(name = "end_month", nullable = false)
    private Integer endMonth;

    @Column(name = "end_year", nullable = false)
    private Integer endYear;

    @Column(name = "due_date")
    private Integer dueDate;

    @Column(name = "grace_period")
    private Integer gracePeriod;

    private String status; // ACTIVE, COMPLETED, INACTIVE

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
