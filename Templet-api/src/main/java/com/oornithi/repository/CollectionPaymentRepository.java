package com.oornithi.repository;

import com.oornithi.entity.CollectionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionPaymentRepository extends JpaRepository<CollectionPayment, UUID> {
    List<CollectionPayment> findBySangamId(UUID sangamId);
    List<CollectionPayment> findByMemberCollectionId(UUID memberCollectionId);
    List<CollectionPayment> findByCollectedById(UUID collectedById);
}
