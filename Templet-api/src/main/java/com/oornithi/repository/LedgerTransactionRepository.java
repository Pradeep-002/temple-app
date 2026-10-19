package com.oornithi.repository;

import com.oornithi.entity.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, UUID> {
    List<LedgerTransaction> findBySangamIdOrderByTransactionDateDesc(UUID sangamId);
    
    Optional<LedgerTransaction> findTopBySangamIdOrderByTransactionDateDesc(UUID sangamId);

    @Query("SELECT SUM(lt.creditAmount) FROM LedgerTransaction lt WHERE lt.sangamId = :sangamId")
    BigDecimal sumTotalCreditBySangamId(@Param("sangamId") UUID sangamId);

    @Query("SELECT SUM(lt.debitAmount) FROM LedgerTransaction lt WHERE lt.sangamId = :sangamId")
    BigDecimal sumTotalDebitBySangamId(@Param("sangamId") UUID sangamId);
}
