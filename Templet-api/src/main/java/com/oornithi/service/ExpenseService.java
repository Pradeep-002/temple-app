package com.oornithi.service;

import com.oornithi.dto.FinancialDTO;
import com.oornithi.entity.Expense;
import com.oornithi.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final LedgerService ledgerService;

    public ExpenseService(ExpenseRepository expenseRepository, LedgerService ledgerService) {
        this.expenseRepository = expenseRepository;
        this.ledgerService = ledgerService;
    }

    @Transactional
    public Expense createExpense(UUID sangamId, String createdBy, FinancialDTO.CreateExpenseRequest request) {
        Expense expense = Expense.builder()
                .sangamId(sangamId)
                .eventId(request.getEventId())
                .expenseCategory(request.getExpenseCategory())
                .description(request.getDescription())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .paidTo(request.getPaidTo())
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "CASH")
                .referenceNumber(request.getReferenceNumber())
                .remarks(request.getRemarks())
                .build();

        expense = expenseRepository.save(expense);

        // Record Debit in Ledger
        String desc = "General Expense (" + request.getExpenseCategory() + ") - " + request.getDescription();
        ledgerService.recordDebit(sangamId, "EXPENSE", expense.getId(), request.getAmount(), desc, createdBy);

        return expense;
    }

    public List<Expense> getSangamExpenses(UUID sangamId) {
        return expenseRepository.findBySangamId(sangamId);
    }
}
