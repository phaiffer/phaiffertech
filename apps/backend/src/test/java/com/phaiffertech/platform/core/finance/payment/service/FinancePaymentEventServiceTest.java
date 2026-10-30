package com.phaiffertech.platform.core.finance.payment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phaiffertech.platform.core.finance.payment.domain.FinancePaymentEvent;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentEventStatus;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentEventType;
import com.phaiffertech.platform.core.finance.payment.domain.PaymentProviderType;
import com.phaiffertech.platform.core.finance.payment.dto.FinancePaymentEventResponse;
import com.phaiffertech.platform.core.finance.payment.repository.FinancePaymentEventRepository;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FinancePaymentEventServiceTest {

    @Mock
    private FinancePaymentEventRepository repository;

    @Mock
    private UserRepository userRepository;

    private FinancePaymentEventService service;

    @BeforeEach
    void setUp() {
        service = new FinancePaymentEventService(repository, userRepository);
    }

    @Test
    void shouldRecordNewPaymentEventWhenIdempotencyKeyIsNotPresent() {
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        Instant occurredAt = Instant.parse("2026-10-20T15:00:00Z");

        when(repository.findByTenantIdAndProviderAndIdempotencyKeyAndDeletedAtIsNull(
                tenantId,
                PaymentProviderType.MANUAL,
                "manual:" + paymentId + ":PAYMENT_CONFIRMED"
        )).thenReturn(Optional.empty());

        when(repository.save(any(FinancePaymentEvent.class))).thenAnswer(invocation -> {
            FinancePaymentEvent event = invocation.getArgument(0);
            ReflectionTestUtils.setField(event, "id", UUID.randomUUID());
            return event;
        });

        FinancePaymentEvent saved = service.recordEvent(
                tenantId,
                new FinancePaymentEventRecordCommand(
                        invoiceId,
                        paymentId,
                        PaymentProviderType.MANUAL,
                        PaymentEventType.PAYMENT_CONFIRMED,
                        PaymentEventStatus.PROCESSED,
                        "manual:" + paymentId + ":PAYMENT_CONFIRMED",
                        occurredAt,
                        "Manual payment confirmed via PIX"
                )
        );

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getInvoiceId()).isEqualTo(invoiceId);
        assertThat(saved.getFinancePaymentId()).isEqualTo(paymentId);
        assertThat(saved.getProvider()).isEqualTo(PaymentProviderType.MANUAL);
        assertThat(saved.getEventType()).isEqualTo(PaymentEventType.PAYMENT_CONFIRMED);
        assertThat(saved.getEventStatus()).isEqualTo(PaymentEventStatus.PROCESSED);
        assertThat(saved.getSummary()).isEqualTo("Manual payment confirmed via PIX");
    }

    @Test
    void shouldReturnExistingEventWhenIdempotencyKeyMatches() {
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        FinancePaymentEvent existing = new FinancePaymentEvent();
        ReflectionTestUtils.setField(existing, "id", UUID.randomUUID());
        existing.setTenantId(tenantId);
        existing.setInvoiceId(invoiceId);
        existing.setProvider(PaymentProviderType.MANUAL);
        existing.setEventType(PaymentEventType.INVOICE_ISSUED);
        existing.setEventStatus(PaymentEventStatus.RECORDED);
        existing.setIdempotencyKey("invoice:" + invoiceId + ":ISSUED");
        existing.setSummary("Invoice issued");

        when(repository.findByTenantIdAndProviderAndIdempotencyKeyAndDeletedAtIsNull(
                tenantId,
                PaymentProviderType.MANUAL,
                "invoice:" + invoiceId + ":ISSUED"
        )).thenReturn(Optional.of(existing));

        FinancePaymentEvent result = service.recordEvent(
                tenantId,
                new FinancePaymentEventRecordCommand(
                        invoiceId,
                        null,
                        PaymentProviderType.MANUAL,
                        PaymentEventType.INVOICE_ISSUED,
                        PaymentEventStatus.RECORDED,
                        "invoice:" + invoiceId + ":ISSUED",
                        Instant.now(),
                        "Invoice issued"
                )
        );

        assertThat(result.getId()).isEqualTo(existing.getId());
        verify(repository, never()).save(any());
    }

    @Test
    void shouldListEventsByInvoiceOrderedDesc() {
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        FinancePaymentEvent event = new FinancePaymentEvent();
        ReflectionTestUtils.setField(event, "id", UUID.randomUUID());
        event.setTenantId(tenantId);
        event.setInvoiceId(invoiceId);
        event.setProvider(PaymentProviderType.MANUAL);
        event.setEventType(PaymentEventType.INVOICE_CREATED);
        event.setEventStatus(PaymentEventStatus.RECORDED);
        event.setOccurredAt(Instant.parse("2026-10-20T14:00:00Z"));
        event.setSummary("Invoice created");

        when(repository.findAllByTenantIdAndInvoiceIdOrderByOccurredAtDescCreatedAtDesc(
                tenantId,
                invoiceId
        )).thenReturn(List.of(event));

        List<FinancePaymentEventResponse> responses = service.listByInvoice(tenantId, invoiceId);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).eventType()).isEqualTo("INVOICE_CREATED");
        assertThat(responses.get(0).provider()).isEqualTo("MANUAL");
        assertThat(responses.get(0).recordedByName()).isNull();
    }

    @Test
    void shouldResolveRecorderNameFromUserIdAndKeepSystemEventsAnonymous() {
        UUID tenantId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        FinancePaymentEvent manualEvent = eventCreatedBy(tenantId, invoiceId, userId.toString(), PaymentEventType.PAYMENT_CONFIRMED);
        FinancePaymentEvent systemEvent = eventCreatedBy(tenantId, invoiceId, "system", PaymentEventType.INVOICE_CREATED);
        User recorder = new User();
        ReflectionTestUtils.setField(recorder, "id", userId);
        recorder.setFullName("Recepcao Demo");

        when(repository.findAllByTenantIdAndInvoiceIdOrderByOccurredAtDescCreatedAtDesc(tenantId, invoiceId))
                .thenReturn(List.of(manualEvent, systemEvent));
        when(userRepository.findAllById(Set.of(userId))).thenReturn(List.of(recorder));

        List<FinancePaymentEventResponse> responses = service.listByInvoice(tenantId, invoiceId);

        assertThat(responses).extracting(FinancePaymentEventResponse::recordedByName)
                .containsExactly("Recepcao Demo", null);
    }

    private FinancePaymentEvent eventCreatedBy(UUID tenantId, UUID invoiceId, String createdBy, PaymentEventType type) {
        FinancePaymentEvent event = new FinancePaymentEvent();
        ReflectionTestUtils.setField(event, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(event, "createdBy", createdBy);
        event.setTenantId(tenantId);
        event.setInvoiceId(invoiceId);
        event.setProvider(PaymentProviderType.MANUAL);
        event.setEventType(type);
        event.setEventStatus(PaymentEventStatus.RECORDED);
        event.setOccurredAt(Instant.parse("2026-10-20T14:00:00Z"));
        event.setSummary(type.name());
        return event;
    }
}
