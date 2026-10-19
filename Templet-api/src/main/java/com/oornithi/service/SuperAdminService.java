package com.oornithi.service;

import com.oornithi.dto.SuperAdminDTO;
import com.oornithi.entity.Sangam;
import com.oornithi.entity.SangamExtensionHistory;
import com.oornithi.entity.Subscription;
import com.oornithi.entity.User;
import com.oornithi.repository.SangamExtensionHistoryRepository;
import com.oornithi.repository.SangamRepository;
import com.oornithi.repository.SubscriptionRepository;
import com.oornithi.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SuperAdminService {

    @PersistenceContext
    private EntityManager entityManager;

    private final SangamRepository sangamRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SangamExtensionHistoryRepository extensionHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public SuperAdminService(SangamRepository sangamRepository,
                             UserRepository userRepository,
                             SubscriptionRepository subscriptionRepository,
                             SangamExtensionHistoryRepository extensionHistoryRepository,
                             PasswordEncoder passwordEncoder) {
        this.sangamRepository = sangamRepository;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.extensionHistoryRepository = extensionHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ==========================================
    // 1. SUPER ADMIN DASHBOARD METRICS
    // ==========================================

    public SuperAdminDTO.SuperAdminDashboardMetrics getSuperAdminDashboardMetrics() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysLater = today.plusDays(30);

        List<Sangam> allSangams = sangamRepository.findAll();
        long totalSangams = allSangams.size();

        long activeSangams = 0;
        long inactiveSuspended = 0;
        long expiredSangams = 0;
        long expiringSoonSangams = 0;

        for (Sangam s : allSangams) {
            LocalDate end = s.getEndDate();
            boolean isDateExpired = (end != null && end.isBefore(today));

            if ("EXPIRED".equalsIgnoreCase(s.getStatus()) || isDateExpired) {
                expiredSangams++;
            } else if ("ACTIVE".equalsIgnoreCase(s.getStatus())) {
                activeSangams++;
                if (end != null && !end.isBefore(today) && !end.isAfter(thirtyDaysLater)) {
                    expiringSoonSangams++;
                }
            } else if ("INACTIVE".equalsIgnoreCase(s.getStatus()) || "SUSPENDED".equalsIgnoreCase(s.getStatus())) {
                inactiveSuspended++;
            }
        }

        long totalAdmins = userRepository.countByRole("SANGAM_ADMIN");
        long activeAdmins = userRepository.countByRoleAndStatus("SANGAM_ADMIN", "ACTIVE");
        long totalMembers = userRepository.count();

        // Recent 5 Sangams
        List<SuperAdminDTO.SangamDetailResponse> recentSangams = allSangams.stream()
                .sorted(Comparator.comparing(Sangam::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(this::mapToSangamDetailResponse)
                .collect(Collectors.toList());

        return SuperAdminDTO.SuperAdminDashboardMetrics.builder()
                .totalSangams(totalSangams)
                .activeSangams(activeSangams)
                .inactiveSuspendedSangams(inactiveSuspended)
                .expiredSangams(expiredSangams)
                .expiringSoonSangams(expiringSoonSangams)
                .totalAdmins(totalAdmins)
                .activeAdmins(activeAdmins)
                .totalMembers(totalMembers)
                .recentSangams(recentSangams)
                .build();
    }

    // ==========================================
    // 2. SANGAM MANAGEMENT
    // ==========================================

    public List<SuperAdminDTO.SangamDetailResponse> getAllSangams(String query, String status) {
        List<Sangam> list = sangamRepository.findAll();
        LocalDate today = LocalDate.now();

        return list.stream()
                .filter(s -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        LocalDate end = s.getEndDate();
                        boolean isDateExpired = (end != null && end.isBefore(today));
                        if ("EXPIRED".equalsIgnoreCase(status)) {
                            return "EXPIRED".equalsIgnoreCase(s.getStatus()) || isDateExpired;
                        } else if ("ACTIVE".equalsIgnoreCase(status)) {
                            return "ACTIVE".equalsIgnoreCase(s.getStatus()) && !isDateExpired;
                        } else {
                            return status.equalsIgnoreCase(s.getStatus());
                        }
                    }
                    return true;
                })
                .filter(s -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase().trim();
                        boolean nameMatch = s.getName() != null && s.getName().toLowerCase().contains(q);
                        boolean codeMatch = s.getCode() != null && s.getCode().toLowerCase().contains(q);
                        boolean regMatch = s.getRegistrationNumber() != null && s.getRegistrationNumber().toLowerCase().contains(q);
                        boolean mobileMatch = s.getMobileNumber() != null && s.getMobileNumber().contains(q);
                        boolean locMatch = (s.getDistrict() != null && s.getDistrict().toLowerCase().contains(q)) ||
                                (s.getVillage() != null && s.getVillage().toLowerCase().contains(q)) ||
                                (s.getLocation() != null && s.getLocation().toLowerCase().contains(q));
                        return nameMatch || codeMatch || regMatch || mobileMatch || locMatch;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Sangam::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToSangamDetailResponse)
                .collect(Collectors.toList());
    }

    public SuperAdminDTO.SangamDetailResponse getSangamById(UUID id) {
        Sangam sangam = sangamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + id));
        return mapToSangamDetailResponse(sangam);
    }

    @Transactional
    public SuperAdminDTO.SangamDetailResponse createSangam(SuperAdminDTO.CreateSangamRequest request, String superAdminUsername) {
        String mobile = request.getMobileNumber() != null ? request.getMobileNumber().trim() : "";
        if (mobile.isBlank()) {
            throw new RuntimeException("Contact mobile number is required");
        }
        if (sangamRepository.existsByMobileNumber(mobile)) {
            throw new RuntimeException("A Sangam with mobile number " + mobile + " is already registered.");
        }

        if (request.getRegistrationNumber() != null && !request.getRegistrationNumber().isBlank()) {
            if (sangamRepository.existsByRegistrationNumber(request.getRegistrationNumber().trim())) {
                throw new RuntimeException("A Sangam with registration number " + request.getRegistrationNumber() + " already exists.");
            }
        }

        // Generate Code if missing
        String code = request.getCode();
        if (code == null || code.isBlank()) {
            long count = sangamRepository.count() + 1;
            code = String.format("SGM-%03d", count);
        }

        LocalDate start = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate end = request.getEndDate() != null ? request.getEndDate() : start.plusYears(1);

        String status = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus().toUpperCase()
                : "ACTIVE";

        Sangam sangam = Sangam.builder()
                .name(request.getName().trim())
                .registrationNumber(request.getRegistrationNumber() != null ? request.getRegistrationNumber().trim() : null)
                .code(code)
                .startDate(start)
                .endDate(end)
                .location(request.getLocation())
                .address(request.getAddress())
                .village(request.getVillage())
                .district(request.getDistrict())
                .state(request.getState() != null ? request.getState() : "Tamil Nadu")
                .pincode(request.getPincode())
                .mobileNumber(mobile)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .status(status)
                .slogan("🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️")
                .build();

        sangam = sangamRepository.save(sangam);

        // Handle Admin Assignment
        User assignedAdmin = null;
        if ("EXISTING".equalsIgnoreCase(request.getAdminMode()) && request.getExistingAdminId() != null) {
            assignedAdmin = userRepository.findById(request.getExistingAdminId())
                    .orElseThrow(() -> new RuntimeException("Selected Admin user not found"));
            assignedAdmin.setSangamId(sangam.getId());
            assignedAdmin = userRepository.save(assignedAdmin);
        } else if ("NEW".equalsIgnoreCase(request.getAdminMode()) ||
                (request.getAdminMobile() != null && !request.getAdminMobile().isBlank())) {
            String adminMob = request.getAdminMobile().trim();
            if (userRepository.findByMobileNumber(adminMob).isPresent()) {
                throw new RuntimeException("Admin with mobile number " + adminMob + " already exists in the system.");
            }
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                throw new RuntimeException("Password is required to create a new Sangam Admin");
            }

            assignedAdmin = User.builder()
                    .sangamId(sangam.getId())
                    .name(request.getAdminName() != null ? request.getAdminName().trim() : request.getName() + " Admin")
                    .mobileNumber(adminMob)
                    .email(request.getAdminEmail() != null ? request.getAdminEmail().trim() : null)
                    .password(passwordEncoder.encode(request.getPassword().trim()))
                    .role("SANGAM_ADMIN")
                    .status("ACTIVE")
                    .memberCode("ADM001")
                    .joinDate(LocalDate.now())
                    .build();

            assignedAdmin = userRepository.save(assignedAdmin);
        }

        // Synchronize Subscription
        Subscription sub = Subscription.builder()
                .sangamId(sangam.getId())
                .startDate(start)
                .endDate(end)
                .status("ACTIVE".equalsIgnoreCase(status) ? "ACTIVE" : status)
                .isTrial(false)
                .paymentStatus("PAID")
                .build();
        subscriptionRepository.save(sub);

        return mapToSangamDetailResponse(sangam, assignedAdmin);
    }

    @Transactional
    public SuperAdminDTO.SangamDetailResponse updateSangam(UUID id, SuperAdminDTO.UpdateSangamRequest request) {
        Sangam sangam = sangamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + id));

        String newMobile = request.getMobileNumber() != null ? request.getMobileNumber().trim() : "";
        if (!newMobile.equalsIgnoreCase(sangam.getMobileNumber())) {
            if (sangamRepository.existsByMobileNumber(newMobile)) {
                throw new RuntimeException("Mobile number " + newMobile + " is already used by another Sangam.");
            }
            sangam.setMobileNumber(newMobile);
        }

        if (request.getRegistrationNumber() != null && !request.getRegistrationNumber().equalsIgnoreCase(sangam.getRegistrationNumber())) {
            if (sangamRepository.existsByRegistrationNumber(request.getRegistrationNumber().trim())) {
                throw new RuntimeException("Registration number " + request.getRegistrationNumber() + " is already registered.");
            }
            sangam.setRegistrationNumber(request.getRegistrationNumber().trim());
        }

        sangam.setName(request.getName().trim());
        if (request.getCode() != null && !request.getCode().isBlank()) {
            sangam.setCode(request.getCode().trim());
        }
        sangam.setLocation(request.getLocation());
        sangam.setAddress(request.getAddress());
        sangam.setVillage(request.getVillage());
        sangam.setDistrict(request.getDistrict());
        sangam.setState(request.getState());
        sangam.setPincode(request.getPincode());
        sangam.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            sangam.setStatus(request.getStatus().toUpperCase());
        }

        // Reassign Admin if requested
        if (request.getAssignedAdminId() != null) {
            User newAdmin = userRepository.findById(request.getAssignedAdminId())
                    .orElseThrow(() -> new RuntimeException("Assigned Admin not found"));
            newAdmin.setSangamId(sangam.getId());
            userRepository.save(newAdmin);
        }

        sangam = sangamRepository.save(sangam);
        return mapToSangamDetailResponse(sangam);
    }

    @Transactional
    public SuperAdminDTO.SangamDetailResponse updateSangamStatus(UUID id, String status) {
        Sangam sangam = sangamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + id));

        String validStatus = status.toUpperCase().trim();
        List<String> allowed = List.of("ACTIVE", "INACTIVE", "SUSPENDED", "EXPIRED");
        if (!allowed.contains(validStatus)) {
            throw new RuntimeException("Invalid status: " + status + ". Allowed: " + allowed);
        }

        sangam.setStatus(validStatus);
        sangam = sangamRepository.save(sangam);

        // Also update subscription status if exists
        subscriptionRepository.findBySangamId(sangam.getId()).ifPresent(sub -> {
            sub.setStatus(validStatus);
            subscriptionRepository.save(sub);
        });

        return mapToSangamDetailResponse(sangam);
    }

    @Transactional
    public SuperAdminDTO.SangamDetailResponse extendSangamValidity(UUID id, SuperAdminDTO.ExtendSangamRequest request, String extendedBy) {
        Sangam sangam = sangamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + id));

        LocalDate oldEndDate = sangam.getEndDate() != null ? sangam.getEndDate() :
                (sangam.getStartDate() != null ? sangam.getStartDate() : LocalDate.now());

        if (request.getNewEndDate() == null) {
            throw new RuntimeException("New extended end date is required");
        }

        if (!request.getNewEndDate().isAfter(oldEndDate)) {
            throw new RuntimeException("New end date (" + request.getNewEndDate() + ") must be later than the current end date (" + oldEndDate + ")");
        }

        // Record Extension History
        SangamExtensionHistory history = SangamExtensionHistory.builder()
                .sangamId(sangam.getId())
                .oldEndDate(oldEndDate)
                .newEndDate(request.getNewEndDate())
                .reason(request.getReason() != null ? request.getReason().trim() : "Super Admin Validity Extension")
                .extendedBy(extendedBy != null ? extendedBy : "Super Admin")
                .build();
        extensionHistoryRepository.save(history);

        // Update Sangam End Date & reactivate if expired
        sangam.setEndDate(request.getNewEndDate());
        if ("EXPIRED".equalsIgnoreCase(sangam.getStatus())) {
            sangam.setStatus("ACTIVE");
        }
        sangam = sangamRepository.save(sangam);

        // Synchronize Subscription
        subscriptionRepository.findBySangamId(sangam.getId()).ifPresent(sub -> {
            sub.setEndDate(request.getNewEndDate());
            if ("EXPIRED".equalsIgnoreCase(sub.getStatus())) {
                sub.setStatus("ACTIVE");
            }
            subscriptionRepository.save(sub);
        });

        return mapToSangamDetailResponse(sangam);
    }

    public List<SuperAdminDTO.ExtensionHistoryResponse> getSangamExtensionHistory(UUID sangamId) {
        return extensionHistoryRepository.findBySangamIdOrderByCreatedAtDesc(sangamId).stream()
                .map(h -> SuperAdminDTO.ExtensionHistoryResponse.builder()
                        .id(h.getId())
                        .sangamId(h.getSangamId())
                        .oldEndDate(h.getOldEndDate())
                        .newEndDate(h.getNewEndDate())
                        .reason(h.getReason())
                        .extendedBy(h.getExtendedBy())
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSangam(UUID id) {
        Sangam sangam = sangamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + id));

        // Clean up child tables in proper foreign key order
        entityManager.createNativeQuery("DELETE FROM collection_payments WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM member_collections WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM collection_configurations WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM ledger_transactions WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM donations WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM event_expenses WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM events WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM expenses WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM sangam_extension_histories WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM subscriptions WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM users WHERE sangam_id = :id").setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM sangams WHERE id = :id").setParameter("id", id).executeUpdate();
    }

    @Transactional
    public void deleteAdmin(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found with ID: " + id));
        if ("SUPER_ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Cannot delete Super Admin account");
        }
        userRepository.delete(user);
    }

    // ==========================================
    // 3. SANGAM ADMIN MANAGEMENT
    // ==========================================

    public List<SuperAdminDTO.AdminDetailResponse> getAllAdmins(String query, String status) {
        List<User> admins = userRepository.findByRole("SANGAM_ADMIN");
        Map<UUID, Sangam> sangamMap = sangamRepository.findAll().stream()
                .collect(Collectors.toMap(Sangam::getId, s -> s));

        return admins.stream()
                .filter(a -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                        return status.equalsIgnoreCase(a.getStatus());
                    }
                    return true;
                })
                .filter(a -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase().trim();
                        boolean nameMatch = a.getName() != null && a.getName().toLowerCase().contains(q);
                        boolean mobileMatch = a.getMobileNumber() != null && a.getMobileNumber().contains(q);
                        boolean emailMatch = a.getEmail() != null && a.getEmail().toLowerCase().contains(q);
                        boolean sangamMatch = false;
                        if (a.getSangamId() != null && sangamMap.containsKey(a.getSangamId())) {
                            sangamMatch = sangamMap.get(a.getSangamId()).getName().toLowerCase().contains(q);
                        }
                        return nameMatch || mobileMatch || emailMatch || sangamMatch;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(a -> mapToAdminDetailResponse(a, sangamMap.get(a.getSangamId())))
                .collect(Collectors.toList());
    }

    public SuperAdminDTO.AdminDetailResponse getAdminById(UUID id) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found with ID: " + id));
        Sangam sangam = admin.getSangamId() != null ? sangamRepository.findById(admin.getSangamId()).orElse(null) : null;
        return mapToAdminDetailResponse(admin, sangam);
    }

    @Transactional
    public SuperAdminDTO.AdminDetailResponse createAdmin(SuperAdminDTO.CreateAdminRequest request) {
        String mobile = request.getMobileNumber() != null ? request.getMobileNumber().trim() : "";
        if (mobile.isBlank()) {
            throw new RuntimeException("Mobile number is required");
        }
        if (userRepository.findByMobileNumber(mobile).isPresent()) {
            throw new RuntimeException("A user with mobile number " + mobile + " already exists.");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new RuntimeException("Password is required to create an admin account");
        }

        Sangam sangam = null;
        if (request.getSangamId() != null) {
            sangam = sangamRepository.findById(request.getSangamId())
                    .orElseThrow(() -> new RuntimeException("Specified Sangam does not exist"));
        }

        String status = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus().toUpperCase()
                : "ACTIVE";

        long adminCount = userRepository.countByRole("SANGAM_ADMIN") + 1;
        String memberCode = String.format("ADM%03d", adminCount);

        User admin = User.builder()
                .sangamId(request.getSangamId())
                .name(request.getName().trim())
                .mobileNumber(mobile)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .password(passwordEncoder.encode(request.getPassword().trim()))
                .role("SANGAM_ADMIN")
                .status(status)
                .memberCode(memberCode)
                .joinDate(LocalDate.now())
                .build();

        admin = userRepository.save(admin);
        return mapToAdminDetailResponse(admin, sangam);
    }

    @Transactional
    public SuperAdminDTO.AdminDetailResponse updateAdmin(UUID id, SuperAdminDTO.UpdateAdminRequest request) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin user not found with ID: " + id));

        admin.setName(request.getName().trim());
        admin.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            admin.setStatus(request.getStatus().toUpperCase());
        }

        if (request.getSangamId() != null) {
            Sangam sangam = sangamRepository.findById(request.getSangamId())
                    .orElseThrow(() -> new RuntimeException("Specified Sangam does not exist"));
            admin.setSangamId(sangam.getId());
        }

        admin = userRepository.save(admin);
        Sangam sangam = admin.getSangamId() != null ? sangamRepository.findById(admin.getSangamId()).orElse(null) : null;
        return mapToAdminDetailResponse(admin, sangam);
    }

    @Transactional
    public SuperAdminDTO.AdminDetailResponse updateAdminStatus(UUID id, String status) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin user not found with ID: " + id));

        String validStatus = status.toUpperCase().trim();
        if (!"ACTIVE".equals(validStatus) && !"INACTIVE".equals(validStatus)) {
            throw new RuntimeException("Invalid status: " + status + ". Allowed: ACTIVE, INACTIVE");
        }

        admin.setStatus(validStatus);
        admin = userRepository.save(admin);

        Sangam sangam = admin.getSangamId() != null ? sangamRepository.findById(admin.getSangamId()).orElse(null) : null;
        return mapToAdminDetailResponse(admin, sangam);
    }

    @Transactional
    public void resetAdminPassword(UUID id, String newPassword) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin user not found with ID: " + id));

        if (newPassword == null || newPassword.isBlank()) {
            throw new RuntimeException("New password cannot be empty");
        }

        admin.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(admin);
    }

    public List<SuperAdminDTO.AdminDetailResponse> getAvailableAdmins() {
        return userRepository.findByRole("SANGAM_ADMIN").stream()
                .map(a -> {
                    Sangam s = a.getSangamId() != null ? sangamRepository.findById(a.getSangamId()).orElse(null) : null;
                    return mapToAdminDetailResponse(a, s);
                })
                .collect(Collectors.toList());
    }

    // ==========================================
    // HELPER MAPPERS
    // ==========================================

    private SuperAdminDTO.SangamDetailResponse mapToSangamDetailResponse(Sangam sangam) {
        User assignedAdmin = null;
        if (sangam.getId() != null) {
            List<User> admins = userRepository.findBySangamIdAndRole(sangam.getId(), "SANGAM_ADMIN");
            if (!admins.isEmpty()) {
                assignedAdmin = admins.get(0);
            }
        }
        return mapToSangamDetailResponse(sangam, assignedAdmin);
    }

    private SuperAdminDTO.SangamDetailResponse mapToSangamDetailResponse(Sangam sangam, User assignedAdmin) {
        int extensionCount = 0;
        if (sangam.getId() != null) {
            extensionCount = extensionHistoryRepository.findBySangamIdOrderByCreatedAtDesc(sangam.getId()).size();
        }

        LocalDate today = LocalDate.now();
        String currentStatus = sangam.getStatus();
        if (sangam.getEndDate() != null && sangam.getEndDate().isBefore(today)) {
            currentStatus = "EXPIRED";
        }

        return SuperAdminDTO.SangamDetailResponse.builder()
                .id(sangam.getId())
                .code(sangam.getCode() != null ? sangam.getCode() : "SGM-" + (sangam.getId() != null ? sangam.getId().toString().substring(0, 4).toUpperCase() : "001"))
                .name(sangam.getName())
                .registrationNumber(sangam.getRegistrationNumber())
                .startDate(sangam.getStartDate())
                .endDate(sangam.getEndDate())
                .location(sangam.getLocation())
                .address(sangam.getAddress())
                .village(sangam.getVillage())
                .district(sangam.getDistrict())
                .state(sangam.getState())
                .pincode(sangam.getPincode())
                .mobileNumber(sangam.getMobileNumber())
                .email(sangam.getEmail())
                .slogan(sangam.getSlogan())
                .status(currentStatus)
                .createdAt(sangam.getCreatedAt())
                .updatedAt(sangam.getUpdatedAt())
                .adminId(assignedAdmin != null ? assignedAdmin.getId() : null)
                .adminName(assignedAdmin != null ? assignedAdmin.getName() : null)
                .adminMobile(assignedAdmin != null ? assignedAdmin.getMobileNumber() : null)
                .adminEmail(assignedAdmin != null ? assignedAdmin.getEmail() : null)
                .adminStatus(assignedAdmin != null ? assignedAdmin.getStatus() : null)
                .extensionCount(extensionCount)
                .build();
    }

    private SuperAdminDTO.AdminDetailResponse mapToAdminDetailResponse(User user, Sangam sangam) {
        return SuperAdminDTO.AdminDetailResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .mobileNumber(user.getMobileNumber())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .memberCode(user.getMemberCode())
                .joinDate(user.getJoinDate())
                .sangamId(sangam != null ? sangam.getId() : user.getSangamId())
                .sangamName(sangam != null ? sangam.getName() : null)
                .sangamCode(sangam != null ? sangam.getCode() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
