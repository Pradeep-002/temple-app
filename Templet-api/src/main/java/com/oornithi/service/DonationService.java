package com.oornithi.service;

import com.oornithi.dto.FinancialDTO;
import com.oornithi.entity.Donation;
import com.oornithi.repository.DonationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class DonationService {

    private final DonationRepository donationRepository;
    private final LedgerService ledgerService;

    public DonationService(DonationRepository donationRepository, LedgerService ledgerService) {
        this.donationRepository = donationRepository;
        this.ledgerService = ledgerService;
    }

    @Transactional
    public Donation createDonation(UUID sangamId, String createdBy, FinancialDTO.CreateDonationRequest request) {
        String receiptNo = "DON-" + System.currentTimeMillis();

        Donation donation = Donation.builder()
                .sangamId(sangamId)
                .eventId(request.getEventId())
                .donorName(request.getDonorName())
                .donorMobile(request.getDonorMobile())
                .donationPurpose(request.getDonationPurpose())
                .amount(request.getAmount())
                .donationDate(request.getDonationDate() != null ? request.getDonationDate() : LocalDate.now())
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "CASH")
                .referenceNumber(request.getReferenceNumber())
                .receiptNumber(receiptNo)
                .remarks(request.getRemarks())
                .build();

        donation = donationRepository.save(donation);

        // Record Credit in Ledger
        String desc = "Donation (" + request.getDonationPurpose() + ") - " + request.getDonorName();
        ledgerService.recordCredit(sangamId, "DONATION", donation.getId(), request.getAmount(), desc, createdBy);

        return donation;
    }

    public List<Donation> getSangamDonations(UUID sangamId) {
        return donationRepository.findBySangamId(sangamId);
    }
}
