package com.oornithi.controller;

import com.oornithi.dto.ApiResponse;
import com.oornithi.entity.SupportRequest;
import com.oornithi.service.SupportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final SupportService supportService;

    public SupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @PostMapping("/public")
    public ResponseEntity<ApiResponse<SupportRequest>> submitPublicSupport(@Valid @RequestBody SupportRequest request) {
        SupportRequest created = supportService.createPublicSupportRequest(request);
        return ResponseEntity.ok(ApiResponse.success("Support request submitted successfully", created));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<SupportRequest>>> getAllSupportRequests() {
        List<SupportRequest> requests = supportService.getAllSupportRequests();
        return ResponseEntity.ok(ApiResponse.success("Support requests retrieved", requests));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SupportRequest>> updateStatus(@PathVariable("id") UUID id, @RequestParam("status") String status) {
        SupportRequest updated = supportService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Support request status updated", updated));
    }
}
