package com.phaiffertech.platform.shared.pagination;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record PageResponseDto<T>(
        List<T> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {

    @JsonProperty("content")
    public List<T> legacyContent() {
        return items;
    }

    @JsonProperty("totalElements")
    public long legacyTotalElements() {
        return totalItems;
    }
}
