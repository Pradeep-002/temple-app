package com.oornithi.service;

import com.oornithi.dto.SangamDTO;
import com.oornithi.entity.Sangam;
import com.oornithi.entity.User;
import com.oornithi.repository.SangamRepository;
import com.oornithi.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class SangamService {

    public static final String DEFAULT_MEMBER_PASSWORD = "login1-2";
    private static final String DEFAULT_SLOGAN = "🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️";

    private final SangamRepository sangamRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SangamService(SangamRepository sangamRepository, 
                         UserRepository userRepository,
                         PasswordEncoder passwordEncoder) {
        this.sangamRepository = sangamRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public SangamDTO.SangamSettingsResponse getSangamSettings(UUID currentUserId, UUID tenantId) {
        UUID sangamId = resolveSangamId(currentUserId, tenantId);
        Sangam sangam = sangamRepository.findById(sangamId)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + sangamId));

        return toSettingsResponse(sangam);
    }

    @Transactional
    public SangamDTO.SangamSettingsResponse updateSangamSettings(UUID currentUserId, UUID tenantId, SangamDTO.UpdateSangamSettingsRequest request) {
        UUID sangamId = resolveSangamId(currentUserId, tenantId);
        Sangam sangam = sangamRepository.findById(sangamId)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + sangamId));

        // Validate mobile number uniqueness if changed
        if (request.getMobileNumber() != null && !request.getMobileNumber().isBlank()) {
            String newMobile = request.getMobileNumber().trim();
            if (!newMobile.equalsIgnoreCase(sangam.getMobileNumber())) {
                if (sangamRepository.existsByMobileNumber(newMobile)) {
                    throw new RuntimeException("Mobile number already in use by another Sangam");
                }
                sangam.setMobileNumber(newMobile);
            }
        }

        sangam.setName(request.getName().trim());
        sangam.setRegistrationNumber(request.getRegistrationNumber());
        sangam.setLocation(request.getLocation());
        sangam.setAddress(request.getAddress());
        sangam.setVillage(request.getVillage());
        sangam.setDistrict(request.getDistrict());
        sangam.setState(request.getState());
        sangam.setPincode(request.getPincode());
        sangam.setEmail(request.getEmail());

        if (request.getSlogan() != null) {
            sangam.setSlogan(request.getSlogan().trim());
        }

        if (request.getDefaultMemberPassword() != null && !request.getDefaultMemberPassword().isBlank()) {
            String newPassword = request.getDefaultMemberPassword().trim();
            if (newPassword.length() < 6) {
                throw new RuntimeException("Default member password must be at least 6 characters");
            }
            sangam.setDefaultMemberPasswordHash(passwordEncoder.encode(newPassword));
        }

        sangam = sangamRepository.save(sangam);
        return toSettingsResponse(sangam);
    }

    @Transactional
    public void updateDefaultMemberPassword(UUID currentUserId, UUID tenantId, String newPassword) {
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new RuntimeException("Default member password must be at least 6 characters");
        }
        UUID sangamId = resolveSangamId(currentUserId, tenantId);
        Sangam sangam = sangamRepository.findById(sangamId)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + sangamId));

        sangam.setDefaultMemberPasswordHash(passwordEncoder.encode(newPassword.trim()));
        sangamRepository.save(sangam);
    }

    public String getEffectiveDefaultPasswordHash(Sangam sangam) {
        if (sangam.getDefaultMemberPasswordHash() != null && !sangam.getDefaultMemberPasswordHash().isBlank()) {
            return sangam.getDefaultMemberPasswordHash();
        }
        String defaultHash = passwordEncoder.encode(DEFAULT_MEMBER_PASSWORD);
        sangam.setDefaultMemberPasswordHash(defaultHash);
        sangamRepository.save(sangam);
        return defaultHash;
    }

    public SangamDTO.SangamSettingsResponse getPublicSangamInfo(UUID tenantId) {
        if (tenantId == null) {
            throw new RuntimeException("Sangam identifier is required");
        }
        Sangam sangam = sangamRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Sangam not found with ID: " + tenantId));
        return toSettingsResponse(sangam);
    }

    private UUID resolveSangamId(UUID currentUserId, UUID tenantId) {
        if (currentUserId != null) {
            User user = userRepository.findById(currentUserId).orElse(null);
            if (user != null && user.getSangamId() != null) {
                return user.getSangamId();
            }
        }
        if (tenantId != null) {
            return tenantId;
        }
        throw new RuntimeException("User is not associated with any Sangam");
    }

    private SangamDTO.SangamSettingsResponse toSettingsResponse(Sangam sangam) {
        String slogan = (sangam.getSlogan() != null && !sangam.getSlogan().isBlank()) 
                ? sangam.getSlogan().trim() 
                : DEFAULT_SLOGAN;

        boolean defaultPasswordConfigured = sangam.getDefaultMemberPasswordHash() != null && !sangam.getDefaultMemberPasswordHash().isBlank();

        return SangamDTO.SangamSettingsResponse.builder()
                .id(sangam.getId())
                .name(sangam.getName() != null ? sangam.getName().trim() : null)
                .registrationNumber(sangam.getRegistrationNumber())
                .startDate(sangam.getStartDate())
                .location(sangam.getLocation())
                .address(sangam.getAddress())
                .village(sangam.getVillage())
                .district(sangam.getDistrict())
                .state(sangam.getState())
                .pincode(sangam.getPincode())
                .mobileNumber(sangam.getMobileNumber())
                .email(sangam.getEmail())
                .status(sangam.getStatus())
                .slogan(slogan)
                .defaultPasswordConfigured(defaultPasswordConfigured)
                .build();
    }
}
