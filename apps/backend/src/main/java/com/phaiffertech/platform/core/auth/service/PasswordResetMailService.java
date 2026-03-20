package com.phaiffertech.platform.core.auth.service;

import com.phaiffertech.platform.core.auth.config.PasswordResetProperties;
import com.phaiffertech.platform.core.notification.dto.MailMessage;
import com.phaiffertech.platform.core.notification.service.MailDeliveryService;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class PasswordResetMailService {

    private static final DateTimeFormatter EXPIRY_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'")
            .withLocale(Locale.ENGLISH)
            .withZone(ZoneId.of("UTC"));

    private final MailDeliveryService mailDeliveryService;
    private final PasswordResetProperties passwordResetProperties;

    public PasswordResetMailService(
            MailDeliveryService mailDeliveryService,
            PasswordResetProperties passwordResetProperties
    ) {
        this.mailDeliveryService = mailDeliveryService;
        this.passwordResetProperties = passwordResetProperties;
    }

    public void sendResetLink(Tenant tenant, String recipientEmail, String rawToken, Instant expiresAt) {
        String resetUrl = UriComponentsBuilder.fromUriString(passwordResetProperties.getResetUrlBase())
                .queryParam("token", rawToken)
                .build(true)
                .toUriString();

        String body = """
                PhaifferTech Platform password reset

                Tenant: %s (%s)

                We received a request to reset the password for this workspace access.
                Use the link below to set a new password:

                %s

                This link expires at %s.

                If you did not request this change, you can ignore this message.
                """
                .formatted(
                        tenant.getName(),
                        tenant.getCode(),
                        resetUrl,
                        EXPIRY_FORMATTER.format(expiresAt)
                );

        mailDeliveryService.send(new MailMessage(
                recipientEmail,
                "PhaifferTech Platform password reset",
                body
        ));
    }
}
