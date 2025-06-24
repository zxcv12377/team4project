package com.example.server.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long>, SearchBoardRepository {
    // Page<Object[]> getTotalList(String type, String keyword, Pageable pageable);

    // List<Object[]> getBoardRow(Long mno);
}
