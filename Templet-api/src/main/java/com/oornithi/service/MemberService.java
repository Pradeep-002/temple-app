package com.oornithi.service;

import com.oornithi.dto.MemberDTO;
import com.oornithi.entity.CollectionConfig;
import com.oornithi.entity.MemberCollection;
import com.oornithi.entity.Sangam;
import com.oornithi.entity.User;
import com.oornithi.repository.CollectionConfigRepository;
import com.oornithi.repository.MemberCollectionRepository;
import com.oornithi.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MemberService {

    private final UserRepository userRepository;
    private final CollectionConfigRepository configRepository;
    private final MemberCollectionRepository memberCollectionRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.oornithi.repository.SangamRepository sangamRepository;

    public MemberService(UserRepository userRepository,
                         CollectionConfigRepository configRepository,
                         MemberCollectionRepository memberCollectionRepository,
                         PasswordEncoder passwordEncoder,
                         com.oornithi.repository.SangamRepository sangamRepository) {
        this.userRepository = userRepository;
        this.configRepository = configRepository;
        this.memberCollectionRepository = memberCollectionRepository;
        this.passwordEncoder = passwordEncoder;
        this.sangamRepository = sangamRepository;
    }

    @Transactional
    public MemberDTO.MemberResponse createMember(UUID sangamId, MemberDTO.CreateMemberRequest request) {
        if (sangamId == null) {
            if (request.getSangamId() != null) {
                sangamId = request.getSangamId();
            } else {
                sangamId = sangamRepository.findAll().stream()
                        .findFirst()
                        .map(com.oornithi.entity.Sangam::getId)
                        .orElseThrow(() -> new RuntimeException("No Sangam found in the system. Please create a Sangam first."));
            }
        }

        UUID finalSangamId = sangamId;
        com.oornithi.entity.Sangam sangam = sangamRepository.findById(sangamId)
                .orElseThrow(() -> new RuntimeException("Sangam with ID " + finalSangamId + " does not exist"));

        if (userRepository.existsBySangamIdAndMobileNumber(sangamId, request.getMobileNumber().trim())) {
            throw new RuntimeException("Member with mobile number " + request.getMobileNumber() + " already exists in " + sangam.getName());
        }

        long memberCount = userRepository.countBySangamId(sangamId) + 1;
        String memberCode = String.format("SGM%03d", memberCount);

        String defaultPasswordHash = sangam.getDefaultMemberPasswordHash();
        if (defaultPasswordHash == null || defaultPasswordHash.isBlank()) {
            defaultPasswordHash = passwordEncoder.encode("login1-2");
            sangam.setDefaultMemberPasswordHash(defaultPasswordHash);
            sangamRepository.save(sangam);
        }

        User member = User.builder()
                .sangamId(sangamId)
                .name(request.getName().trim())
                .mobileNumber(request.getMobileNumber().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .password(defaultPasswordHash) // Configured default member password
                .role(request.getRole() != null ? request.getRole() : "MEMBER")
                .status("ACTIVE")
                .memberCode(memberCode)
                .gender(request.getGender())
                .dob(request.getDob())
                .address(request.getAddress())
                .joinDate(request.getJoinDate() != null ? request.getJoinDate() : LocalDate.now())
                .build();

        member = userRepository.save(member);

        // Auto-provision collection slots if an active collection cycle exists
        Optional<CollectionConfig> activeConfigOpt = configRepository.findBySangamIdAndStatus(sangamId, "ACTIVE");
        if (activeConfigOpt.isPresent() && !"SUPER_ADMIN".equalsIgnoreCase(member.getRole())) {
            provisionMemberCollectionSlots(sangamId, member, activeConfigOpt.get());
        }

        return mapToResponse(member);
    }

    public List<MemberDTO.MemberResponse> getSangamMembers(UUID sangamId) {
        return getMembers(sangamId, null);
    }

    public List<MemberDTO.MemberResponse> getMembersByRole(UUID sangamId, String role) {
        return getMembers(sangamId, role);
    }

    public List<MemberDTO.MemberResponse> getMembers(UUID sangamId, String role) {
        List<User> users;
        if (sangamId != null) {
            if (role != null && !role.trim().isEmpty()) {
                users = userRepository.findBySangamIdAndRole(sangamId, role);
            } else {
                users = userRepository.findBySangamId(sangamId);
            }
        } else {
            // Super Admin listing across all sangams
            if (role != null && !role.trim().isEmpty()) {
                users = userRepository.findAll().stream()
                        .filter(u -> role.equalsIgnoreCase(u.getRole()))
                        .collect(Collectors.toList());
            } else {
                users = userRepository.findAll().stream()
                        .filter(u -> !"SUPER_ADMIN".equalsIgnoreCase(u.getRole()))
                        .collect(Collectors.toList());
            }
        }
        return users.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public MemberDTO.MemberResponse getMemberById(UUID sangamId, UUID memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (sangamId != null && !sangamId.equals(member.getSangamId())) {
            throw new RuntimeException("Unauthorized access to member data");
        }
        return mapToResponse(member);
    }

    @Transactional
    public MemberDTO.MemberResponse updateMember(UUID currentSangamId, UUID memberId, MemberDTO.UpdateMemberRequest request) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found with ID: " + memberId));

        if (currentSangamId != null && !currentSangamId.equals(member.getSangamId())) {
            throw new RuntimeException("Unauthorized: You can only edit members belonging to your own Sangam");
        }

        UUID sangamId = member.getSangamId();
        String newMobile = request.getMobileNumber().trim();
        if (!newMobile.equalsIgnoreCase(member.getMobileNumber())) {
            if (userRepository.existsBySangamIdAndMobileNumber(sangamId, newMobile)) {
                throw new RuntimeException("Another member with mobile number " + newMobile + " already exists in this Sangam");
            }
            member.setMobileNumber(newMobile);
        }

        member.setName(request.getName().trim());
        member.setEmail(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null);
        member.setGender(request.getGender());
        member.setDob(request.getDob());
        member.setAddress(request.getAddress());
        if (request.getJoinDate() != null) {
            member.setJoinDate(request.getJoinDate());
        }
        if (request.getRole() != null && !request.getRole().isBlank()) {
            member.setRole(request.getRole().trim());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            member.setStatus(request.getStatus().trim().toUpperCase());
        }

        // NOTE: Existing member password is fully preserved!
        member = userRepository.save(member);
        return mapToResponse(member);
    }

    @Transactional
    public MemberDTO.MemberResponse updateSelfProfile(UUID userId, MemberDTO.UpdateProfileRequest request) {
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Member name cannot be empty");
        }

        member.setName(request.getName().trim());
        member.setAddress(request.getAddress() != null && !request.getAddress().isBlank() ? request.getAddress().trim() : null);
        member.setEmail(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null);
        if (request.getProfileImageUrl() != null) {
            member.setProfileImageUrl(request.getProfileImageUrl().trim().isEmpty() ? null : request.getProfileImageUrl().trim());
        }

        // Strict Security: Mobile number, role, sangamId, status, joinDate, password are NEVER modified here
        member = userRepository.save(member);
        return mapToResponse(member);
    }

    @Transactional
    public MemberDTO.MemberResponse saveProfilePhoto(UUID userId, byte[] imageBytes, String originalFilename) {
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (imageBytes == null || imageBytes.length == 0) {
            throw new RuntimeException("Image data is required");
        }

        if (imageBytes.length > 5 * 1024 * 1024) {
            throw new RuntimeException("Image size exceeds maximum limit of 5MB");
        }

        String ext = "jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            String candidate = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
            if (candidate.equals("jpg") || candidate.equals("jpeg") || candidate.equals("png") || candidate.equals("webp")) {
                ext = candidate;
            }
        }

        try {
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads", "profiles");
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            String fileName = "profile_" + userId + "_" + System.currentTimeMillis() + "." + ext;
            java.nio.file.Path filePath = uploadDir.resolve(fileName);
            java.nio.file.Files.write(filePath, imageBytes);

            String photoUrl = "/api/members/photo/" + fileName;
            member.setProfileImageUrl(photoUrl);
            member = userRepository.save(member);

            return mapToResponse(member);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to save profile photo: " + e.getMessage(), e);
        }
    }

    private void provisionMemberCollectionSlots(UUID sangamId, User member, CollectionConfig config) {
        List<String> monthNames = List.of(
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        );

        int currentMonth = config.getStartMonth();
        int currentYear = config.getStartYear();
        int endMonth = config.getEndMonth();
        int endYear = config.getEndYear();

        int periodOrder = 1;
        while (currentYear < endYear || (currentYear == endYear && currentMonth <= endMonth)) {
            String monthName = monthNames.get(currentMonth - 1);

            MemberCollection slot = MemberCollection.builder()
                    .sangamId(sangamId)
                    .memberId(member.getId())
                    .configId(config.getId())
                    .monthName(monthName)
                    .year(currentYear)
                    .periodOrder(periodOrder)
                    .expectedAmount(config.getMonthlyAmount())
                    .paidAmount(BigDecimal.ZERO)
                    .balanceAmount(config.getMonthlyAmount())
                    .status("PENDING")
                    .build();

            memberCollectionRepository.save(slot);

            periodOrder++;
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }
    }

    private MemberDTO.MemberResponse mapToResponse(User user) {
        String sangamName = null;
        String slogan = null;
        if (user.getSangamId() != null) {
            Optional<Sangam> sangamOpt = sangamRepository.findById(user.getSangamId());
            if (sangamOpt.isPresent()) {
                Sangam s = sangamOpt.get();
                sangamName = s.getName() != null ? s.getName().trim() : null;
                slogan = (s.getSlogan() != null && !s.getSlogan().isBlank()) ? s.getSlogan().trim() : "🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️";
            }
        }

        return MemberDTO.MemberResponse.builder()
                .id(user.getId())
                .sangamId(user.getSangamId())
                .sangamName(sangamName)
                .slogan(slogan)
                .name(user.getName())
                .mobileNumber(user.getMobileNumber())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .memberCode(user.getMemberCode())
                .gender(user.getGender())
                .dob(user.getDob())
                .address(user.getAddress())
                .joinDate(user.getJoinDate())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
