package com.oornithi.controller;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.ApiResponse;
import com.oornithi.entity.LedgerTransaction;
import com.oornithi.service.LedgerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ledger")
public class LedgerController {

    private final LedgerService ledgerService;

    public LedgerController(LedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN', 'COLLECTOR', 'MEMBER')")
    public ResponseEntity<ApiResponse<List<LedgerTransaction>>> getSangamLedger() {
        UUID sangamId = TenantContext.getCurrentTenant();
        List<LedgerTransaction> transactions = ledgerService.getSangamLedger(sangamId);
        return ResponseEntity.ok(ApiResponse.success("Ledger transactions retrieved", transactions));
    }

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getAvailableBalance() {
        UUID sangamId = TenantContext.getCurrentTenant();
        BigDecimal balance = ledgerService.getCurrentBalance(sangamId);
        return ResponseEntity.ok(ApiResponse.success("Available balance retrieved", balance));
    }
}
