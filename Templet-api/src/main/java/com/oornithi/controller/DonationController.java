package com.oornithi.controller;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.FinancialDTO;
import com.oornithi.entity.Donation;
import com.oornithi.service.DonationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

    private final DonationService donationService;

    public DonationController(DonationService donationService) {
        this.donationService = donationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'COLLECTOR', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Donation>> createDonation(Authentication auth,
                                                                 @Valid @RequestBody FinancialDTO.CreateDonationRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        String createdBy = auth.getName();
        Donation donation = donationService.createDonation(sangamId, createdBy, request);
        return ResponseEntity.ok(ApiResponse.success("Donation recorded & receipt generated", donation));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Donation>>> getDonations() {
        UUID sangamId = TenantContext.getCurrentTenant();
        List<Donation> donations = donationService.getSangamDonations(sangamId);
        return ResponseEntity.ok(ApiResponse.success("Donations retrieved", donations));
    }
}
