package com.example.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.server.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long>, SearchBoardRepository {

    // Page<Object[]> getTotalList(String type, String keyword, Pageable pageable);

    // List<Object[]> getBoardRow(Long mno);
}
