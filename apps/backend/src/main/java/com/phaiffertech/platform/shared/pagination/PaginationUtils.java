package com.phaiffertech.platform.shared.pagination;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PaginationUtils {

    private PaginationUtils() {
    }

    public static Pageable toPageable(PageRequestDto request, Sort defaultSort) {
        Sort sort = resolveSort(request, defaultSort);
        int page = request == null ? 0 : request.resolvedPage();
        int size = request == null ? 20 : request.resolvedSize();

        return PageRequest.of(page, size, sort);
    }

    public static <T> PageResponseDto<T> fromPage(Page<T> page) {
        return PageMapper.toResponse(page);
    }

    private static Sort resolveSort(PageRequestDto request, Sort defaultSort) {
        if (request == null || request.normalizedSort() == null) {
            return defaultSort;
        }

        String sortValue = request.normalizedSort();
        String[] tokens = sortValue.split(",");
        if (tokens.length == 0 || tokens[0].isBlank()) {
            return defaultSort;
        }

        String property = tokens[0].trim();
        String direction = tokens.length > 1 ? tokens[1].trim() : request.normalizedDirection();
        Sort.Direction parsedDirection = parseDirection(direction);

        return Sort.by(parsedDirection, property);
    }

    private static Sort.Direction parseDirection(String directionValue) {
        if ("desc".equalsIgnoreCase(directionValue)) {
            return Sort.Direction.DESC;
        }
        return Sort.Direction.ASC;
    }
}
