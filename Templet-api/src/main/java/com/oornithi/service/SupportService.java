package com.oornithi.service;

import com.oornithi.entity.SupportRequest;
import com.oornithi.repository.SupportRequestRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SupportService {

    private final SupportRequestRepository supportRequestRepository;

    public SupportService(SupportRequestRepository supportRequestRepository) {
        this.supportRequestRepository = supportRequestRepository;
    }

    public SupportRequest createPublicSupportRequest(SupportRequest request) {
        request.setStatus("OPEN");
        return supportRequestRepository.save(request);
    }

    public List<SupportRequest> getAllSupportRequests() {
        return supportRequestRepository.findAll();
    }

    public SupportRequest updateStatus(UUID requestId, String status) {
        SupportRequest req = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Support request not found"));
        req.setStatus(status);
        return supportRequestRepository.save(req);
    }
}
