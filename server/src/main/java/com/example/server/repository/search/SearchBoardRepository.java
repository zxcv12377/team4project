package com.example.server.repository.search;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.server.entity.Board;

public interface SearchBoardRepository {

    Page<Object[]> list(String type, String keyword, Pageable pageable);

    Board findByBno(Long bno);

}
