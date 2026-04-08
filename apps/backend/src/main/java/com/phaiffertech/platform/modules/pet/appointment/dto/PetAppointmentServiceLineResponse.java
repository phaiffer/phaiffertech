package com.phaiffertech.platform.modules.pet.appointment.dto;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCategory;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PetAppointmentServiceLineResponse(
        UUID id,
        UUID serviceId,
        String serviceName,
        PetServiceCategory serviceCategory,
        Integer durationMinutes,
        BigDecimal basePrice,
        UUID professionalId,
        String professionalName,
        Boolean commissionEligible,
        BigDecimal commissionRate,
        BigDecimal commissionAmount,
        List<PetAppointmentServiceLineInventoryResponse> expectedInventoryConsumptions,
        boolean active,
        boolean allowInPlans,
        boolean allowStandaloneBooking,
        int lineOrder,
        boolean primary,
        boolean missingFromCatalog
) {
}
