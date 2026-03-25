package com.phaiffertech.platform.modules.pet.appointment.service;

import com.phaiffertech.platform.core.notification.dto.MailMessage;
import com.phaiffertech.platform.core.notification.service.MailDeliveryService;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Fires lightweight operational signals for key PetFlow events.
 *
 * <p>Currently logs all triggers at INFO level and delivers e-mail via the
 * configured {@link MailDeliveryService}. No external provider is required —
 * {@link com.phaiffertech.platform.core.notification.service.SmtpMailDeliveryService}
 * handles delivery transparently.</p>
 *
 * <p>TODO: Phase 27 — add push / SMS provider adapters behind the same interface.</p>
 */
@Service
public class PetOperationalTriggerService {

    private static final Logger log = LoggerFactory.getLogger(PetOperationalTriggerService.class);

    private final MailDeliveryService mailDeliveryService;

    public PetOperationalTriggerService(MailDeliveryService mailDeliveryService) {
        this.mailDeliveryService = mailDeliveryService;
    }

    /**
     * Fires a "pet ready for pickup" signal when an appointment is marked COMPLETED.
     *
     * @param appointment the completed appointment
     * @param clientEmail the client's e-mail address (may be null — trigger is skipped)
     * @param clientName  display name for the client
     */
    public void firePetReady(PetAppointment appointment, String clientEmail, String clientName) {
        log.info("[PetFlow] PET_READY trigger — appointmentId={} petId={} tenantId={}",
                appointment.getId(), appointment.getPetId(), appointment.getTenantId());

        if (clientEmail == null || clientEmail.isBlank()) {
            log.info("[PetFlow] PET_READY skipped — no client e-mail on appointmentId={}", appointment.getId());
            return;
        }

        String subject = "Your pet is ready for pickup!";
        String body = String.format(
                "Hi %s,%n%nGreat news — the service for your pet has been completed and they are ready for pickup.%n%nThank you for choosing us!",
                clientName != null ? clientName : "there"
        );

        try {
            mailDeliveryService.send(new MailMessage(clientEmail, subject, body));
            log.info("[PetFlow] PET_READY e-mail sent to={} appointmentId={}", clientEmail, appointment.getId());
        } catch (Exception ex) {
            // Non-critical — log and continue; appointment completion must not be blocked.
            log.warn("[PetFlow] PET_READY e-mail failed to={} appointmentId={} error={}",
                    clientEmail, appointment.getId(), ex.getMessage());
        }
    }

    /**
     * Fires a "plan near end" signal when a client plan reaches 2 remaining sessions.
     *
     * @param plan        the client plan that is running low
     * @param clientEmail the client's e-mail address (may be null — trigger is skipped)
     * @param clientName  display name for the client
     * @param tenantId    the tenant context (for structured logging)
     */
    public void firePlanNearEnd(ClientPlan plan, String clientEmail, String clientName, UUID tenantId) {
        log.info("[PetFlow] PLAN_NEAR_END trigger — planId={} remainingSessions={} clientId={} tenantId={}",
                plan.getId(), plan.getRemainingSessions(), plan.getClientId(), tenantId);

        if (clientEmail == null || clientEmail.isBlank()) {
            log.info("[PetFlow] PLAN_NEAR_END skipped — no client e-mail on planId={}", plan.getId());
            return;
        }

        String subject = "Your session plan is almost out — only " + plan.getRemainingSessions() + " session(s) left";
        String body = String.format(
                "Hi %s,%n%nYour plan \"%s\" has only %d session(s) remaining.%n%nContact us to renew before it runs out!",
                clientName != null ? clientName : "there",
                plan.getPlanName(),
                plan.getRemainingSessions()
        );

        try {
            mailDeliveryService.send(new MailMessage(clientEmail, subject, body));
            log.info("[PetFlow] PLAN_NEAR_END e-mail sent to={} planId={}", clientEmail, plan.getId());
        } catch (Exception ex) {
            log.warn("[PetFlow] PLAN_NEAR_END e-mail failed to={} planId={} error={}",
                    clientEmail, plan.getId(), ex.getMessage());
        }
    }
}
