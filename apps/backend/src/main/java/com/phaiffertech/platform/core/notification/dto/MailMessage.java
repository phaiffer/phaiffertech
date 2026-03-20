package com.phaiffertech.platform.core.notification.dto;

public record MailMessage(
        String to,
        String subject,
        String textBody
) {
}
