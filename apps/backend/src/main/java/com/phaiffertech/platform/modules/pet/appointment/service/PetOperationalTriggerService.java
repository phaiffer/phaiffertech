package com.phaiffertech.platform.modules.pet.appointment.service;

import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.billing.dto.PetPreparedCustomerMessageResponse;
import com.phaiffertech.platform.modules.pet.billing.service.PetBillingMessageSettingsService;
import com.phaiffertech.platform.modules.pet.plan.domain.ClientPlan;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Fires lightweight operational signals for key PetFlow events.
 *
 * <p>The first sale-safe implementation prepares controlled customer copy for
 * manual review/send. It intentionally does not call WhatsApp, SMS, e-mail, or
 * a PIX gateway from appointment completion.</p>
 */
@Service
public class PetOperationalTriggerService {

    private static final Logger log = LoggerFactory.getLogger(PetOperationalTriggerService.class);

    private final PetBillingMessageSettingsService messageSettingsService;

    public PetOperationalTriggerService(PetBillingMessageSettingsService messageSettingsService) {
        this.messageSettingsService = messageSettingsService;
    }

    public void preparePetReady(PetAppointment appointment) {
        log.info("[PetFlow] PET_READY trigger prepared - appointmentId={} petId={} tenantId={}",
                appointment.getId(), appointment.getPetId(), appointment.getTenantId());

        try {
            PetPreparedCustomerMessageResponse prepared =
                    messageSettingsService.preparePetReadyMessage(appointment.getId());
            log.info("[PetFlow] PET_READY manual message ready - appointmentId={} clientId={} eligible={}",
                    appointment.getId(), prepared.clientId(), prepared.eligible());
        } catch (Exception ex) {
            log.warn("[PetFlow] PET_READY message preparation failed - appointmentId={} error={}",
                    appointment.getId(), ex.getMessage());
        }
    }

    public void preparePlanLastUseReminder(ClientPlan plan, UUID tenantId) {
        log.info("[PetFlow] PLAN_LAST_USE trigger prepared - planId={} remainingSessions={} clientId={} tenantId={}",
                plan.getId(), plan.getRemainingSessions(), plan.getClientId(), tenantId);

        try {
            PetPreparedCustomerMessageResponse prepared =
                    messageSettingsService.preparePlanRenewalMessage(plan.getId());
            log.info("[PetFlow] PLAN_LAST_USE manual PIX reminder ready - planId={} clientId={} pixConfigured={} eligible={}",
                    plan.getId(), prepared.clientId(), prepared.pixConfigured(), prepared.eligible());
        } catch (Exception ex) {
            log.warn("[PetFlow] PLAN_LAST_USE message preparation failed - planId={} error={}",
                    plan.getId(), ex.getMessage());
        }
    }
}
