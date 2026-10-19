package com.oornithi.repository;

import com.oornithi.entity.CollectionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollectionConfigRepository extends JpaRepository<CollectionConfig, UUID> {
    List<CollectionConfig> findBySangamId(UUID sangamId);
    List<CollectionConfig> findBySangamIdOrderByCreatedAtDesc(UUID sangamId);
    Optional<CollectionConfig> findBySangamIdAndStatus(UUID sangamId, String status);
}
