package com.phaiffertech.platform.core.notification.dto;

public record NotificationAlertItemDto(
        String key,
        String type,
        String title,
        String description,
        String href
) {
}
