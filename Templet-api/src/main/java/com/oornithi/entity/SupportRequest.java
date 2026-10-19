package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "support_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id")
    private UUID sangamId;

    @Column(name = "requester_name", nullable = false)
    private String requesterName;

    @Column(name = "requester_mobile", nullable = false)
    private String requesterMobile;

    @Column(name = "requester_email")
    private String requesterEmail;

    @Column(nullable = false)
    private String category; // Technical Issue, Payment Issue, Subscription, Account, Other

    @Column(nullable = false)
    private String message;

    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
