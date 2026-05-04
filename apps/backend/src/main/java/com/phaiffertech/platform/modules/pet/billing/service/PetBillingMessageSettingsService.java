package com.phaiffertech.platform.modules.pet.billing.service;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.billing.domain.PetBillingMessageSettings;
import com.phaiffertech.platform.modules.pet.billing.dto.PetBillingMessageSettingsRequest;
import com.phaiffertech.platform.modules.pet.billing.dto.PetBillingMessageSettingsResponse;
import com.phaiffertech.platform.modules.pet.billing.dto.PetPreparedCustomerMessageResponse;
import com.phaiffertech.platform.modules.pet.billing.repository.PetBillingMessageSettingsRepository;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceResponse;
import com.phaiffertech.platform.modules.pet.invoice.service.PetInvoiceService;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import com.phaiffertech.platform.modules.pet.plan.repository.ClientPlanRepository;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetBillingMessageSettingsService {

    private static final String DEFAULT_PLAN_RENEWAL_TEMPLATE = """
            Hi {clientName}, {petName}'s plan "{planName}" has {remainingSessions} bath/use remaining.

            To renew, send PIX to {pixKey}.
            Billing contact: {billingDisplayName}.

            Reply here after payment so we can confirm the next cycle.
            """;
    private static final String DEFAULT_PET_READY_TEMPLATE = """
            Hi {clientName}, {petName} is ready for pickup.

            Thank you for choosing {billingDisplayName}. We will be waiting at reception.
            """;
    private static final String MANUAL_SEND_NOTE =
            "Message generated for manual review/copy. No external message provider or PIX gateway was invoked.";

    private final PetBillingMessageSettingsRepository settingsRepository;
    private final ClientPlanRepository clientPlanRepository;
    private final PetClientRepository petClientRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetAppointmentRepository petAppointmentRepository;
    private final PetInvoiceService petInvoiceService;

    public PetBillingMessageSettingsService(
            PetBillingMessageSettingsRepository settingsRepository,
            ClientPlanRepository clientPlanRepository,
            PetClientRepository petClientRepository,
            PetProfileRepository petProfileRepository,
            PetAppointmentRepository petAppointmentRepository,
            PetInvoiceService petInvoiceService
    ) {
        this.settingsRepository = settingsRepository;
        this.clientPlanRepository = clientPlanRepository;
        this.petClientRepository = petClientRepository;
        this.petProfileRepository = petProfileRepository;
        this.petAppointmentRepository = petAppointmentRepository;
        this.petInvoiceService = petInvoiceService;
    }

    @Transactional(readOnly = true)
    public PetBillingMessageSettingsResponse getCurrentTenantSettings() {
        return toResponse(resolveSettings(TenantContext.getRequiredTenantId()));
    }

    @Transactional
    public PetBillingMessageSettingsResponse updateCurrentTenantSettings(PetBillingMessageSettingsRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        PetBillingMessageSettings settings = settingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    PetBillingMessageSettings created = new PetBillingMessageSettings();
                    created.setTenantId(tenantId);
                    return created;
                });

        settings.setPixKey(normalizeOptional(request.pixKey()));
        settings.setBillingDisplayName(normalizeOptional(request.billingDisplayName()));
        settings.setPlanRenewalMessageTemplate(normalizeOptional(request.planRenewalMessageTemplate()));
        settings.setPetReadyMessageTemplate(normalizeOptional(request.petReadyMessageTemplate()));

        return toResponse(settingsRepository.save(settings));
    }

    @Transactional
    public PetPreparedCustomerMessageResponse preparePlanRenewalMessage(UUID planId) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        ClientPlan plan = clientPlanRepository.findByIdAndTenantId(planId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Client plan not found."));
        PetClient client = petClientRepository.findByIdAndTenantId(plan.getClientId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet client not found."));
        PetBillingMessageSettings settings = resolveSettings(tenantId);

        String clientName = resolveClientName(client);
        PetProfile pet = plan.getPetId() == null
                ? null
                : petProfileRepository.findByIdAndTenantId(plan.getPetId(), tenantId).orElse(null);
        String petName = pet == null ? "your pet" : pet.getName();
        Map<String, String> variables = Map.of(
                "clientName", clientName,
                "petName", petName,
                "planName", plan.getPlanName(),
                "remainingSessions", String.valueOf(plan.getRemainingSessions()),
                "pixKey", resolvePixKey(settings),
                "billingDisplayName", resolveBillingDisplayName(settings)
        );

        String template = settings.getPlanRenewalMessageTemplate() == null
                ? DEFAULT_PLAN_RENEWAL_TEMPLATE
                : settings.getPlanRenewalMessageTemplate();
        String message = applyTemplate(template, variables);
        String invoiceDescription = "Renovacao de plano PetFlow - " + plan.getPlanName();
        PetInvoiceResponse renewalInvoice = petInvoiceService.ensurePlanRenewalInvoice(plan.getId(), invoiceDescription);

        return new PetPreparedCustomerMessageResponse(
                "PLAN_RENEWAL_PIX_REMINDER",
                tenantId,
                client.getId(),
                clientName,
                client.getEmail(),
                client.getPhone(),
                pet == null ? null : pet.getId(),
                petName,
                plan.getId(),
                plan.getPlanName(),
                plan.getRemainingSessions(),
                null,
                "Plan renewal reminder",
                message,
                settings.getPixKey(),
                settings.getBillingDisplayName(),
                renewalInvoice.id(),
                renewalInvoice.status(),
                renewalInvoice.totalAmount(),
                renewalInvoice.outstandingAmount(),
                hasText(settings.getPixKey()),
                plan.getRemainingSessions() <= 1,
                MANUAL_SEND_NOTE
        );
    }

    @Transactional(readOnly = true)
    public PetPreparedCustomerMessageResponse preparePetReadyMessage(UUID appointmentId) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        PetAppointment appointment = petAppointmentRepository.findByIdAndTenantId(appointmentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));
        PetClient client = petClientRepository.findByIdAndTenantId(appointment.getClientId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet client not found."));
        PetProfile pet = petProfileRepository.findByIdAndTenantId(appointment.getPetId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found."));
        PetBillingMessageSettings settings = resolveSettings(tenantId);

        String clientName = resolveClientName(client);
        String petName = pet.getName();
        Map<String, String> variables = Map.of(
                "clientName", clientName,
                "petName", petName,
                "serviceName", appointment.getServiceName(),
                "billingDisplayName", resolveBillingDisplayName(settings),
                "pixKey", resolvePixKey(settings)
        );
        String template = settings.getPetReadyMessageTemplate() == null
                ? DEFAULT_PET_READY_TEMPLATE
                : settings.getPetReadyMessageTemplate();

        return new PetPreparedCustomerMessageResponse(
                "PET_READY_PICKUP",
                tenantId,
                client.getId(),
                clientName,
                client.getEmail(),
                client.getPhone(),
                pet.getId(),
                petName,
                null,
                null,
                null,
                appointment.getId(),
                "Pet ready for pickup",
                applyTemplate(template, variables),
                settings.getPixKey(),
                settings.getBillingDisplayName(),
                null,
                null,
                null,
                null,
                hasText(settings.getPixKey()),
                "COMPLETED".equalsIgnoreCase(appointment.getStatus()),
                MANUAL_SEND_NOTE
        );
    }

    private PetBillingMessageSettings resolveSettings(UUID tenantId) {
        return settingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    PetBillingMessageSettings defaults = new PetBillingMessageSettings();
                    defaults.setTenantId(tenantId);
                    return defaults;
                });
    }

    private PetBillingMessageSettingsResponse toResponse(PetBillingMessageSettings settings) {
        return new PetBillingMessageSettingsResponse(
                settings.getPixKey(),
                settings.getBillingDisplayName(),
                settings.getPlanRenewalMessageTemplate(),
                settings.getPetReadyMessageTemplate(),
                hasText(settings.getPixKey())
        );
    }

    private String applyTemplate(String template, Map<String, String> variables) {
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        return result.trim();
    }

    private String resolveClientName(PetClient client) {
        return hasText(client.getName()) ? client.getName().trim() : "there";
    }

    private String resolvePixKey(PetBillingMessageSettings settings) {
        return hasText(settings.getPixKey()) ? settings.getPixKey().trim() : "[PIX key not configured]";
    }

    private String resolveBillingDisplayName(PetBillingMessageSettings settings) {
        return hasText(settings.getBillingDisplayName()) ? settings.getBillingDisplayName().trim() : "the PetFlow team";
    }

    private String normalizeOptional(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
