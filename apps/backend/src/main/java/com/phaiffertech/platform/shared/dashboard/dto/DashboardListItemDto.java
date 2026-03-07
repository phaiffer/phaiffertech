package com.phaiffertech.platform.shared.dashboard.dto;

import java.time.Instant;

public record DashboardListItemDto(
        String id,
        String label,
        String sublabel,
        String status,
        Instant timestamp,
        String href
) {
}
