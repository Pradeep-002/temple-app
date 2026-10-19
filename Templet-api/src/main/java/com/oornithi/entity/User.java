package com.oornithi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sangam_id")
    private UUID sangamId;

    @Column(nullable = false)
    private String name;

    @Column(name = "mobile_number", nullable = false)
    private String mobileNumber;

    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // SUPER_ADMIN, SANGAM_ADMIN, COLLECTOR, MEMBER

    @Column(nullable = false)
    private String status; // ACTIVE, INACTIVE

    @Column(name = "member_code")
    private String memberCode; // e.g. SGM001

    private String gender;
    private LocalDate dob;
    private String address;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
