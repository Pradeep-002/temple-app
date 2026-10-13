package com.oornithi.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

public class AuthDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Mobile number is required")
        private String mobileNumber;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginResponse {
        private String token;
        private UUID userId;
        private String name;
        private String mobileNumber;
        private String role;
        private UUID sangamId;
        private String sangamName;
        private String slogan;
        private String memberCode;
        private String profileImageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SangamRegisterRequest {
        @NotBlank(message = "Sangam name is required")
        private String sangamName;

        private String registrationNumber;
        private LocalDate startDate;
        private String location;
        private String address;
        private String village;
        private String district;
        private String state;
        private String pincode;

        @NotBlank(message = "Sangam mobile number is required")
        private String sangamMobile;
        private String sangamEmail;

        @NotBlank(message = "Admin name is required")
        private String adminName;

        @NotBlank(message = "Admin mobile number is required")
        private String adminMobile;
        private String adminEmail;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        private String newPassword;

        @NotBlank(message = "Confirm new password is required")
        private String confirmPassword;
    }
}
