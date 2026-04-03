package com.phaiffertech.platform.modules.pet.servicecatalog.dto;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PetServiceCatalogCreateRequest(
        @NotBlank String name,
        String description,
        @NotNull PetServiceCategory category,
        @NotNull Boolean active,
        @NotNull @DecimalMin("0.00") BigDecimal basePrice,
        @NotNull @Min(1) Integer durationMinutes,
        @NotNull Boolean commissionEligible,
        @NotNull Boolean allowInPlans,
        @NotNull Boolean allowStandaloneBooking
) {
}
