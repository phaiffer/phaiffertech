package com.phaiffertech.platform.shared.crud;

import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record BasePageQuery(Pageable pageable, String search) {

    public static BasePageQuery of(PageRequestDto request, Sort defaultSort) {
        return new BasePageQuery(
                PaginationUtils.toPageable(request, defaultSort),
                request == null ? null : request.normalizedSearch()
        );
    }
}
