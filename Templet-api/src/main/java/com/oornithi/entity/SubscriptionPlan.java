package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "billing_cycle_months", nullable = false)
    private Integer billingCycleMonths; // 1, 12

    @Column(name = "member_limit")
    private Integer memberLimit;

    @Column(name = "agent_limit")
    private Integer agentLimit;

    @Column(name = "event_limit")
    private Integer eventLimit;

    private String status; // ACTIVE, INACTIVE

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
