package com.oornithi;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.MemberDTO;
import com.oornithi.entity.Sangam;
import com.oornithi.repository.SangamRepository;
import com.oornithi.service.MemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class TenantIsolationTest {

    @Autowired
    private SangamRepository sangamRepository;

    @Autowired
    private MemberService memberService;

    private UUID sangamAId;
    private UUID sangamBId;

    @BeforeEach
    void setUp() {
        Sangam sangamA = sangamRepository.save(Sangam.builder()
                .name("Sangam Alpha")
                .mobileNumber("9876543210")
                .status("ACTIVE")
                .build());
        sangamAId = sangamA.getId();

        Sangam sangamB = sangamRepository.save(Sangam.builder()
                .name("Sangam Beta")
                .mobileNumber("9876543211")
                .status("ACTIVE")
                .build());
        sangamBId = sangamB.getId();
    }

    @Test
    @DisplayName("Verify tenant data isolation: Sangam A context cannot see Sangam B members")
    void testTenantIsolation() {
        // Create member in Sangam A
        MemberDTO.CreateMemberRequest requestA = new MemberDTO.CreateMemberRequest(
                sangamAId, "Nagaraj", "9111111111", "nagaraj@alpha.com", "Male", null, "Address A", null, "MEMBER"
        );
        memberService.createMember(sangamAId, requestA);

        // Create member in Sangam B
        MemberDTO.CreateMemberRequest requestB = new MemberDTO.CreateMemberRequest(
                sangamBId, "Pradeep", "9222222222", "pradeep@beta.com", "Male", null, "Address B", null, "MEMBER"
        );
        memberService.createMember(sangamBId, requestB);

        // Query under Sangam A context
        TenantContext.setCurrentTenant(sangamAId);
        List<MemberDTO.MemberResponse> membersA = memberService.getSangamMembers(sangamAId);
        assertEquals(1, membersA.size());
        assertEquals("Nagaraj", membersA.get(0).getName());

        // Query under Sangam B context
        TenantContext.setCurrentTenant(sangamBId);
        List<MemberDTO.MemberResponse> membersB = memberService.getSangamMembers(sangamBId);
        assertEquals(1, membersB.size());
        assertEquals("Pradeep", membersB.get(0).getName());

        TenantContext.clear();
    }
}
