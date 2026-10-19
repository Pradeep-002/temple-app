package com.oornithi.service;

import com.oornithi.dto.CollectionDTO;
import com.oornithi.entity.*;
import com.oornithi.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CollectionService {

    private final CollectionConfigRepository configRepository;
    private final MemberCollectionRepository memberCollectionRepository;
    private final CollectionPaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final SangamRepository sangamRepository;
    private final LedgerService ledgerService;

    public CollectionService(CollectionConfigRepository configRepository,
                             MemberCollectionRepository memberCollectionRepository,
                             CollectionPaymentRepository paymentRepository,
                             UserRepository userRepository,
                             SangamRepository sangamRepository,
                             LedgerService ledgerService) {
        this.configRepository = configRepository;
        this.memberCollectionRepository = memberCollectionRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.sangamRepository = sangamRepository;
        this.ledgerService = ledgerService;
    }

    @Transactional
    public CollectionConfig createCollectionConfig(UUID sangamId, CollectionDTO.CreateCollectionConfigRequest request) {
        if (sangamId == null) {
            sangamId = sangamRepository.findAll().stream().findFirst()
                    .map(Sangam::getId)
                    .orElseThrow(() -> new RuntimeException("No Sangam found in the system. Please create a Sangam first."));
        }

        // Deactivate any previous active configs for this sangam
        List<CollectionConfig> existingActive = configRepository.findBySangamId(sangamId).stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                .collect(Collectors.toList());
        for (CollectionConfig c : existingActive) {
            c.setStatus("COMPLETED");
            configRepository.save(c);
        }

        CollectionConfig config = CollectionConfig.builder()
                .sangamId(sangamId)
                .collectionName(request.getCollectionName())
                .collectionType("MONTHLY")
                .monthlyAmount(request.getMonthlyAmount())
                .startMonth(request.getStartMonth())
                .startYear(request.getStartYear())
                .endMonth(request.getEndMonth())
                .endYear(request.getEndYear())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : 10)
                .gracePeriod(request.getGracePeriod() != null ? request.getGracePeriod() : 5)
                .status("ACTIVE")
                .build();

        config = configRepository.save(config);

        // Generate expected collection slots for all existing active sangam members
        List<User> members = userRepository.findBySangamId(sangamId).stream()
                .filter(u -> !"SUPER_ADMIN".equalsIgnoreCase(u.getRole()))
                .collect(Collectors.toList());

        for (User member : members) {
            generateSlotsForMember(sangamId, member, config);
        }

        return config;
    }

    private void generateSlotsForMember(UUID sangamId, User member, CollectionConfig config) {
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

    @Transactional
    public CollectionConfig completeCycle(UUID sangamId, UUID configId) {
        if (sangamId == null) {
            sangamId = sangamRepository.findAll().stream().findFirst()
                    .map(Sangam::getId)
                    .orElse(null);
        }
        CollectionConfig config = configRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("Collection cycle not found"));
        if (sangamId != null && !config.getSangamId().equals(sangamId)) {
            throw new RuntimeException("Unauthorized to modify this cycle");
        }
        config.setStatus("COMPLETED");
        return configRepository.save(config);
    }

    public List<CollectionConfig> getSangamCycles(UUID sangamId) {
        if (sangamId == null) {
            sangamId = sangamRepository.findAll().stream().findFirst()
                    .map(Sangam::getId)
                    .orElse(null);
        }
        if (sangamId == null) {
            return new ArrayList<>();
        }
        return configRepository.findBySangamIdOrderByCreatedAtDesc(sangamId);
    }

    @Transactional
    public CollectionDTO.CollectionMatrixResponse getCollectionMatrix(UUID sangamId) {
        return getCollectionMatrix(sangamId, null);
    }

    @Transactional
    public CollectionDTO.CollectionMatrixResponse getCollectionMatrix(UUID sangamId, UUID configId) {
        return getCollectionMatrix(sangamId, configId, null, false);
    }

    @Transactional
    public CollectionDTO.CollectionMatrixResponse getCollectionMatrix(UUID sangamId, UUID configId, UUID currentUserId, boolean isMember) {
        if (sangamId == null) {
            sangamId = sangamRepository.findAll().stream().findFirst()
                    .map(Sangam::getId)
                    .orElse(null);
            if (sangamId == null) {
                return CollectionDTO.CollectionMatrixResponse.builder()
                        .cycles(new ArrayList<>())
                        .monthHeaders(new ArrayList<>())
                        .rows(new ArrayList<>())
                        .grandTotalPaid(BigDecimal.ZERO)
                        .grandTotalPending(BigDecimal.ZERO)
                        .build();
            }
        }

        List<CollectionConfig> allCycles = configRepository.findBySangamIdOrderByCreatedAtDesc(sangamId);

        CollectionConfig selectedConfig = null;
        if (configId != null) {
            selectedConfig = allCycles.stream()
                    .filter(c -> c.getId().equals(configId))
                    .findFirst()
                    .orElse(null);
        }
        if (selectedConfig == null) {
            selectedConfig = allCycles.stream()
                    .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                    .findFirst()
                    .orElse(allCycles.isEmpty() ? null : allCycles.get(0));
        }

        if (selectedConfig == null) {
            return CollectionDTO.CollectionMatrixResponse.builder()
                    .activeConfig(null)
                    .cycles(allCycles)
                    .monthHeaders(new ArrayList<>())
                    .rows(new ArrayList<>())
                    .grandTotalPaid(BigDecimal.ZERO)
                    .grandTotalPending(BigDecimal.ZERO)
                    .build();
        }

        List<User> members = userRepository.findBySangamId(sangamId).stream()
                .filter(u -> !"SUPER_ADMIN".equalsIgnoreCase(u.getRole()))
                .collect(Collectors.toList());

        if (isMember && currentUserId != null) {
            members = members.stream()
                    .filter(u -> u.getId().equals(currentUserId))
                    .collect(Collectors.toList());
        }

        // Strictly fetch slots ONLY for this selected cycle
        List<MemberCollection> targetCollections = memberCollectionRepository.findBySangamIdAndConfigId(sangamId, selectedConfig.getId());

        // Auto-provision slots for members who don't have slots under this active config
        if ("ACTIVE".equalsIgnoreCase(selectedConfig.getStatus())) {
            boolean addedAny = false;
            for (User member : members) {
                boolean hasSlots = targetCollections.stream().anyMatch(mc -> mc.getMemberId().equals(member.getId()));
                if (!hasSlots) {
                    generateSlotsForMember(sangamId, member, selectedConfig);
                    addedAny = true;
                }
            }
            if (addedAny) {
                targetCollections = memberCollectionRepository.findBySangamIdAndConfigId(sangamId, selectedConfig.getId());
            }
        }

        List<String> monthNames = List.of(
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        );

        List<String> monthHeaders = new ArrayList<>();
        int currentMonth = selectedConfig.getStartMonth();
        int currentYear = selectedConfig.getStartYear();
        int endMonth = selectedConfig.getEndMonth();
        int endYear = selectedConfig.getEndYear();
        while (currentYear < endYear || (currentYear == endYear && currentMonth <= endMonth)) {
            String monthName = monthNames.get(currentMonth - 1);
            monthHeaders.add(monthName + " " + currentYear);
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }

        List<CollectionDTO.MemberMatrixRow> rows = new ArrayList<>();
        BigDecimal grandTotalPaid = BigDecimal.ZERO;
        BigDecimal grandTotalPending = BigDecimal.ZERO;

        for (User member : members) {
            List<MemberCollection> memberCollections = targetCollections.stream()
                    .filter(mc -> mc.getMemberId().equals(member.getId()))
                    .sorted(Comparator.comparing(MemberCollection::getPeriodOrder))
                    .collect(Collectors.toList());

            List<CollectionDTO.MatrixCell> cells = new ArrayList<>();
            BigDecimal memberTotalExpected = BigDecimal.ZERO;
            BigDecimal memberTotalPaid = BigDecimal.ZERO;
            BigDecimal memberTotalPending = BigDecimal.ZERO;

            for (int i = 0; i < monthHeaders.size(); i++) {
                final int periodOrder = i + 1;
                Optional<MemberCollection> mcOpt = memberCollections.stream()
                        .filter(mc -> mc.getPeriodOrder() != null && mc.getPeriodOrder().equals(periodOrder))
                        .findFirst();

                if (mcOpt.isPresent()) {
                    MemberCollection mc = mcOpt.get();
                    CollectionDTO.MatrixCell cell = CollectionDTO.MatrixCell.builder()
                            .collectionId(mc.getId())
                            .monthName(mc.getMonthName())
                            .year(mc.getYear())
                            .expectedAmount(mc.getExpectedAmount())
                            .paidAmount(mc.getPaidAmount())
                            .balanceAmount(mc.getBalanceAmount())
                            .status(mc.getStatus())
                            .build();

                    cells.add(cell);
                    memberTotalExpected = memberTotalExpected.add(mc.getExpectedAmount());
                    memberTotalPaid = memberTotalPaid.add(mc.getPaidAmount());
                    memberTotalPending = memberTotalPending.add(mc.getBalanceAmount());
                } else {
                    cells.add(CollectionDTO.MatrixCell.builder()
                            .collectionId(null)
                            .monthName(monthHeaders.get(i))
                            .year(null)
                            .expectedAmount(BigDecimal.ZERO)
                            .paidAmount(BigDecimal.ZERO)
                            .balanceAmount(BigDecimal.ZERO)
                            .status("N/A")
                            .build());
                }
            }

            CollectionDTO.MemberMatrixRow row = CollectionDTO.MemberMatrixRow.builder()
                    .memberId(member.getId())
                    .memberCode(member.getMemberCode())
                    .memberName(member.getName())
                    .mobileNumber(member.getMobileNumber())
                    .months(cells)
                    .totalExpected(memberTotalExpected)
                    .totalPaid(memberTotalPaid)
                    .totalPending(memberTotalPending)
                    .build();

            rows.add(row);
            grandTotalPaid = grandTotalPaid.add(memberTotalPaid);
            grandTotalPending = grandTotalPending.add(memberTotalPending);
        }

        return CollectionDTO.CollectionMatrixResponse.builder()
                .activeConfig(selectedConfig)
                .cycles(allCycles)
                .monthHeaders(monthHeaders)
                .rows(rows)
                .grandTotalPaid(grandTotalPaid)
                .grandTotalPending(grandTotalPending)
                .build();
    }

    @Transactional
    public CollectionDTO.ReceiptResponse recordPayment(UUID sangamId, UUID collectorUserId, CollectionDTO.RecordPaymentRequest request) {
        MemberCollection mc = memberCollectionRepository.findById(request.getMemberCollectionId())
                .orElseThrow(() -> new RuntimeException("Collection record not found"));

        if (sangamId != null && !mc.getSangamId().equals(sangamId)) {
            throw new RuntimeException("Unauthorized transaction access");
        }

        if ("PAID".equalsIgnoreCase(mc.getStatus())) {
            throw new RuntimeException("This month collection is already fully paid");
        }

        BigDecimal newPaid = mc.getPaidAmount().add(request.getAmountPaid());
        if (newPaid.compareTo(mc.getExpectedAmount()) > 0) {
            throw new RuntimeException("Payment amount exceeds remaining balance");
        }

        BigDecimal newBalance = mc.getExpectedAmount().subtract(newPaid);
        mc.setPaidAmount(newPaid);
        mc.setBalanceAmount(newBalance);
        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            mc.setStatus("PAID");
        } else {
            mc.setStatus("PARTIAL");
        }

        memberCollectionRepository.save(mc);

        // Receipt generation
        String receiptNo = "REC-" + System.currentTimeMillis();

        LocalDateTime pDate = LocalDateTime.now();
        if (request.getPaymentDate() != null && !request.getPaymentDate().trim().isEmpty()) {
            try {
                if (request.getPaymentDate().contains("T")) {
                    pDate = LocalDateTime.parse(request.getPaymentDate().trim());
                } else {
                    pDate = java.time.LocalDate.parse(request.getPaymentDate().trim()).atTime(java.time.LocalTime.now());
                }
            } catch (Exception e) {
                pDate = LocalDateTime.now();
            }
        }

        CollectionPayment payment = CollectionPayment.builder()
                .sangamId(sangamId)
                .memberCollectionId(mc.getId())
                .receiptNumber(receiptNo)
                .amountPaid(request.getAmountPaid())
                .paymentDate(pDate)
                .paymentMode(request.getPaymentMode())
                .referenceNumber(request.getReferenceNumber())
                .remarks(request.getRemarks())
                .collectedById(collectorUserId)
                .build();

        paymentRepository.save(payment);

        // Record credit in Ledger
        User member = userRepository.findById(mc.getMemberId()).orElseThrow();
        String collectorName = collectorUserId != null ? userRepository.findById(collectorUserId).map(User::getName).orElse("System") : "Admin";
        String ledgerDesc = "Member Collection - " + member.getName() + " (" + mc.getMonthName() + " " + mc.getYear() + ")";
        ledgerService.recordCredit(sangamId, "MEMBER_COLLECTION", payment.getId(), request.getAmountPaid(), ledgerDesc, collectorName);

        Sangam sangam = sangamRepository.findById(sangamId).orElseThrow();

        return CollectionDTO.ReceiptResponse.builder()
                .receiptNumber(receiptNo)
                .sangamName(sangam.getName() != null ? sangam.getName().trim() : null)
                .sangamAddress(sangam.getAddress() + ", " + sangam.getVillage() + ", " + sangam.getDistrict())
                .sangamMobile(sangam.getMobileNumber())
                .sangamSlogan(sangam.getSlogan() != null && !sangam.getSlogan().isBlank() ? sangam.getSlogan().trim() : "🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️")
                .memberName(member.getName())
                .memberCode(member.getMemberCode())
                .monthName(mc.getMonthName())
                .year(mc.getYear())
                .amountPaid(request.getAmountPaid())
                .paymentMode(request.getPaymentMode())
                .paymentDate(payment.getPaymentDate())
                .collectedBy(collectorName)
                .referenceNumber(request.getReferenceNumber())
                .build();
    }

    public List<MemberCollection> getMemberCollections(UUID sangamId, UUID memberId) {
        return memberCollectionRepository.findBySangamIdAndMemberId(sangamId, memberId);
    }

    public CollectionDTO.ReceiptResponse getReceiptByMemberCollectionId(UUID sangamId, UUID memberCollectionId) {
        return getReceiptByMemberCollectionId(sangamId, memberCollectionId, null);
    }

    public CollectionDTO.ReceiptResponse getReceiptByMemberCollectionId(UUID sangamId, UUID memberCollectionId, UUID callerMemberId) {
        MemberCollection mc = memberCollectionRepository.findById(memberCollectionId)
                .orElseThrow(() -> new RuntimeException("Collection record not found"));

        if (sangamId != null && !mc.getSangamId().equals(sangamId)) {
            throw new RuntimeException("Unauthorized: Collection record belongs to another Sangam");
        }

        if (callerMemberId != null && !mc.getMemberId().equals(callerMemberId)) {
            throw new RuntimeException("Unauthorized: You can only view your own receipts");
        }

        List<CollectionPayment> payments = paymentRepository.findByMemberCollectionId(memberCollectionId);
        if (payments.isEmpty()) {
            throw new RuntimeException("No payment found for this collection record");
        }

        CollectionPayment payment = payments.get(payments.size() - 1);
        User member = userRepository.findById(mc.getMemberId()).orElseThrow();
        String collectorName = payment.getCollectedById() != null ?
                userRepository.findById(payment.getCollectedById()).map(User::getName).orElse("System") : "Admin";

        Sangam sangam = sangamRepository.findById(mc.getSangamId()).orElseThrow();

        return CollectionDTO.ReceiptResponse.builder()
                .receiptNumber(payment.getReceiptNumber())
                .sangamName(sangam.getName() != null ? sangam.getName().trim() : null)
                .sangamAddress(sangam.getAddress() + ", " + sangam.getVillage() + ", " + sangam.getDistrict())
                .sangamMobile(sangam.getMobileNumber())
                .sangamSlogan(sangam.getSlogan() != null && !sangam.getSlogan().isBlank() ? sangam.getSlogan().trim() : "🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️")
                .memberName(member.getName())
                .memberCode(member.getMemberCode())
                .monthName(mc.getMonthName())
                .year(mc.getYear())
                .amountPaid(payment.getAmountPaid())
                .paymentMode(payment.getPaymentMode())
                .paymentDate(payment.getPaymentDate())
                .collectedBy(collectorName)
                .referenceNumber(payment.getReferenceNumber())
                .build();
    }

    public CollectionDTO.MemberPaymentSummaryResponse getMemberPaymentHistory(UUID memberId) {
        return getMemberPaymentHistory(memberId, null);
    }

    public CollectionDTO.MemberPaymentSummaryResponse getMemberPaymentHistory(UUID memberId, UUID configId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found with ID: " + memberId));

        UUID sangamId = member.getSangamId();
        List<CollectionConfig> allCycles = configRepository.findBySangamIdOrderByCreatedAtDesc(sangamId);

        // Find target cycle:
        CollectionConfig targetConfig = null;
        if (configId != null) {
            targetConfig = allCycles.stream()
                    .filter(c -> c.getId().equals(configId))
                    .findFirst()
                    .orElse(null);
        }
        if (targetConfig == null) {
            // Find active cycle, otherwise most recent cycle
            targetConfig = allCycles.stream()
                    .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                    .findFirst()
                    .orElse(allCycles.isEmpty() ? null : allCycles.get(0));
        }

        List<MemberCollection> collections;
        if (targetConfig != null) {
            final UUID selectedConfigId = targetConfig.getId();
            collections = memberCollectionRepository.findByMemberId(memberId).stream()
                    .filter(mc -> selectedConfigId.equals(mc.getConfigId()))
                    .collect(Collectors.toList());
        } else {
            collections = memberCollectionRepository.findByMemberId(memberId);
        }

        collections.sort(Comparator.comparing(MemberCollection::getYear)
                .thenComparing(MemberCollection::getPeriodOrder));

        BigDecimal totalExpected = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal monthlyExpected = targetConfig != null ? targetConfig.getMonthlyAmount() : BigDecimal.ZERO;

        List<CollectionDTO.MemberPaymentItemResponse> items = new ArrayList<>();
        for (MemberCollection mc : collections) {
            BigDecimal expected = mc.getExpectedAmount() != null ? mc.getExpectedAmount() : BigDecimal.ZERO;
            BigDecimal paid = mc.getPaidAmount() != null ? mc.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal balance = mc.getBalanceAmount() != null ? mc.getBalanceAmount() : BigDecimal.ZERO;

            totalExpected = totalExpected.add(expected);
            totalPaid = totalPaid.add(paid);
            totalOutstanding = totalOutstanding.add(balance);
            if (monthlyExpected.compareTo(BigDecimal.ZERO) == 0 && expected.compareTo(BigDecimal.ZERO) > 0) {
                monthlyExpected = expected;
            }

            List<CollectionPayment> payments = paymentRepository.findByMemberCollectionId(mc.getId());
            CollectionPayment lastPayment = payments.isEmpty() ? null : payments.get(payments.size() - 1);

            String collectorName = null;
            if (lastPayment != null && lastPayment.getCollectedById() != null) {
                collectorName = userRepository.findById(lastPayment.getCollectedById())
                        .map(User::getName)
                        .orElse("System");
            }

            items.add(CollectionDTO.MemberPaymentItemResponse.builder()
                    .memberCollectionId(mc.getId())
                    .monthName(mc.getMonthName())
                    .year(mc.getYear())
                    .periodOrder(mc.getPeriodOrder())
                    .expectedAmount(expected)
                    .paidAmount(paid)
                    .balanceAmount(balance)
                    .status(mc.getStatus())
                    .paymentDate(lastPayment != null ? lastPayment.getPaymentDate() : null)
                    .paymentMode(lastPayment != null ? lastPayment.getPaymentMode() : null)
                    .receiptNumber(lastPayment != null ? lastPayment.getReceiptNumber() : null)
                    .referenceNumber(lastPayment != null ? lastPayment.getReferenceNumber() : null)
                    .collectedBy(collectorName)
                    .build());
        }

        String currentStatus = "UP_TO_DATE";
        if (totalOutstanding.compareTo(BigDecimal.ZERO) > 0) {
            currentStatus = totalPaid.compareTo(BigDecimal.ZERO) > 0 ? "PARTIALLY_PAID" : "PENDING";
        }

        List<CollectionDTO.CycleOption> cycleOptions = allCycles.stream()
                .map(c -> CollectionDTO.CycleOption.builder()
                        .id(c.getId())
                        .collectionName(c.getCollectionName())
                        .monthlyAmount(c.getMonthlyAmount())
                        .startMonth(c.getStartMonth())
                        .startYear(c.getStartYear())
                        .endMonth(c.getEndMonth())
                        .endYear(c.getEndYear())
                        .status(c.getStatus())
                        .build())
                .collect(Collectors.toList());

        return CollectionDTO.MemberPaymentSummaryResponse.builder()
                .activeConfigId(targetConfig != null ? targetConfig.getId() : null)
                .collectionName(targetConfig != null ? targetConfig.getCollectionName() : "General Cycle")
                .cycleStatus(targetConfig != null ? targetConfig.getStatus() : "ACTIVE")
                .startMonth(targetConfig != null ? targetConfig.getStartMonth() : null)
                .startYear(targetConfig != null ? targetConfig.getStartYear() : null)
                .endMonth(targetConfig != null ? targetConfig.getEndMonth() : null)
                .endYear(targetConfig != null ? targetConfig.getEndYear() : null)
                .monthlyExpectedAmount(monthlyExpected)
                .totalExpected(totalExpected)
                .totalPaid(totalPaid)
                .totalOutstanding(totalOutstanding)
                .currentStatus(currentStatus)
                .cycles(cycleOptions)
                .payments(items)
                .build();
    }
}
