package com.oornithi.service;

import com.oornithi.entity.LedgerTransaction;
import com.oornithi.repository.LedgerTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LedgerService {

    private final LedgerTransactionRepository ledgerRepository;

    public LedgerService(LedgerTransactionRepository ledgerRepository) {
        this.ledgerRepository = ledgerRepository;
    }

    @Transactional
    public LedgerTransaction recordCredit(UUID sangamId, String transactionType, UUID referenceId, BigDecimal creditAmount, String description, String createdBy) {
        BigDecimal currentBalance = getCurrentBalance(sangamId);
        BigDecimal newBalance = currentBalance.add(creditAmount);

        LedgerTransaction transaction = LedgerTransaction.builder()
                .sangamId(sangamId)
                .transactionType(transactionType)
                .referenceId(referenceId)
                .creditAmount(creditAmount)
                .debitAmount(BigDecimal.ZERO)
                .balanceAfter(newBalance)
                .description(description)
                .createdBy(createdBy)
                .build();

        return ledgerRepository.save(transaction);
    }

    @Transactional
    public LedgerTransaction recordDebit(UUID sangamId, String transactionType, UUID referenceId, BigDecimal debitAmount, String description, String createdBy) {
        BigDecimal currentBalance = getCurrentBalance(sangamId);
        BigDecimal newBalance = currentBalance.subtract(debitAmount);

        LedgerTransaction transaction = LedgerTransaction.builder()
                .sangamId(sangamId)
                .transactionType(transactionType)
                .referenceId(referenceId)
                .creditAmount(BigDecimal.ZERO)
                .debitAmount(debitAmount)
                .balanceAfter(newBalance)
                .description(description)
                .createdBy(createdBy)
                .build();

        return ledgerRepository.save(transaction);
    }

    public BigDecimal getCurrentBalance(UUID sangamId) {
        Optional<LedgerTransaction> lastTxn = ledgerRepository.findTopBySangamIdOrderByTransactionDateDesc(sangamId);
        return lastTxn.map(LedgerTransaction::getBalanceAfter).orElse(BigDecimal.ZERO);
    }

    public List<LedgerTransaction> getSangamLedger(UUID sangamId) {
        return ledgerRepository.findBySangamIdOrderByTransactionDateDesc(sangamId);
    }
}
