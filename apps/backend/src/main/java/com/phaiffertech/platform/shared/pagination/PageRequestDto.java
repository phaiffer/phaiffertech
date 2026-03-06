package com.phaiffertech.platform.shared.pagination;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record PageRequestDto(
        @Min(0) Integer page,
        @Min(1) @Max(200) Integer size,
        String sort,
        String direction,
        String search
) {
    public int resolvedPage() {
        return page == null ? 0 : page;
    }

    public int resolvedSize() {
        return size == null ? 20 : size;
    }

    public String normalizedSearch() {
        if (search == null) {
            return null;
        }

        String value = search.trim();
        return value.isEmpty() ? null : value;
    }

    public String normalizedSort() {
        return sort == null || sort.isBlank() ? null : sort.trim();
    }

    public String normalizedDirection() {
        return direction == null || direction.isBlank() ? null : direction.trim().toLowerCase();
    }
}
