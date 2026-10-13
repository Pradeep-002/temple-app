package com.oornithi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

public class SangamDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SangamSettingsResponse {
        private UUID id;
        private String name;
        private String registrationNumber;
        private LocalDate startDate;
        private String location;
        private String address;
        private String village;
        private String district;
        private String state;
        private String pincode;
        private String mobileNumber;
        private String email;
        private String status;
        private String slogan;
        private boolean defaultPasswordConfigured;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateSangamSettingsRequest {
        @NotBlank(message = "Sangam name is required")
        private String name;

        private String registrationNumber;
        private String location;
        private String address;
        private String village;
        private String district;
        private String state;
        private String pincode;

        @NotBlank(message = "Contact mobile number is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Contact mobile number must be 10 digits")
        private String mobileNumber;

        private String email;
        private String slogan;
        private String defaultMemberPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateDefaultPasswordRequest {
        @NotBlank(message = "Default password cannot be empty")
        @Size(min = 6, message = "Default password must be at least 6 characters")
        private String defaultPassword;
    }
}
