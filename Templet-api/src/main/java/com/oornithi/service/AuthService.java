package com.oornithi.service;

import com.oornithi.config.JwtTokenProvider;
import com.oornithi.dto.AuthDTO;
import com.oornithi.entity.Sangam;
import com.oornithi.entity.Subscription;
import com.oornithi.entity.User;
import com.oornithi.repository.SangamRepository;
import com.oornithi.repository.SubscriptionRepository;
import com.oornithi.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SangamRepository sangamRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       SangamRepository sangamRepository,
                       SubscriptionRepository subscriptionRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.sangamRepository = sangamRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest request) {
        User user = userRepository.findByMobileNumber(request.getMobileNumber())
                .orElseThrow(() -> new RuntimeException("Invalid mobile number or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid mobile number or password");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("User account is inactive");
        }

        String sangamName = "";
        String slogan = "🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️";
        if (user.getSangamId() != null) {
            Optional<Sangam> sangamOpt = sangamRepository.findById(user.getSangamId());
            if (sangamOpt.isPresent()) {
                Sangam sangam = sangamOpt.get();
                if ("SUSPENDED".equalsIgnoreCase(sangam.getStatus())) {
                    throw new RuntimeException("Sangam account is suspended. Please contact support.");
                }
                sangamName = sangam.getName();
                if (sangam.getSlogan() != null && !sangam.getSlogan().isBlank()) {
                    slogan = sangam.getSlogan();
                }
            }
        }

        String token = tokenProvider.generateToken(user.getId(), user.getMobileNumber(), user.getRole(), user.getSangamId());

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .mobileNumber(user.getMobileNumber())
                .role(user.getRole())
                .sangamId(user.getSangamId())
                .sangamName(sangamName)
                .slogan(slogan)
                .memberCode(user.getMemberCode())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    @Transactional
    public AuthDTO.LoginResponse registerSangam(AuthDTO.SangamRegisterRequest request) {
        if (sangamRepository.existsByMobileNumber(request.getSangamMobile())) {
            throw new RuntimeException("Sangam mobile number already registered");
        }

        if (userRepository.findByMobileNumber(request.getAdminMobile()).isPresent()) {
            throw new RuntimeException("Admin mobile number already registered");
        }

        // 1. Create Sangam Tenant
        Sangam sangam = Sangam.builder()
                .name(request.getSangamName())
                .registrationNumber(request.getRegistrationNumber())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .location(request.getLocation())
                .address(request.getAddress())
                .village(request.getVillage())
                .district(request.getDistrict())
                .state(request.getState())
                .pincode(request.getPincode())
                .mobileNumber(request.getSangamMobile())
                .email(request.getSangamEmail())
                .slogan("🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️")
                .status("ACTIVE")
                .build();

        sangam = sangamRepository.save(sangam);

        // 2. Create Sangam Admin User
        User admin = User.builder()
                .sangamId(sangam.getId())
                .name(request.getAdminName())
                .mobileNumber(request.getAdminMobile())
                .email(request.getAdminEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("SANGAM_ADMIN")
                .status("ACTIVE")
                .memberCode("ADM001")
                .joinDate(LocalDate.now())
                .build();

        admin = userRepository.save(admin);

        // 3. Create 1-Month Free Trial Subscription
        Subscription trialSub = Subscription.builder()
                .sangamId(sangam.getId())
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(1))
                .status("TRIAL")
                .isTrial(true)
                .paymentStatus("PAID")
                .build();

        subscriptionRepository.save(trialSub);

        // 4. Generate Token & Login Response
        String token = tokenProvider.generateToken(admin.getId(), admin.getMobileNumber(), admin.getRole(), sangam.getId());

        return AuthDTO.LoginResponse.builder()
                .token(token)
                .userId(admin.getId())
                .name(admin.getName())
                .mobileNumber(admin.getMobileNumber())
                .role(admin.getRole())
                .sangamId(sangam.getId())
                .sangamName(sangam.getName())
                .slogan(sangam.getSlogan())
                .memberCode(admin.getMemberCode())
                .build();
    }

    @Transactional
    public void changePassword(java.util.UUID userId, AuthDTO.ChangePasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long");
        }
        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);
    }
}
