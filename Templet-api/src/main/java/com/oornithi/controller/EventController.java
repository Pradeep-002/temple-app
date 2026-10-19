package com.oornithi.controller;

import com.oornithi.config.TenantContext;
import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.EventDTO;
import com.oornithi.entity.Event;
import com.oornithi.entity.EventExpense;
import com.oornithi.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Event>> createEvent(@Valid @RequestBody EventDTO.CreateEventRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        Event event = eventService.createEvent(sangamId, request);
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", event));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Event>> updateEvent(@PathVariable("id") UUID id,
                                                           @Valid @RequestBody EventDTO.UpdateEventRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        Event event = eventService.updateEvent(sangamId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", event));
    }

    @PostMapping("/expense")
    @PreAuthorize("hasAnyRole('SANGAM_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EventExpense>> addEventExpense(Authentication auth,
                                                                      @Valid @RequestBody EventDTO.CreateEventExpenseRequest request) {
        UUID sangamId = TenantContext.getCurrentTenant();
        String createdBy = auth.getName();
        EventExpense expense = eventService.addEventExpense(sangamId, createdBy, request);
        return ResponseEntity.ok(ApiResponse.success("Event expense added & ledger updated", expense));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventDTO.EventSummaryResponse>>> getEvents() {
        UUID sangamId = TenantContext.getCurrentTenant();
        List<EventDTO.EventSummaryResponse> events = eventService.getSangamEvents(sangamId);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventDTO.EventSummaryResponse>> getEventSummary(@PathVariable("id") UUID id) {
        UUID sangamId = TenantContext.getCurrentTenant();
        EventDTO.EventSummaryResponse summary = eventService.getEventSummary(sangamId, id);
        return ResponseEntity.ok(ApiResponse.success("Event summary retrieved", summary));
    }
}
