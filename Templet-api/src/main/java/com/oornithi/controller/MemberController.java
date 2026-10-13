package com.oornithi.controller;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.MemberDTO;
import com.oornithi.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MemberDTO.MemberResponse>> createMember(@Valid @RequestBody MemberDTO.CreateMemberRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        if (sangamId == null && request.getSangamId() != null) {
            sangamId = request.getSangamId();
        }
        MemberDTO.MemberResponse response = memberService.createMember(sangamId, request);
        return ResponseEntity.ok(ApiResponse.success("Member created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'COLLECTOR', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<MemberDTO.MemberResponse>>> getSangamMembers(
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "sangamId", required = false) UUID sangamId) {
        UUID currentSangamId = TenantContext.getCurrentTenant();
        if (currentSangamId == null) {
            currentSangamId = sangamId;
        }
        List<MemberDTO.MemberResponse> members = memberService.getMembers(currentSangamId, role);
        return ResponseEntity.ok(ApiResponse.success("Members retrieved successfully", members));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MemberDTO.MemberResponse>> getMyProfile(
            org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized: Authentication required");
        }
        UUID userId = UUID.fromString(authentication.getName());
        UUID sangamId = TenantContext.getCurrentTenant();
        MemberDTO.MemberResponse response = memberService.getMemberById(sangamId, userId);
        return ResponseEntity.ok(ApiResponse.success("Member profile retrieved successfully", response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<MemberDTO.MemberResponse>> updateMyProfile(
            org.springframework.security.core.Authentication authentication,
            @Valid @RequestBody MemberDTO.UpdateProfileRequest request) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized: Authentication required");
        }
        UUID userId = UUID.fromString(authentication.getName());
        MemberDTO.MemberResponse response = memberService.updateSelfProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PostMapping("/me/photo")
    public ResponseEntity<ApiResponse<MemberDTO.MemberResponse>> uploadProfilePhoto(
            org.springframework.security.core.Authentication authentication,
            @RequestBody(required = false) MemberDTO.PhotoUploadRequest jsonRequest,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {

        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized: Authentication required");
        }
        UUID userId = UUID.fromString(authentication.getName());

        byte[] bytes;
        String fileName = "profile.jpg";

        try {
            if (file != null && !file.isEmpty()) {
                bytes = file.getBytes();
                fileName = file.getOriginalFilename();
            } else if (jsonRequest != null && jsonRequest.getPhotoBase64() != null && !jsonRequest.getPhotoBase64().isBlank()) {
                String base64 = jsonRequest.getPhotoBase64();
                if (base64.contains(",")) {
                    base64 = base64.split(",")[1];
                }
                bytes = java.util.Base64.getDecoder().decode(base64.trim());
                if (jsonRequest.getFileName() != null && !jsonRequest.getFileName().isBlank()) {
                    fileName = jsonRequest.getFileName();
                }
            } else {
                throw new RuntimeException("No photo data provided");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to process photo: " + e.getMessage());
        }

        MemberDTO.MemberResponse response = memberService.saveProfilePhoto(userId, bytes, fileName);
        return ResponseEntity.ok(ApiResponse.success("Profile photo updated successfully", response));
    }

    @GetMapping("/photo/{fileName}")
    public ResponseEntity<org.springframework.core.io.Resource> getProfilePhoto(@PathVariable("fileName") String fileName) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads", "profiles").resolve(fileName).normalize();
            if (!java.nio.file.Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            String contentType = "image/jpeg";
            String lower = fileName.toLowerCase();
            if (lower.endsWith(".png")) {
                contentType = "image/png";
            } else if (lower.endsWith(".webp")) {
                contentType = "image/webp";
            }

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
                    .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "max-age=86400")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'COLLECTOR', 'SUPER_ADMIN') or #id.toString() == authentication.name")
    public ResponseEntity<ApiResponse<MemberDTO.MemberResponse>> getMemberById(@PathVariable("id") UUID id) {
        UUID sangamId = TenantContext.getCurrentTenant();
        MemberDTO.MemberResponse response = memberService.getMemberById(sangamId, id);
        return ResponseEntity.ok(ApiResponse.success("Member details retrieved", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MemberDTO.MemberResponse>> updateMember(
            @PathVariable("id") UUID id,
            @Valid @RequestBody MemberDTO.UpdateMemberRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        MemberDTO.MemberResponse response = memberService.updateMember(sangamId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Member details updated successfully", response));
    }
}
