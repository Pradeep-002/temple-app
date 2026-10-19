package com.oornithi.repository;

import com.oornithi.entity.Sangam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SangamRepository extends JpaRepository<Sangam, UUID> {
    Optional<Sangam> findByMobileNumber(String mobileNumber);
    boolean existsByMobileNumber(String mobileNumber);
    boolean existsByRegistrationNumber(String registrationNumber);
    long countByStatus(String status);
}
