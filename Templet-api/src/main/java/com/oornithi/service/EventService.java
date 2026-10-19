package com.oornithi.service;

import com.oornithi.dto.EventDTO;
import com.oornithi.entity.Event;
import com.oornithi.entity.EventExpense;
import com.oornithi.repository.EventExpenseRepository;
import com.oornithi.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final EventExpenseRepository eventExpenseRepository;
    private final LedgerService ledgerService;

    public EventService(EventRepository eventRepository,
                        EventExpenseRepository eventExpenseRepository,
                        LedgerService ledgerService) {
        this.eventRepository = eventRepository;
        this.eventExpenseRepository = eventExpenseRepository;
        this.ledgerService = ledgerService;
    }

    @Transactional
    public Event createEvent(UUID sangamId, EventDTO.CreateEventRequest request) {
        Event event = Event.builder()
                .sangamId(sangamId)
                .eventName(request.getEventName())
                .tamilEventName(request.getTamilEventName())
                .templeName(request.getTempleName())
                .eventType(request.getEventType() != null ? request.getEventType() : "TEMPLE_FESTIVAL")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .location(request.getLocation())
                .description(request.getDescription())
                .expectedBudget(request.getExpectedBudget() != null ? request.getExpectedBudget() : BigDecimal.ZERO)
                .status("UPCOMING")
                .build();

        return eventRepository.save(event);
    }

    @Transactional
    public Event updateEvent(UUID sangamId, UUID eventId, EventDTO.UpdateEventRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (sangamId != null && !event.getSangamId().equals(sangamId)) {
            throw new RuntimeException("Unauthorized event access");
        }

        event.setEventName(request.getEventName());
        event.setTamilEventName(request.getTamilEventName());
        if (request.getTempleName() != null) {
            event.setTempleName(request.getTempleName());
        }
        if (request.getEventType() != null) {
            event.setEventType(request.getEventType());
        }
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setLocation(request.getLocation());
        event.setDescription(request.getDescription());
        if (request.getExpectedBudget() != null) {
            event.setExpectedBudget(request.getExpectedBudget());
        }
        if (request.getStatus() != null) {
            event.setStatus(request.getStatus());
        }

        return eventRepository.save(event);
    }

    @Transactional
    public EventExpense addEventExpense(UUID sangamId, String createdBy, EventDTO.CreateEventExpenseRequest request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (sangamId != null && !event.getSangamId().equals(sangamId)) {
            throw new RuntimeException("Unauthorized event access");
        }

        EventExpense expense = EventExpense.builder()
                .sangamId(sangamId)
                .eventId(request.getEventId())
                .expenseCategory(request.getExpenseCategory())
                .description(request.getDescription())
                .amount(request.getAmount())
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .vendorName(request.getVendorName())
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "CASH")
                .referenceNumber(request.getReferenceNumber())
                .remarks(request.getRemarks())
                .build();

        expense = eventExpenseRepository.save(expense);

        // Record Debit in Ledger
        String desc = "Event Expense (" + event.getEventName() + ") - " + request.getExpenseCategory();
        ledgerService.recordDebit(sangamId, "EVENT_EXPENSE", expense.getId(), request.getAmount(), desc, createdBy);

        return expense;
    }

    public List<EventDTO.EventSummaryResponse> getSangamEvents(UUID sangamId) {
        return eventRepository.findBySangamId(sangamId).stream()
                .map(event -> getEventSummary(sangamId, event.getId()))
                .collect(Collectors.toList());
    }

    public EventDTO.EventSummaryResponse getEventSummary(UUID sangamId, UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!event.getSangamId().equals(sangamId)) {
            throw new RuntimeException("Unauthorized event access");
        }

        List<EventExpense> expenses = eventExpenseRepository.findBySangamIdAndEventId(sangamId, eventId);
        BigDecimal totalExpenses = expenses.stream()
                .map(EventExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal budget = event.getExpectedBudget() != null ? event.getExpectedBudget() : BigDecimal.ZERO;
        BigDecimal remainingBudget = budget.subtract(totalExpenses);

        List<EventDTO.EventExpenseResponse> expenseDTOs = expenses.stream()
                .map(e -> EventDTO.EventExpenseResponse.builder()
                        .id(e.getId())
                        .eventId(e.getEventId())
                        .expenseCategory(e.getExpenseCategory())
                        .description(e.getDescription())
                        .amount(e.getAmount())
                        .expenseDate(e.getExpenseDate())
                        .vendorName(e.getVendorName())
                        .paymentMode(e.getPaymentMode())
                        .referenceNumber(e.getReferenceNumber())
                        .remarks(e.getRemarks())
                        .receiptUrl(e.getReceiptUrl())
                        .build())
                .collect(Collectors.toList());

        return EventDTO.EventSummaryResponse.builder()
                .id(event.getId())
                .eventName(event.getEventName())
                .tamilEventName(event.getTamilEventName())
                .templeName(event.getTempleName())
                .eventType(event.getEventType())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .location(event.getLocation())
                .description(event.getDescription())
                .expectedBudget(budget)
                .totalExpenses(totalExpenses)
                .remainingBudget(remainingBudget)
                .status(event.getStatus())
                .expenses(expenseDTOs)
                .build();
    }
}
