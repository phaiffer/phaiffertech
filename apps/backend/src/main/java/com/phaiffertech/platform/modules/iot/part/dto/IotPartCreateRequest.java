package com.phaiffertech.platform.modules.iot.part.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IotPartCreateRequest(
        @NotBlank String name,
        @NotBlank String sku,
        String category,
        String unitOfMeasure,
        @NotNull @Min(0) Integer currentQuantity,
        @Min(0) Integer minimumQuantity,
        @Min(0) Integer reorderPoint,
        String description
) {
}
