package com.phaiffertech.platform.modules.pet.dashboard.service;

import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.dashboard.dto.PetDashboardSummaryResponse;
import com.phaiffertech.platform.modules.pet.invoice.repository.PetInvoiceRepository;
import com.phaiffertech.platform.modules.pet.medical.record.repository.PetMedicalRecordRepository;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.product.repository.PetProductRepository;
import com.phaiffertech.platform.modules.pet.servicecatalog.repository.PetServiceCatalogRepository;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardCountMetricDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardListItemDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSectionDto;
import com.phaiffertech.platform.shared.dashboard.dto.DashboardSummaryCardDto;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetDashboardService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final PetClientRepository clientRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetAppointmentRepository appointmentRepository;
    private final PetServiceCatalogRepository serviceCatalogRepository;
    private final PetProductRepository productRepository;
    private final PetInvoiceRepository invoiceRepository;
    private final PetMedicalRecordRepository medicalRecordRepository;

    public PetDashboardService(
            PetClientRepository clientRepository,
            PetProfileRepository petProfileRepository,
            PetAppointmentRepository appointmentRepository,
            PetServiceCatalogRepository serviceCatalogRepository,
            PetProductRepository productRepository,
            PetInvoiceRepository invoiceRepository,
            PetMedicalRecordRepository medicalRecordRepository
    ) {
        this.clientRepository = clientRepository;
        this.petProfileRepository = petProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.serviceCatalogRepository = serviceCatalogRepository;
        this.productRepository = productRepository;
        this.invoiceRepository = invoiceRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    @Transactional(readOnly = true)
    public PetDashboardSummaryResponse summary() {
        return summary(TenantContext.getRequiredTenantId());
    }

    @Transactional(readOnly = true)
    public PetDashboardSummaryResponse summary(UUID tenantId) {
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant startOfDay = today.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant endOfDay = today.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        long totalClients = clientRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long totalPets = petProfileRepository.countByTenantIdAndDeletedAtIsNull(tenantId);
        long appointmentsToday = appointmentRepository.countByTenantIdAndScheduledAtBetween(tenantId, startOfDay, endOfDay);
        long upcomingAppointments = appointmentRepository.countByTenantIdAndScheduledAtGreaterThanEqual(tenantId, now);
        long totalServices = serviceCatalogRepository.countByTenantId(tenantId);
        long lowStockProducts = productRepository.countByTenantIdAndStockQuantityLessThanEqual(tenantId, LOW_STOCK_THRESHOLD);
        long pendingInvoices = invoiceRepository.countByTenantIdAndStatusIn(
                tenantId,
                List.of("ISSUED", "PENDING", "OVERDUE")
        );

        return new PetDashboardSummaryResponse(
                totalClients,
                totalPets,
                appointmentsToday,
                upcomingAppointments,
                totalServices,
                lowStockProducts,
                pendingInvoices,
                List.of(
                        new DashboardSummaryCardDto("clients", "Clients", totalClients, null, "neutral", "/pet/clients"),
                        new DashboardSummaryCardDto("pets", "Pets", totalPets, null, "info", "/pet/pets"),
                        new DashboardSummaryCardDto("appointments-today", "Appointments Today", appointmentsToday, null, "ok", "/pet/appointments"),
                        new DashboardSummaryCardDto("upcoming-appointments", "Upcoming", upcomingAppointments, null, "info", "/pet/appointments"),
                        new DashboardSummaryCardDto("services", "Services", totalServices, null, "neutral", "/pet/services"),
                        new DashboardSummaryCardDto("low-stock-products", "Low Stock", lowStockProducts, null, "warn", "/pet/products"),
                        new DashboardSummaryCardDto("pending-invoices", "Pending Invoices", pendingInvoices, null, "alert", "/pet/invoices")
                ),
                List.of(
                        new DashboardSectionDto(
                                "pet-operations",
                                "Operations Queue",
                                "Short-term operational load across appointments, invoices and stock.",
                                List.of(),
                                List.of(
                                        new DashboardCountMetricDto("appointments-today", "Appointments Today", appointmentsToday),
                                        new DashboardCountMetricDto("upcoming-appointments", "Upcoming Appointments", upcomingAppointments),
                                        new DashboardCountMetricDto("pending-invoices", "Pending Invoices", pendingInvoices),
                                        new DashboardCountMetricDto("low-stock-products", "Low Stock Products", lowStockProducts)
                                ),
                                appointmentRepository.findTop5ByTenantIdAndScheduledAtGreaterThanEqualOrderByScheduledAtAsc(tenantId, now).stream()
                                        .map(appointment -> new DashboardListItemDto(
                                                appointment.getId().toString(),
                                                appointment.getServiceName(),
                                                appointment.getNotes(),
                                                appointment.getStatus(),
                                                appointment.getScheduledAt(),
                                                "/pet/appointments"
                                        ))
                                        .toList(),
                                List.of()
                        ),
                        new DashboardSectionDto(
                                "pet-medical",
                                "Recent Medical Records",
                                "Latest clinical notes registered inside the tenant medical workflow.",
                                List.of(),
                                List.of(),
                                medicalRecordRepository.findTop5ByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                                        .map(record -> new DashboardListItemDto(
                                                record.getId().toString(),
                                                truncate(record.getDescription(), 80),
                                                truncate(record.getDiagnosis(), 80),
                                                record.getTreatment() == null || record.getTreatment().isBlank() ? "OPEN" : "TREATED",
                                                record.getCreatedAt(),
                                                "/pet/medical-records"
                                        ))
                                        .toList(),
                                List.of()
                        )
                )
        );
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + "...";
    }
}
