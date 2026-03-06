package com.phaiffertech.platform.shared.pagination;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PaginationUtils {

    private PaginationUtils() {
    }

    public static Pageable toPageable(PageRequestDto request, Sort defaultSort) {
        Sort sort = resolveSort(request == null ? null : request.sort(), defaultSort);
        int page = request == null ? 0 : request.resolvedPage();
        int size = request == null ? 20 : request.resolvedSize();

        return PageRequest.of(page, size, sort);
    }

    public static <T> PageResponseDto<T> fromPage(Page<T> page) {
        return new PageResponseDto<>(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }

    private static Sort resolveSort(String sortValue, Sort defaultSort) {
        if (sortValue == null || sortValue.isBlank()) {
            return defaultSort;
        }

        String[] tokens = sortValue.split(",");
        if (tokens.length == 0 || tokens[0].isBlank()) {
            return defaultSort;
        }

        String property = tokens[0].trim();
        String direction = tokens.length > 1 ? tokens[1].trim() : "asc";

        Sort.Direction parsedDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        return Sort.by(parsedDirection, property);
    }
}
