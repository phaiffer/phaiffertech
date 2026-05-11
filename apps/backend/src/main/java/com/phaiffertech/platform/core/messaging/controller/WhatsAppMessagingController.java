package com.phaiffertech.platform.core.messaging.controller;

import com.phaiffertech.platform.core.messaging.dto.MessageDispatchResponse;
import com.phaiffertech.platform.core.messaging.dto.PetReadyDispatchRequest;
import com.phaiffertech.platform.core.messaging.dto.WhatsAppChannelConfigRequest;
import com.phaiffertech.platform.core.messaging.dto.WhatsAppChannelConfigResponse;
import com.phaiffertech.platform.core.messaging.service.MessageSenderService;
import com.phaiffertech.platform.core.messaging.service.MessageWebhookService;
import com.phaiffertech.platform.core.messaging.service.PetReadyMessageDispatchService;
import com.phaiffertech.platform.core.messaging.service.WhatsAppChannelConfigService;
import com.phaiffertech.platform.core.tenant.entitlement.TenantEntitlementKeys;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.RequirePermission;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages/whatsapp")
public class WhatsAppMessagingController {

    private final WhatsAppChannelConfigService configService;
    private final MessageSenderService messageSenderService;
    private final MessageWebhookService webhookService;
    private final PetReadyMessageDispatchService petReadyMessageDispatchService;

    public WhatsAppMessagingController(
            WhatsAppChannelConfigService configService,
            MessageSenderService messageSenderService,
            MessageWebhookService webhookService,
            PetReadyMessageDispatchService petReadyMessageDispatchService
    ) {
        this.configService = configService;
        this.messageSenderService = messageSenderService;
        this.webhookService = webhookService;
        this.petReadyMessageDispatchService = petReadyMessageDispatchService;
    }

    @GetMapping("/config")
    @RequirePermission(value = "pet.appointment.read", anyEntitlements = {TenantEntitlementKeys.PET_AESTHETICS})
    public ApiResponse<WhatsAppChannelConfigResponse> getConfig() {
        return ApiResponse.success(configService.getCurrentTenantConfig());
    }

    @PutMapping("/config")
    @RequirePermission(value = "pet.appointment.update", anyEntitlements = {TenantEntitlementKeys.PET_AESTHETICS})
    public ApiResponse<WhatsAppChannelConfigResponse> updateConfig(
            @Valid @RequestBody WhatsAppChannelConfigRequest request
    ) {
        return ApiResponse.success(configService.updateCurrentTenantConfig(request));
    }

    @PostMapping("/pet-ready")
    @RequirePermission(value = "pet.appointment.update", anyEntitlements = {TenantEntitlementKeys.PET_AESTHETICS})
    public ApiResponse<MessageDispatchResponse> dispatchPetReady(
            @Valid @RequestBody PetReadyDispatchRequest request
    ) {
        return ApiResponse.success(petReadyMessageDispatchService.dispatchPetReady(request.appointmentId()));
    }

    @GetMapping("/dispatches/{dispatchId}")
    @RequirePermission(value = "pet.appointment.read", anyEntitlements = {TenantEntitlementKeys.PET_AESTHETICS})
    public ApiResponse<MessageDispatchResponse> getDispatch(@PathVariable UUID dispatchId) {
        return ApiResponse.success(messageSenderService.getCurrentTenantDispatch(dispatchId));
    }

    @GetMapping("/webhook/{phoneNumberId}")
    public ResponseEntity<String> verifyWebhook(
            @PathVariable String phoneNumberId,
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String verifyToken,
            @RequestParam(name = "hub.challenge", required = false) String challenge
    ) {
        return webhookService.verifyWebhook(phoneNumberId, mode, verifyToken, challenge)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(403).body("Webhook verification failed."));
    }

    @PostMapping("/webhook/{phoneNumberId}")
    public ResponseEntity<Void> receiveWebhook(
            @PathVariable String phoneNumberId,
            @RequestBody String rawPayload
    ) {
        webhookService.receiveWhatsAppWebhook(phoneNumberId, rawPayload);
        return ResponseEntity.ok().build();
    }
}
