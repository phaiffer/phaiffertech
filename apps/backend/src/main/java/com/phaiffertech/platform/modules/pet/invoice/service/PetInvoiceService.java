package com.phaiffertech.platform.modules.pet.invoice.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.finance.domain.FinanceInvoice;
import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.core.finance.domain.FinancePayment;
import com.phaiffertech.platform.core.finance.domain.FinancePaymentMethod;
import com.phaiffertech.platform.core.finance.domain.FinancePaymentStatus;
import com.phaiffertech.platform.core.finance.domain.FinanceSourceModule;
import com.phaiffertech.platform.core.finance.service.FinanceInvoiceService;
import com.phaiffertech.platform.core.finance.service.FinanceInvoiceUpsertCommand;
import com.phaiffertech.platform.core.finance.service.FinancePaymentService;
import com.phaiffertech.platform.core.finance.service.FinancePaymentUpsertCommand;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.invoice.domain.PetInvoice;
import com.phaiffertech.platform.modules.pet.invoice.dto.MonthlyCloseRequest;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceCreateRequest;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoicePaymentCreateRequest;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoicePaymentResponse;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceResponse;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceUpdateRequest;
import com.phaiffertech.platform.modules.pet.invoice.repository.PetInvoiceRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetInvoiceService {

    private final PetInvoiceRepository repository;
    private final PetClientRepository petClientRepository;
    private final PetAppointmentRepository appointmentRepository;
    private final PetServiceCatalogRepository serviceCatalogRepository;
    private final FinanceInvoiceService financeInvoiceService;
    private final FinancePaymentService financePaymentService;

    public PetInvoiceService(
            PetInvoiceRepository repository,
            PetClientRepository petClientRepository,
            PetAppointmentRepository appointmentRepository,
            PetServiceCatalogRepository serviceCatalogRepository,
            FinanceInvoiceService financeInvoiceService,
            FinancePaymentService financePaymentService
    ) {
        this.repository = repository;
        this.petClientRepository = petClientRepository;
        this.appointmentRepository = appointmentRepository;
        this.serviceCatalogRepository = serviceCatalogRepository;
        this.financeInvoiceService = financeInvoiceService;
        this.financePaymentService = financePaymentService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_invoice")
    public PetInvoiceResponse create(PetInvoiceCreateRequest request) {
        UUID tenantId = currentTenantId();
        PetClient client = requireClient(tenantId, request.clientId());
        PetContextSelection contextSelection = resolveContext(tenantId, request.clientId(), request.appointmentId(), request.serviceId());
        FinanceInvoiceStatus requestedStatus = parseRequestedStatus(request.status());

        FinanceInvoice financeInvoice = financeInvoiceService.create(
                tenantId,
                new FinanceInvoiceUpsertCommand(
                        FinanceSourceModule.PET,
                        "PET.CLIENT",
                        client.getId(),
                        clientName(client),
                        contextSelection.referenceType(),
                        contextSelection.referenceId(),
                        request.description(),
                        toFinanceLifecycleStatus(requestedStatus),
                        null,
                        request.totalAmount(),
                        request.issuedAt(),
                        request.dueAt(),
                        null,
                        null,
                        null
                )
        );

        PetInvoice invoice = new PetInvoice();
        invoice.setTenantId(tenantId);
        invoice.setClientId(client.getId());
        invoice.setFinanceInvoiceId(financeInvoice.getId());
        repository.save(invoice);
        settleIfRequested(tenantId, financeInvoice, requestedStatus, request.issuedAt());
        return getById(invoice.getId());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetInvoiceResponse> list(
            PageRequestDto pageRequest,
            UUID clientId,
            String status
    ) {
        UUID tenantId = currentTenantId();
        FinanceInvoiceStatus requestedStatus = parseRequestedStatus(status);
        BasePageQuery query = new BasePageQuery(
                PaginationUtils.toPageableWithoutSort(pageRequest),
                normalizeListSearch(pageRequest, requestedStatus)
        );
        Page<PetInvoice> invoices = repository.findAllByTenantIdAndSearch(
                tenantId,
                clientId,
                requestedStatus,
                query.search(),
                query.pageable()
        );

        List<PetInvoice> content = invoices.getContent();
        Map<UUID, FinanceInvoice> financeInvoices = loadFinanceInvoices(tenantId, content);
        Map<UUID, List<FinancePayment>> paymentsByFinanceInvoiceId = loadPayments(tenantId, financeInvoices.keySet());
        Map<UUID, String> clientNames = loadClientNames(tenantId, content.stream().map(PetInvoice::getClientId).collect(Collectors.toSet()));

        return PaginationUtils.fromPage(invoices.map(invoice -> toResponse(
                invoice,
                requireFinanceInvoice(invoice, financeInvoices),
                clientNames.get(invoice.getClientId()),
                paymentsByFinanceInvoiceId.getOrDefault(invoice.getFinanceInvoiceId(), List.of())
        )));
    }

    @Transactional(readOnly = true)
    public PetInvoiceResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        PetInvoice invoice = getOrThrow(id, tenantId);
        FinanceInvoice financeInvoice = financeInvoiceService.getOrThrow(invoice.getFinanceInvoiceId(), tenantId);
        return toResponse(
                invoice,
                financeInvoice,
                resolveClientName(requireClient(tenantId, invoice.getClientId())),
                financePaymentService.getByInvoiceIds(tenantId, List.of(financeInvoice.getId()))
        );
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_invoice")
    public PetInvoiceResponse update(UUID id, PetInvoiceUpdateRequest request) {
        UUID tenantId = currentTenantId();
        PetInvoice invoice = getOrThrow(id, tenantId);
        PetClient client = requireClient(tenantId, request.clientId());
        PetContextSelection contextSelection = resolveContext(tenantId, request.clientId(), request.appointmentId(), request.serviceId());
        FinanceInvoiceStatus requestedStatus = parseRequestedStatus(request.status());

        FinanceInvoice financeInvoice = financeInvoiceService.update(
                tenantId,
                invoice.getFinanceInvoiceId(),
                new FinanceInvoiceUpsertCommand(
                        FinanceSourceModule.PET,
                        "PET.CLIENT",
                        client.getId(),
                        clientName(client),
                        contextSelection.referenceType(),
                        contextSelection.referenceId(),
                        request.description(),
                        toFinanceLifecycleStatus(requestedStatus),
                        null,
                        request.totalAmount(),
                        request.issuedAt(),
                        request.dueAt(),
                        null,
                        null,
                        null
                )
        );

        invoice.setClientId(client.getId());
        repository.save(invoice);
        settleIfRequested(tenantId, financeInvoice, requestedStatus, request.issuedAt());
        return getById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_invoice")
    public void delete(UUID id) {
        UUID tenantId = currentTenantId();
        PetInvoice invoice = getOrThrow(id, tenantId);
        financeInvoiceService.softDelete(tenantId, invoice.getFinanceInvoiceId());
        invoice.setDeletedAt(Instant.now());
        repository.save(invoice);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_invoice")
    public PetInvoiceResponse restore(UUID id) {
        UUID tenantId = currentTenantId();
        PetInvoice invoice = repository.findByIdIncludingDeleted(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet invoice not found."));
        financeInvoiceService.restore(tenantId, invoice.getFinanceInvoiceId());
        invoice.setDeletedAt(null);
        repository.save(invoice);
        return getById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_invoice_payment")
    public PetInvoicePaymentResponse createPayment(UUID id, PetInvoicePaymentCreateRequest request) {
        UUID tenantId = currentTenantId();
        PetInvoice invoice = getOrThrow(id, tenantId);
        FinancePayment payment = financePaymentService.create(
                tenantId,
                new FinancePaymentUpsertCommand(
                        invoice.getFinanceInvoiceId(),
                        FinancePaymentStatus.CONFIRMED,
                        request.method() == null || request.method().isBlank()
                                ? FinancePaymentMethod.MANUAL
                                : FinancePaymentMethod.valueOf(request.method().trim().toUpperCase()),
                        request.amount(),
                        request.receivedAt(),
                        request.referenceCode(),
                        request.notes()
                )
        );
        return toPaymentResponse(payment);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_invoice")
    public PetInvoiceResponse monthlyClose(MonthlyCloseRequest request) {
        UUID tenantId = currentTenantId();
        PetClient client = requireClient(tenantId, request.clientId());

        String periodLabel = YearMonth.from(request.periodStart()).toString();
        if (repository.countByClientAndPeriodDescription(tenantId, client.getId(), "%" + periodLabel + "%") > 0) {
            throw new ConflictOperationException(
                    "A monthly close invoice for period " + periodLabel + " already exists for this client."
            );
        }

        Instant scheduledFrom = request.periodStart().atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant scheduledTo = request.periodEnd().atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC).toInstant();

        List<PetAppointment> appointments = appointmentRepository.findAllByTenantIdAndSearch(
                tenantId,
                "COMPLETED",
                null,
                client.getId(),
                null,
                null,
                scheduledFrom,
                scheduledTo,
                "%",
                Pageable.unpaged()
        ).getContent();

        if (appointments.isEmpty()) {
            throw new ConflictOperationException(
                    "No completed appointments found for client " + clientName(client) + " in period " + periodLabel + "."
            );
        }

        BigDecimal totalAmount = appointments.stream()
                .map(appt -> {
                    BigDecimal extras = appt.getExtrasAmount() != null ? appt.getExtrasAmount() : BigDecimal.ZERO;
                    BigDecimal service = appt.isPlanSessionConsumed()
                            ? BigDecimal.ZERO
                            : (appt.getServicePrice() != null ? appt.getServicePrice() : BigDecimal.ZERO);
                    return service.add(extras);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        StringBuilder description = new StringBuilder("Fechamento Mensal ")
                .append(periodLabel)
                .append(" — ")
                .append(clientName(client));
        for (PetAppointment appt : appointments) {
            BigDecimal extras = appt.getExtrasAmount() != null ? appt.getExtrasAmount() : BigDecimal.ZERO;
            BigDecimal service = appt.isPlanSessionConsumed()
                    ? BigDecimal.ZERO
                    : (appt.getServicePrice() != null ? appt.getServicePrice() : BigDecimal.ZERO);
            description.append("\n• ").append(appt.getServiceName());
            if (appt.isPlanSessionConsumed()) {
                description.append(" (coberto pelo plano)");
            } else {
                description.append(" R$ ").append(service);
            }
            if (extras.compareTo(BigDecimal.ZERO) > 0) {
                description.append(" + extras R$ ").append(extras);
            }
        }

        FinanceInvoice financeInvoice = financeInvoiceService.create(
                tenantId,
                new FinanceInvoiceUpsertCommand(
                        FinanceSourceModule.PET,
                        "PET.CLIENT",
                        client.getId(),
                        clientName(client),
                        null,
                        null,
                        description.toString(),
                        FinanceInvoiceStatus.ISSUED,
                        null,
                        totalAmount,
                        Instant.now(),
                        null,
                        null,
                        null,
                        null
                )
        );

        PetInvoice invoice = new PetInvoice();
        invoice.setTenantId(tenantId);
        invoice.setClientId(client.getId());
        invoice.setFinanceInvoiceId(financeInvoice.getId());
        repository.save(invoice);
        return getById(invoice.getId());
    }

    private PetInvoice getOrThrow(UUID id, UUID tenantId) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet invoice not found."));
    }

    private PetClient requireClient(UUID tenantId, UUID clientId) {
        return petClientRepository.findByIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet client not found for tenant."));
    }

    private PetContextSelection resolveContext(UUID tenantId, UUID clientId, UUID appointmentId, UUID serviceId) {
        if (appointmentId != null && serviceId != null) {
            throw new IllegalArgumentException("Choose either appointmentId or serviceId as the invoice context.");
        }
        if (appointmentId != null) {
            PetAppointment appointment = appointmentRepository.findByIdAndTenantId(appointmentId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Pet appointment not found for tenant."));
            if (!appointment.getClientId().equals(clientId)) {
                throw new IllegalArgumentException("Invoice client must match the appointment client.");
            }
            return new PetContextSelection("PET.APPOINTMENT", appointment.getId());
        }
        if (serviceId != null) {
            PetServiceCatalog service = serviceCatalogRepository.findByIdAndTenantId(serviceId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Pet service not found for tenant."));
            return new PetContextSelection("PET.SERVICE", service.getId());
        }
        return new PetContextSelection(null, null);
    }

    private FinanceInvoiceStatus parseRequestedStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return FinanceInvoiceStatus.valueOf(value.trim().toUpperCase());
    }

    private FinanceInvoiceStatus toFinanceLifecycleStatus(FinanceInvoiceStatus requestedStatus) {
        if (FinanceInvoiceStatus.PAID.equals(requestedStatus)) {
            return FinanceInvoiceStatus.ISSUED;
        }
        return requestedStatus;
    }

    private String normalizeListSearch(PageRequestDto pageRequest, FinanceInvoiceStatus requestedStatus) {
        String normalizedSearch = pageRequest == null ? "%" : pageRequest.normalizedSearchPattern();
        if ("%".equals(normalizedSearch) || requestedStatus == null) {
            return normalizedSearch;
        }

        String compactSearch = normalizedSearch.replace("%", "");
        if (!compactSearch.isBlank() && requestedStatus.name().toLowerCase().contains(compactSearch)) {
            return "%";
        }
        return normalizedSearch;
    }

    private void settleIfRequested(
            UUID tenantId,
            FinanceInvoice financeInvoice,
            FinanceInvoiceStatus requestedStatus,
            Instant receivedAt
    ) {
        if (!FinanceInvoiceStatus.PAID.equals(requestedStatus)) {
            return;
        }

        BigDecimal totalAmount = financeInvoice.getTotalAmount() == null ? BigDecimal.ZERO : financeInvoice.getTotalAmount();
        BigDecimal paidAmount = financeInvoice.getPaidAmount() == null ? BigDecimal.ZERO : financeInvoice.getPaidAmount();
        BigDecimal outstandingAmount = totalAmount.subtract(paidAmount);
        if (outstandingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        financePaymentService.create(
                tenantId,
                new FinancePaymentUpsertCommand(
                        financeInvoice.getId(),
                        FinancePaymentStatus.CONFIRMED,
                        FinancePaymentMethod.MANUAL,
                        outstandingAmount,
                        receivedAt == null ? Instant.now() : receivedAt,
                        null,
                        "Settled automatically from Pet invoice lifecycle."
                )
        );
    }

    private Map<UUID, FinanceInvoice> loadFinanceInvoices(UUID tenantId, List<PetInvoice> invoices) {
        return financeInvoiceService.getAllByIds(
                tenantId,
                invoices.stream().map(PetInvoice::getFinanceInvoiceId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(FinanceInvoice::getId, Function.identity()));
    }

    private Map<UUID, List<FinancePayment>> loadPayments(UUID tenantId, Collection<UUID> financeInvoiceIds) {
        return financePaymentService.getByInvoiceIds(tenantId, financeInvoiceIds).stream()
                .collect(Collectors.groupingBy(FinancePayment::getInvoiceId));
    }

    private Map<UUID, String> loadClientNames(UUID tenantId, Collection<UUID> clientIds) {
        if (clientIds == null || clientIds.isEmpty()) {
            return Map.of();
        }
        return petClientRepository.findAllByTenantIdAndIdIn(tenantId, clientIds).stream()
                .collect(Collectors.toMap(PetClient::getId, this::resolveClientName));
    }

    private FinanceInvoice requireFinanceInvoice(PetInvoice invoice, Map<UUID, FinanceInvoice> financeInvoices) {
        FinanceInvoice financeInvoice = financeInvoices.get(invoice.getFinanceInvoiceId());
        if (financeInvoice == null) {
            throw new ResourceNotFoundException("Finance invoice not found for Pet invoice.");
        }
        return financeInvoice;
    }

    private PetInvoiceResponse toResponse(
            PetInvoice invoice,
            FinanceInvoice financeInvoice,
            String clientName,
            List<FinancePayment> payments
    ) {
        BigDecimal totalAmount = financeInvoice.getTotalAmount() == null ? BigDecimal.ZERO : financeInvoice.getTotalAmount();
        BigDecimal paidAmount = financeInvoice.getPaidAmount() == null ? BigDecimal.ZERO : financeInvoice.getPaidAmount();
        return new PetInvoiceResponse(
                invoice.getId(),
                financeInvoice.getId(),
                invoice.getClientId(),
                clientName,
                totalAmount,
                paidAmount,
                totalAmount.subtract(paidAmount),
                financeInvoice.getStatus().name(),
                financeInvoice.getDescription(),
                financeInvoice.getBusinessContextType(),
                financeInvoice.getBusinessContextId(),
                financeInvoice.getBusinessContextLabel(),
                financeInvoice.getIssuedAt(),
                financeInvoice.getDueAt(),
                financeInvoice.getPaidAt(),
                financeInvoice.getCanceledAt(),
                invoice.getCreatedAt(),
                invoice.getUpdatedAt(),
                payments.stream().map(this::toPaymentResponse).toList()
        );
    }

    private PetInvoicePaymentResponse toPaymentResponse(FinancePayment payment) {
        return new PetInvoicePaymentResponse(
                payment.getId(),
                payment.getStatus().name(),
                payment.getMethod().name(),
                payment.getAmount(),
                payment.getReceivedAt(),
                payment.getReferenceCode(),
                payment.getNotes(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }

    private String clientName(PetClient client) {
        return resolveClientName(client);
    }

    private String resolveClientName(PetClient client) {
        if (client == null) {
            return null;
        }
        if (client.getName() != null && !client.getName().isBlank()) {
            return client.getName();
        }
        return client.getFullName();
    }

    private UUID currentTenantId() {
        return TenantContext.getRequiredTenantId();
    }

    private record PetContextSelection(String referenceType, UUID referenceId) {
    }
}
