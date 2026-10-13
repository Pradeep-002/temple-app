package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sangams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sangam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "code")
    private String code;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private String location;
    private String address;
    private String village;
    private String district;
    private String state;
    private String pincode;

    @Column(name = "mobile_number", nullable = false, unique = true)
    private String mobileNumber;

    private String email;

    @Column(name = "slogan")
    private String slogan;

    @Column(name = "default_member_password_hash")
    private String defaultMemberPasswordHash;

    @Column(nullable = false)
    private String status; // ACTIVE, PENDING, SUSPENDED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
