package com.example.server.dto;

import java.util.List;

import org.springframework.data.domain.Page;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagesResultDTO<T> {
    private List<T> content;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
    private boolean isFirst;
    private boolean isLast;

    public PagesResultDTO(Page<T> result) {
        this.content = result.getContent();
        this.page = result.getNumber();
        this.size = result.getSize();
        this.totalPages = result.getTotalPages();
        this.totalElements = result.getTotalElements();
        this.isFirst = result.isFirst();
        this.isLast = result.isLast();
    }
}
