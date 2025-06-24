package com.example.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long>, SearchBoardRepository {

<<<<<<< HEAD
    // Page<Object[]> getTotalList(String type, String keyword, Pageable pageable);

    // List<Object[]> getBoardRow(Long mno);
=======
>>>>>>> 5d4c932bb78b4a0322dacbf8095237925e15e9b9
}
