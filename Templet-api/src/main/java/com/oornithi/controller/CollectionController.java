package com.oornithi.controller;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.CollectionDTO;
import com.oornithi.entity.CollectionConfig;
import com.oornithi.entity.MemberCollection;
import com.oornithi.service.CollectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping("/config")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CollectionConfig>> createConfig(@Valid @RequestBody CollectionDTO.CreateCollectionConfigRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        CollectionConfig config = collectionService.createCollectionConfig(sangamId, request);
        return ResponseEntity.ok(ApiResponse.success("Collection configuration created & slots generated", config));
    }

    @GetMapping("/matrix")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'COLLECTOR', 'SUPER_ADMIN', 'MEMBER')")
    public ResponseEntity<ApiResponse<CollectionDTO.CollectionMatrixResponse>> getMatrix(
            Authentication authentication,
            @RequestParam(value = "configId", required = false) UUID configId) {
        UUID sangamId = TenantContext.getCurrentTenant();
        UUID currentUserId = (authentication != null && authentication.getName() != null)
                ? UUID.fromString(authentication.getName())
                : null;
        boolean isMember = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));
        CollectionDTO.CollectionMatrixResponse matrix = collectionService.getCollectionMatrix(sangamId, configId, currentUserId, isMember);
        return ResponseEntity.ok(ApiResponse.success("Collection matrix retrieved", matrix));
    }

    @GetMapping("/cycles")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'COLLECTOR', 'SUPER_ADMIN', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<CollectionConfig>>> getCycles() {
        UUID sangamId = TenantContext.getCurrentTenant();
        List<CollectionConfig> cycles = collectionService.getSangamCycles(sangamId);
        return ResponseEntity.ok(ApiResponse.success("Collection cycles retrieved", cycles));
    }

    @PutMapping("/cycles/{id}/complete")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CollectionConfig>> completeCycle(@PathVariable("id") UUID id) {
        UUID sangamId = TenantContext.getCurrentTenant();
        CollectionConfig config = collectionService.completeCycle(sangamId, id);
        return ResponseEntity.ok(ApiResponse.success("Collection cycle marked as completed", config));
    }

    @PostMapping("/payment")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'COLLECTOR', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CollectionDTO.ReceiptResponse>> recordPayment(Authentication authentication,
                                                                                    @Valid @RequestBody CollectionDTO.RecordPaymentRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        UUID collectorUserId = UUID.fromString(authentication.getName());

        CollectionDTO.ReceiptResponse receipt = collectionService.recordPayment(sangamId, collectorUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Payment recorded successfully", receipt));
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasAnyRole('MEMBER', 'COLLECTOR', 'SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CollectionDTO.MemberPaymentSummaryResponse>> getMyPayments(
            Authentication authentication,
            @RequestParam(value = "configId", required = false) UUID configId) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized: Authentication required");
        }
        UUID memberId = UUID.fromString(authentication.getName());
        CollectionDTO.MemberPaymentSummaryResponse summary = collectionService.getMemberPaymentHistory(memberId, configId);
        return ResponseEntity.ok(ApiResponse.success("Payment summary & history retrieved", summary));
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<ApiResponse<List<MemberCollection>>> getMemberCollections(
            Authentication authentication,
            @PathVariable("memberId") UUID memberId) {
        UUID sangamId = TenantContext.getCurrentTenant();
        if (authentication != null) {
            boolean isMemberOnly = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));
            if (isMemberOnly) {
                UUID callerId = UUID.fromString(authentication.getName());
                if (!callerId.equals(memberId)) {
                    throw new RuntimeException("Unauthorized: Members can only access their own collection records");
                }
            }
        }
        List<MemberCollection> collections = collectionService.getMemberCollections(sangamId, memberId);
        return ResponseEntity.ok(ApiResponse.success("Member collections retrieved", collections));
    }

    @GetMapping("/receipt/{memberCollectionId}")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'COLLECTOR', 'SUPER_ADMIN', 'MEMBER')")
    public ResponseEntity<ApiResponse<CollectionDTO.ReceiptResponse>> getReceiptByCollectionId(
            Authentication authentication,
            @PathVariable("memberCollectionId") UUID memberCollectionId) {
        UUID sangamId = TenantContext.getCurrentTenant();
        UUID callerMemberId = null;
        if (authentication != null) {
            boolean isMemberOnly = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));
            if (isMemberOnly) {
                callerMemberId = UUID.fromString(authentication.getName());
            }
        }
        CollectionDTO.ReceiptResponse receipt = collectionService.getReceiptByMemberCollectionId(sangamId, memberCollectionId, callerMemberId);
        return ResponseEntity.ok(ApiResponse.success("Receipt retrieved", receipt));
    }
}
