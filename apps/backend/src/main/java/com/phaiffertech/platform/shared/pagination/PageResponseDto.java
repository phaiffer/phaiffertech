package com.phaiffertech.platform.shared.pagination;

import java.util.List;

public record PageResponseDto<T>(
        List<T> content,
        long totalElements,
        int totalPages,
        int page,
        int size
) {
}
