package com.oornithi.repository;

import com.oornithi.entity.EventExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventExpenseRepository extends JpaRepository<EventExpense, UUID> {
    List<EventExpense> findBySangamId(UUID sangamId);
    List<EventExpense> findBySangamIdAndEventId(UUID sangamId, UUID eventId);

    @Query("SELECT SUM(ee.amount) FROM EventExpense ee WHERE ee.eventId = :eventId")
    BigDecimal sumAmountByEventId(@Param("eventId") UUID eventId);

    @Query("SELECT SUM(ee.amount) FROM EventExpense ee WHERE ee.sangamId = :sangamId")
    BigDecimal sumAmountBySangamId(@Param("sangamId") UUID sangamId);
}
