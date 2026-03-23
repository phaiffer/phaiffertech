package com.phaiffertech.platform.core.notification.dto;

import java.util.List;

public record NotificationSummaryResponse(
        List<NotificationAlertItemDto> items,
        long totalCount,
        long criticalCount
) {
}
