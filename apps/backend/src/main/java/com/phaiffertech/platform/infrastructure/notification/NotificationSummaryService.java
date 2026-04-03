package com.phaiffertech.platform.infrastructure.notification;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoiceStatus;
import com.phaiffertech.platform.core.finance.repository.FinanceInvoiceRepository;
import com.phaiffertech.platform.core.inventory.repository.InventoryItemRepository;
import com.phaiffertech.platform.core.notification.dto.NotificationAlertItemDto;
import com.phaiffertech.platform.core.notification.dto.NotificationSummaryResponse;
import com.phaiffertech.platform.modules.crm.dashboard.repository.CrmDashboardRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationSummaryService {

    private final CrmDashboardRepository crmDashboardRepository;
    private final FinanceInvoiceRepository financeInvoiceRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public NotificationSummaryService(
            CrmDashboardRepository crmDashboardRepository,
            FinanceInvoiceRepository financeInvoiceRepository,
            InventoryItemRepository inventoryItemRepository
    ) {
        this.crmDashboardRepository = crmDashboardRepository;
        this.financeInvoiceRepository = financeInvoiceRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @Transactional(readOnly = true)
    public NotificationSummaryResponse summarize(UUID tenantId) {
        Instant now = Instant.now();
        List<NotificationAlertItemDto> items = new ArrayList<>();

        long overdueTasks = crmDashboardRepository.countOverdueTasks(tenantId, now);
        if (overdueTasks > 0) {
            items.add(new NotificationAlertItemDto(
                    "crm-overdue-tasks",
                    "WARNING",
                    overdueTasks + " overdue CRM task" + (overdueTasks == 1 ? "" : "s"),
                    "Follow-up items past their due date are holding back the commercial pipeline.",
                    "/crm/tasks"
            ));
        }

        long overdueInvoices = financeInvoiceRepository.countByTenantIdAndStatusInAndDueAtBefore(
                tenantId,
                List.of(FinanceInvoiceStatus.ISSUED),
                now
        );
        if (overdueInvoices > 0) {
            items.add(new NotificationAlertItemDto(
                    "finance-overdue-invoices",
                    "ALERT",
                    overdueInvoices + " overdue invoice" + (overdueInvoices == 1 ? "" : "s"),
                    "Issued invoices past their due date need payment follow-up.",
                    "/finance/invoices"
            ));
        }

        long lowStockItems = inventoryItemRepository.countLowStockItems(tenantId);
        if (lowStockItems > 0) {
            items.add(new NotificationAlertItemDto(
                    "inventory-low-stock",
                    "WARNING",
                    lowStockItems + " low-stock item" + (lowStockItems == 1 ? "" : "s"),
                    "Stock levels at or below the minimum threshold need replenishment planning.",
                    "/inventory"
            ));
        }

        long criticalCount = items.stream().filter(i -> "ALERT".equals(i.type())).count();
        return new NotificationSummaryResponse(items, items.size(), criticalCount);
    }
}
