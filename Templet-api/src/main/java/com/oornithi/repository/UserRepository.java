package com.oornithi.repository;

import com.oornithi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByMobileNumber(String mobileNumber);
    Optional<User> findBySangamIdAndMobileNumber(UUID sangamId, String mobileNumber);
    List<User> findBySangamId(UUID sangamId);
    List<User> findBySangamIdAndRole(UUID sangamId, String role);
    List<User> findBySangamIdAndStatus(UUID sangamId, String status);
    long countBySangamId(UUID sangamId);
    long countBySangamIdAndRole(UUID sangamId, String role);
    boolean existsBySangamIdAndMobileNumber(UUID sangamId, String mobileNumber);
    boolean existsByMobileNumber(String mobileNumber);
    List<User> findByRole(String role);
    List<User> findByRoleAndStatus(String role, String status);
    long countByRole(String role);
    long countByRoleAndStatus(String role, String status);
}
