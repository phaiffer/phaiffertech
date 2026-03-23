package com.phaiffertech.platform.infrastructure.notification;

import com.phaiffertech.platform.core.notification.dto.NotificationSummaryResponse;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationSummaryController {

    private final NotificationSummaryService notificationSummaryService;

    public NotificationSummaryController(NotificationSummaryService notificationSummaryService) {
        this.notificationSummaryService = notificationSummaryService;
    }

    @GetMapping("/summary")
    public ApiResponse<NotificationSummaryResponse> summary() {
        return ApiResponse.success(
                notificationSummaryService.summarize(TenantContext.getRequiredTenantId())
        );
    }
}
