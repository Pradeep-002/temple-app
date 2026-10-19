package com.oornithi.controller;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.FinancialDTO;
import com.oornithi.entity.Expense;
import com.oornithi.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Expense>> createExpense(Authentication auth,
                                                               @Valid @RequestBody FinancialDTO.CreateExpenseRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        String createdBy = auth.getName();
        Expense expense = expenseService.createExpense(sangamId, createdBy, request);
        return ResponseEntity.ok(ApiResponse.success("Expense recorded & ledger updated", expense));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Expense>>> getExpenses() {
        UUID sangamId = TenantContext.getCurrentTenant();
        List<Expense> expenses = expenseService.getSangamExpenses(sangamId);
        return ResponseEntity.ok(ApiResponse.success("Expenses retrieved", expenses));
    }
}
