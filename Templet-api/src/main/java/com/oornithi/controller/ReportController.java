package com.oornithi.controller;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.FinancialDTO;
import com.oornithi.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sangam-dashboard")
    public ResponseEntity<ApiResponse<FinancialDTO.SangamDashboardResponse>> getSangamDashboard() {
        UUID sangamId = TenantContext.getCurrentTenant();
        FinancialDTO.SangamDashboardResponse dashboard = reportService.getSangamDashboard(sangamId);
        return ResponseEntity.ok(ApiResponse.success("Sangam dashboard metrics retrieved", dashboard));
    }
}
