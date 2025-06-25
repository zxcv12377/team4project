package com.example.server.dto;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PagesRequestsDTO {
    @Builder.Default
    private int page = 1;
    @Builder.Default
    private int size = 10;

    @Builder.Default
    private String sort = "DESC";

    // 검색
    private String type;
    private String keyword;

    // getPageable 메서드
    public Pageable getPageable(Sort sortObj) {
        // Spring Data PageRequest를 반환
        return PageRequest.of(
                page <= 0 ? 0 : page - 1,
                size,
                sortObj.isEmpty()
                        ? Sort.by("bno").descending()
                        : sortObj);
    }
}
