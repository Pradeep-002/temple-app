package com.oornithi.controller;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.SangamDTO;
import com.oornithi.service.SangamService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sangam")
public class SangamController {

    private final SangamService sangamService;

    public SangamController(SangamService sangamService) {
        this.sangamService = sangamService;
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('SANGAM_ADMIN')")
    public ResponseEntity<ApiResponse<SangamDTO.SangamSettingsResponse>> getSettings(Authentication authentication) {
        UUID currentUserId = (authentication != null && authentication.getName() != null)
                ? UUID.fromString(authentication.getName())
                : null;
        UUID tenantId = TenantContext.getCurrentTenant();

        SangamDTO.SangamSettingsResponse response = sangamService.getSangamSettings(currentUserId, tenantId);
        return ResponseEntity.ok(ApiResponse.success("Sangam details retrieved successfully", response));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('SANGAM_ADMIN')")
    public ResponseEntity<ApiResponse<SangamDTO.SangamSettingsResponse>> updateSettings(
            Authentication authentication,
            @Valid @RequestBody SangamDTO.UpdateSangamSettingsRequest request) {
        UUID currentUserId = (authentication != null && authentication.getName() != null)
                ? UUID.fromString(authentication.getName())
                : null;
        UUID tenantId = TenantContext.getCurrentTenant();

        SangamDTO.SangamSettingsResponse response = sangamService.updateSangamSettings(currentUserId, tenantId, request);
        return ResponseEntity.ok(ApiResponse.success("Sangam details updated successfully", response));
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<SangamDTO.SangamSettingsResponse>> getSangamInfo(Authentication authentication) {
        UUID currentUserId = (authentication != null && authentication.getName() != null)
                ? UUID.fromString(authentication.getName())
                : null;
        UUID tenantId = TenantContext.getCurrentTenant();

        SangamDTO.SangamSettingsResponse response = sangamService.getSangamSettings(currentUserId, tenantId);
        return ResponseEntity.ok(ApiResponse.success("Sangam info retrieved successfully", response));
    }

    @PutMapping("/settings/default-password")
    @PreAuthorize("hasRole('SANGAM_ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> updateDefaultPassword(
            Authentication authentication,
            @Valid @RequestBody SangamDTO.UpdateDefaultPasswordRequest request) {
        UUID currentUserId = (authentication != null && authentication.getName() != null)
                ? UUID.fromString(authentication.getName())
                : null;
        UUID tenantId = TenantContext.getCurrentTenant();

        sangamService.updateDefaultMemberPassword(currentUserId, tenantId, request.getDefaultPassword());
        return ResponseEntity.ok(ApiResponse.success("Default member password updated successfully", true));
    }
}
