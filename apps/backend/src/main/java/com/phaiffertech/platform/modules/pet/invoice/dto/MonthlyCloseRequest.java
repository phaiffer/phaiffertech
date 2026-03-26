package com.phaiffertech.platform.modules.pet.invoice.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record MonthlyCloseRequest(
        @NotNull UUID clientId,
        @NotNull LocalDate periodStart,
        @NotNull LocalDate periodEnd
) {
}
