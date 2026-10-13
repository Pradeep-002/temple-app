package com.oornithi.config;

import com.oornithi.entity.SubscriptionPlan;
import com.oornithi.entity.User;
import com.oornithi.repository.SubscriptionPlanRepository;
import com.oornithi.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      SubscriptionPlanRepository planRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Create Default Super Admin
        if (userRepository.findByMobileNumber("9999999999").isEmpty()) {
            User superAdmin = User.builder()
                    .name("Super Admin")
                    .mobileNumber("9999999999")
                    .email("admin@oornithi.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role("SUPER_ADMIN")
                    .status("ACTIVE")
                    .memberCode("SUPER001")
                    .build();
            userRepository.save(superAdmin);
        }

        // 2. Create Default Subscription Plans
        if (planRepository.count() == 0) {
            SubscriptionPlan freeTrial = SubscriptionPlan.builder()
                    .planName("Free Trial")
                    .description("1 Month Free Access to Core Features")
                    .price(BigDecimal.ZERO)
                    .billingCycleMonths(1)
                    .memberLimit(100)
                    .agentLimit(5)
                    .eventLimit(5)
                    .status("ACTIVE")
                    .build();

            SubscriptionPlan yearlyPlan = SubscriptionPlan.builder()
                    .planName("Oor Nithi Yearly Plan")
                    .description("12 Months Unlimited Sangam Management")
                    .price(new BigDecimal("2999.00"))
                    .billingCycleMonths(12)
                    .memberLimit(1000)
                    .agentLimit(50)
                    .eventLimit(100)
                    .status("ACTIVE")
                    .build();

            planRepository.save(freeTrial);
            planRepository.save(yearlyPlan);
        }
    }
}
