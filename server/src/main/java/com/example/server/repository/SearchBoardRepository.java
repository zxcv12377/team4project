package com.example.server.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SearchBoardRepository {
    Page<Object[]> getBoardList(String type, String keyword, Pageable pageable);

    Object[] getBoardRow(Long mno);
}
