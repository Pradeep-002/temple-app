package com.oornithi.controller;

import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.SuperAdminDTO;
import com.oornithi.service.SuperAdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/superadmin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    // ==========================================
    // 1. DASHBOARD
    // ==========================================

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<SuperAdminDTO.SuperAdminDashboardMetrics>> getDashboard() {
        SuperAdminDTO.SuperAdminDashboardMetrics metrics = superAdminService.getSuperAdminDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.success("Super admin dashboard metrics retrieved", metrics));
    }

    // ==========================================
    // 2. SANGAM MANAGEMENT
    // ==========================================

    @GetMapping("/sangams")
    public ResponseEntity<ApiResponse<List<SuperAdminDTO.SangamDetailResponse>>> getAllSangams(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) String status) {
        List<SuperAdminDTO.SangamDetailResponse> list = superAdminService.getAllSangams(query, status);
        return ResponseEntity.ok(ApiResponse.success("Sangams list retrieved", list));
    }

    @GetMapping("/sangams/{id}")
    public ResponseEntity<ApiResponse<SuperAdminDTO.SangamDetailResponse>> getSangamById(@PathVariable("id") UUID id) {
        SuperAdminDTO.SangamDetailResponse sangam = superAdminService.getSangamById(id);
        return ResponseEntity.ok(ApiResponse.success("Sangam details retrieved", sangam));
    }

    @PostMapping("/sangams")
    public ResponseEntity<ApiResponse<SuperAdminDTO.SangamDetailResponse>> createSangam(
            Authentication authentication,
            @Valid @RequestBody SuperAdminDTO.CreateSangamRequest request) {
        String superAdminUser = authentication != null ? authentication.getName() : "Super Admin";
        SuperAdminDTO.SangamDetailResponse response = superAdminService.createSangam(request, superAdminUser);
        return ResponseEntity.ok(ApiResponse.success("Sangam created successfully", response));
    }

    @PutMapping("/sangams/{id}")
    public ResponseEntity<ApiResponse<SuperAdminDTO.SangamDetailResponse>> updateSangam(
            @PathVariable("id") UUID id,
            @Valid @RequestBody SuperAdminDTO.UpdateSangamRequest request) {
        SuperAdminDTO.SangamDetailResponse response = superAdminService.updateSangam(id, request);
        return ResponseEntity.ok(ApiResponse.success("Sangam updated successfully", response));
    }

    @PutMapping("/sangams/{id}/status")
    public ResponseEntity<ApiResponse<SuperAdminDTO.SangamDetailResponse>> updateSangamStatus(
            @PathVariable("id") UUID id,
            @RequestParam("status") String status) {
        SuperAdminDTO.SangamDetailResponse response = superAdminService.updateSangamStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Sangam status updated to " + status, response));
    }

    @PostMapping("/sangams/{id}/extend")
    public ResponseEntity<ApiResponse<SuperAdminDTO.SangamDetailResponse>> extendSangamValidity(
            Authentication authentication,
            @PathVariable("id") UUID id,
            @Valid @RequestBody SuperAdminDTO.ExtendSangamRequest request) {
        String extendedBy = authentication != null ? authentication.getName() : "Super Admin";
        SuperAdminDTO.SangamDetailResponse response = superAdminService.extendSangamValidity(id, request, extendedBy);
        return ResponseEntity.ok(ApiResponse.success("Sangam validity period extended successfully", response));
    }

    @GetMapping("/sangams/{id}/history")
    public ResponseEntity<ApiResponse<List<SuperAdminDTO.ExtensionHistoryResponse>>> getSangamExtensionHistory(
            @PathVariable("id") UUID id) {
        List<SuperAdminDTO.ExtensionHistoryResponse> history = superAdminService.getSangamExtensionHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Extension history retrieved", history));
    }

    @DeleteMapping("/sangams/{id}")
    public ResponseEntity<ApiResponse<Boolean>> deleteSangam(@PathVariable("id") UUID id) {
        superAdminService.deleteSangam(id);
        return ResponseEntity.ok(ApiResponse.success("Sangam deleted successfully", true));
    }

    // ==========================================
    // 3. SANGAM ADMIN MANAGEMENT
    // ==========================================

    @GetMapping("/admins")
    public ResponseEntity<ApiResponse<List<SuperAdminDTO.AdminDetailResponse>>> getAllAdmins(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) String status) {
        List<SuperAdminDTO.AdminDetailResponse> admins = superAdminService.getAllAdmins(query, status);
        return ResponseEntity.ok(ApiResponse.success("Sangam admins retrieved", admins));
    }

    @GetMapping("/admins/{id}")
    public ResponseEntity<ApiResponse<SuperAdminDTO.AdminDetailResponse>> getAdminById(@PathVariable("id") UUID id) {
        SuperAdminDTO.AdminDetailResponse admin = superAdminService.getAdminById(id);
        return ResponseEntity.ok(ApiResponse.success("Admin details retrieved", admin));
    }

    @PostMapping("/admins")
    public ResponseEntity<ApiResponse<SuperAdminDTO.AdminDetailResponse>> createAdmin(
            @Valid @RequestBody SuperAdminDTO.CreateAdminRequest request) {
        SuperAdminDTO.AdminDetailResponse response = superAdminService.createAdmin(request);
        return ResponseEntity.ok(ApiResponse.success("Sangam Admin created successfully", response));
    }

    @PutMapping("/admins/{id}")
    public ResponseEntity<ApiResponse<SuperAdminDTO.AdminDetailResponse>> updateAdmin(
            @PathVariable("id") UUID id,
            @Valid @RequestBody SuperAdminDTO.UpdateAdminRequest request) {
        SuperAdminDTO.AdminDetailResponse response = superAdminService.updateAdmin(id, request);
        return ResponseEntity.ok(ApiResponse.success("Admin details updated successfully", response));
    }

    @PutMapping("/admins/{id}/status")
    public ResponseEntity<ApiResponse<SuperAdminDTO.AdminDetailResponse>> updateAdminStatus(
            @PathVariable("id") UUID id,
            @RequestParam("status") String status) {
        SuperAdminDTO.AdminDetailResponse response = superAdminService.updateAdminStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Admin status updated to " + status, response));
    }

    @PutMapping("/admins/{id}/reset-password")
    public ResponseEntity<ApiResponse<Boolean>> resetAdminPassword(
            @PathVariable("id") UUID id,
            @Valid @RequestBody SuperAdminDTO.ResetPasswordRequest request) {
        superAdminService.resetAdminPassword(id, request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Admin password reset successfully", true));
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<ApiResponse<Boolean>> deleteAdmin(@PathVariable("id") UUID id) {
        superAdminService.deleteAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Admin deleted successfully", true));
    }

    @GetMapping("/available-admins")
    public ResponseEntity<ApiResponse<List<SuperAdminDTO.AdminDetailResponse>>> getAvailableAdmins() {
        List<SuperAdminDTO.AdminDetailResponse> list = superAdminService.getAvailableAdmins();
        return ResponseEntity.ok(ApiResponse.success("Available admins retrieved", list));
    }
}
