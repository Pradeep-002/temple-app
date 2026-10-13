package com.oornithi.repository;

import com.oornithi.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findBySangamId(UUID sangamId);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.sangamId = :sangamId")
    BigDecimal sumAmountBySangamId(@Param("sangamId") UUID sangamId);
}
