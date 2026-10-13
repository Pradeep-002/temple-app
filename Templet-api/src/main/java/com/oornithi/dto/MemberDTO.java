package com.oornithi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

public class MemberDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateMemberRequest {
        private UUID sangamId; // Optional: provided by Super Admin or when multi-sangam is managed

        @NotBlank(message = "Member name is required")
        private String name;

        @NotBlank(message = "Mobile number is required")
        private String mobileNumber;

        private String email;
        private String gender;
        private LocalDate dob;
        private String address;
        private LocalDate joinDate;

        @NotBlank(message = "Role is required")
        private String role; // COLLECTOR, MEMBER, SANGAM_ADMIN
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateMemberRequest {
        @NotBlank(message = "Member name is required")
        private String name;

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be 10 digits")
        private String mobileNumber;

        private String email;
        private String gender;
        private LocalDate dob;
        private String address;
        private LocalDate joinDate;

        @NotBlank(message = "Role is required")
        private String role; // COLLECTOR, MEMBER, SANGAM_ADMIN

        private String status; // ACTIVE, INACTIVE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        @NotBlank(message = "Member name is required")
        private String name;

        private String address;

        private String email;

        private String profileImageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhotoUploadRequest {
        private String photoBase64;
        private String fileName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberResponse {
        private UUID id;
        private UUID sangamId;
        private String sangamName;
        private String slogan;
        private String name;
        private String mobileNumber;
        private String email;
        private String role;
        private String status;
        private String memberCode;
        private String gender;
        private LocalDate dob;
        private String address;
        private LocalDate joinDate;
        private String profileImageUrl;
    }
}
