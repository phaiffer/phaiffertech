package com.phaiffertech.platform.modules.pet.billing.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PetReadyDispatchRequest(
        @NotNull UUID appointmentId
) {
}
