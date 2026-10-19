package com.oornithi.repository;

import com.oornithi.entity.SupportRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupportRequestRepository extends JpaRepository<SupportRequest, UUID> {
    List<SupportRequest> findBySangamId(UUID sangamId);
    List<SupportRequest> findByStatus(String status);
}
