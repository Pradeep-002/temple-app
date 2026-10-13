package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id", nullable = false)
    private UUID sangamId;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "tamil_event_name")
    private String tamilEventName;

    @Column(name = "temple_name")
    private String templeName;

    @Column(name = "event_type")
    private String eventType; // TEMPLE_FESTIVAL, SANGAM_EVENT, ANNADHANAM, CULTURAL, RELIGIOUS, OTHER

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private String location;
    private String description;

    @Column(name = "expected_budget")
    private BigDecimal expectedBudget;

    private String status; // UPCOMING, ONGOING, COMPLETED, CANCELLED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
