package com.oornithi.repository;

import com.oornithi.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface DonationRepository extends JpaRepository<Donation, UUID> {
    List<Donation> findBySangamId(UUID sangamId);
    List<Donation> findBySangamIdAndEventId(UUID sangamId, UUID eventId);

    @Query("SELECT SUM(d.amount) FROM Donation d WHERE d.sangamId = :sangamId")
    BigDecimal sumAmountBySangamId(@Param("sangamId") UUID sangamId);
}
