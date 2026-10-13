package com.oornithi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class SuperAdminDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuperAdminDashboardMetrics {
        private long totalSangams;
        private long activeSangams;
        private long inactiveSuspendedSangams;
        private long expiredSangams;
        private long expiringSoonSangams;
        private long totalAdmins;
        private long activeAdmins;
        private long totalMembers;
        private List<SangamDetailResponse> recentSangams;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SangamDetailResponse {
        private UUID id;
        private String code;
        private String name;
        private String registrationNumber;
        private LocalDate startDate;
        private LocalDate endDate;
        private String location;
        private String address;
        private String village;
        private String district;
        private String state;
        private String pincode;
        private String mobileNumber;
        private String email;
        private String slogan;
        private String status; // ACTIVE, INACTIVE, SUSPENDED, EXPIRED
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Assigned Admin details
        private UUID adminId;
        private String adminName;
        private String adminMobile;
        private String adminEmail;
        private String adminStatus;

        private int extensionCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateSangamRequest {
        @NotBlank(message = "Sangam name is required")
        private String name;

        private String registrationNumber;
        private String code;
        private String location;
        private String address;
        private String village;
        private String district;
        private String state;
        private String pincode;

        @NotBlank(message = "Contact mobile number is required")
        private String mobileNumber;

        private String email;
        private LocalDate startDate;
        private LocalDate endDate;
        private String status; // ACTIVE, INACTIVE, etc.

        // Admin Assignment: "EXISTING" or "NEW"
        private String adminMode; // EXISTING, NEW
        private UUID existingAdminId;

        // New Admin fields (if adminMode == "NEW")
        private String adminName;
        private String adminMobile;
        private String adminEmail;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateSangamRequest {
        @NotBlank(message = "Sangam name is required")
        private String name;

        private String registrationNumber;
        private String code;
        private String location;
        private String address;
        private String village;
        private String district;
        private String state;
        private String pincode;

        @NotBlank(message = "Contact mobile number is required")
        private String mobileNumber;

        private String email;
        private String status; // ACTIVE, INACTIVE, SUSPENDED, EXPIRED
        private UUID assignedAdminId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtendSangamRequest {
        @NotNull(message = "New extended end date is required")
        private LocalDate newEndDate;

        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtensionHistoryResponse {
        private UUID id;
        private UUID sangamId;
        private LocalDate oldEndDate;
        private LocalDate newEndDate;
        private String reason;
        private String extendedBy;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminDetailResponse {
        private UUID id;
        private String name;
        private String mobileNumber;
        private String email;
        private String role;
        private String status; // ACTIVE, INACTIVE
        private String memberCode;
        private LocalDate joinDate;
        private UUID sangamId;
        private String sangamName;
        private String sangamCode;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAdminRequest {
        @NotBlank(message = "Admin name is required")
        private String name;

        @NotBlank(message = "Contact mobile number is required")
        private String mobileNumber;

        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        private UUID sangamId;
        private String status; // ACTIVE, INACTIVE
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateAdminRequest {
        @NotBlank(message = "Admin name is required")
        private String name;

        private String email;
        private UUID sangamId;
        private String status; // ACTIVE, INACTIVE
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPasswordRequest {
        @NotBlank(message = "New password is required")
        private String newPassword;
    }
}
