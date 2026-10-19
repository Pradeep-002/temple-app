package com.oornithi.repository;

import com.oornithi.entity.SangamExtensionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SangamExtensionHistoryRepository extends JpaRepository<SangamExtensionHistory, UUID> {
    List<SangamExtensionHistory> findBySangamIdOrderByCreatedAtDesc(UUID sangamId);
}
