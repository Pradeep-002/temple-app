package com.oornithi.repository;

import com.oornithi.entity.MemberCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemberCollectionRepository extends JpaRepository<MemberCollection, UUID> {
    List<MemberCollection> findBySangamId(UUID sangamId);
    List<MemberCollection> findBySangamIdAndConfigId(UUID sangamId, UUID configId);
    List<MemberCollection> findBySangamIdAndMemberId(UUID sangamId, UUID memberId);
    List<MemberCollection> findByMemberId(UUID memberId);
    Optional<MemberCollection> findByMemberIdAndYearAndMonthName(UUID memberId, Integer year, String monthName);

    @Query("SELECT SUM(mc.paidAmount) FROM MemberCollection mc WHERE mc.sangamId = :sangamId")
    BigDecimal sumTotalPaidBySangamId(@Param("sangamId") UUID sangamId);

    @Query("SELECT SUM(mc.balanceAmount) FROM MemberCollection mc WHERE mc.sangamId = :sangamId AND mc.status IN ('PENDING', 'PARTIAL')")
    BigDecimal sumTotalPendingBySangamId(@Param("sangamId") UUID sangamId);

    @Query("SELECT SUM(mc.paidAmount) FROM MemberCollection mc WHERE mc.memberId = :memberId")
    BigDecimal sumPaidByMemberId(@Param("memberId") UUID memberId);

    @Query("SELECT SUM(mc.balanceAmount) FROM MemberCollection mc WHERE mc.memberId = :memberId AND mc.status IN ('PENDING', 'PARTIAL')")
    BigDecimal sumPendingByMemberId(@Param("memberId") UUID memberId);
}
