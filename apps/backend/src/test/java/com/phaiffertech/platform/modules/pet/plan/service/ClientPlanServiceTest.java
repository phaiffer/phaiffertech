package com.phaiffertech.platform.modules.pet.plan.service;

import com.phaiffertech.platform.modules.pet.appointment.service.PetOperationalTriggerService;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.plan.domain.PlanTemplate;
import com.phaiffertech.platform.modules.pet.plan.dto.ClientPlanDtos;
import com.phaiffertech.platform.modules.pet.plan.repository.ClientPlanRepository;
import com.phaiffertech.platform.modules.pet.plan.repository.PlanTemplateRepository;
import com.phaiffertech.platform.modules.pet.plan.repository.PlanTemplateServiceRepository;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ClientPlanServiceTest {

    private final ClientPlanRepository clientPlanRepository = mock(ClientPlanRepository.class);
    private final PlanTemplateRepository planTemplateRepository = mock(PlanTemplateRepository.class);
    private final PlanTemplateServiceRepository planTemplateServiceRepository = mock(PlanTemplateServiceRepository.class);
    private final ClientPlanService service = new ClientPlanService(
            clientPlanRepository,
            planTemplateRepository,
            planTemplateServiceRepository,
            mock(PetProfileRepository.class),
            mock(PetOperationalTriggerService.class)
    );

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void findTemplatesReturnsEmptyPageWithoutActiveFilter() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);

        when(planTemplateRepository.findAllByTenantIdAndSearch(
                eq(tenantId),
                eq("%"),
                any(Pageable.class)
        )).thenReturn(Page.empty());

        PageResponseDto<ClientPlanDtos.PlanTemplateResponseDto> response =
                service.findTemplates(new PageRequestDto(0, 20, null, null, null), null);

        assertEquals(0, response.items().size());
        assertEquals(0, response.totalItems());
    }

    @Test
    void findTemplatesReturnsPageWhenTemplateHasNoLinkedServices() {
        UUID tenantId = UUID.randomUUID();
        UUID templateId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        PlanTemplate template = new PlanTemplate();
        ReflectionTestUtils.setField(template, "id", templateId);
        template.setTenantId(tenantId);
        template.setCommercialName("Banho 4x/mes");
        template.setDescription("Pacote mensal");
        template.setPrice(BigDecimal.valueOf(240));
        template.setValidityDays(30);
        template.setTotalSessions(4);
        template.setActive(true);

        when(planTemplateRepository.findAllByTenantIdAndActiveAndSearch(
                eq(tenantId),
                eq(true),
                eq("%"),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(template)));
        when(planTemplateServiceRepository.findAllByTenantIdAndPlanTemplateIdIn(eq(tenantId), eq(java.util.Set.of(templateId))))
                .thenReturn(List.of());

        PageResponseDto<ClientPlanDtos.PlanTemplateResponseDto> response =
                service.findTemplates(new PageRequestDto(0, 20, null, null, null), true);

        assertEquals(1, response.items().size());
        assertEquals(1, response.totalItems());
        assertEquals("Banho 4x/mes", response.items().get(0).commercialName());
        assertEquals(List.of(), response.items().get(0).serviceIds());
    }
}
