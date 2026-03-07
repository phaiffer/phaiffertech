package com.phaiffertech.platform.modules.pet.capability;

import com.phaiffertech.platform.core.module.domain.PlatformModule;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.invoice.repository.PetInvoiceRepository;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.shared.contracts.module.ModuleMetricView;
import com.phaiffertech.platform.shared.contracts.module.ModuleSummaryView;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PetDashboardCapabilityService implements PetDashboardCapability {

    private final PetClientRepository petClientRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetAppointmentRepository petAppointmentRepository;
    private final PetInvoiceRepository petInvoiceRepository;

    public PetDashboardCapabilityService(
            PetClientRepository petClientRepository,
            PetProfileRepository petProfileRepository,
            PetAppointmentRepository petAppointmentRepository,
            PetInvoiceRepository petInvoiceRepository
    ) {
        this.petClientRepository = petClientRepository;
        this.petProfileRepository = petProfileRepository;
        this.petAppointmentRepository = petAppointmentRepository;
        this.petInvoiceRepository = petInvoiceRepository;
    }

    @Override
    public String moduleCode() {
        return PlatformModule.PET.getCode();
    }

    @Override
    public ModuleSummaryView summarize(UUID tenantId) {
        return new ModuleSummaryView(
                moduleCode(),
                "Pet",
                "Clients, pets, appointments and commercial flows.",
                "/pet",
                List.of(
                        new ModuleMetricView("clients", "Clients", petClientRepository.countByTenantIdAndDeletedAtIsNull(tenantId)),
                        new ModuleMetricView("pets", "Pets", petProfileRepository.countByTenantIdAndDeletedAtIsNull(tenantId)),
                        new ModuleMetricView("appointments", "Appointments", petAppointmentRepository.countByTenantIdAndDeletedAtIsNull(tenantId)),
                        new ModuleMetricView("invoices", "Invoices", petInvoiceRepository.countByTenantIdAndDeletedAtIsNull(tenantId))
                )
        );
    }
}
