package com.phaiffertech.platform.core.messaging.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PlanRenewalDispatchRequest(
        @NotNull UUID planId
) {
}
