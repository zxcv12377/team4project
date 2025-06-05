package com.example.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.server.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long> {

    @Query("SELECT b, m, COUNT(r) FROM Board b LEFT JOIN b.member m LEFT JOIN Reply r ON r.board = b where (:type = 't' AND b.title LIKE %:keyword%) OR (:type = 'c' AND b.content LIKE %:keyword%) OR (:type = 'w' AND m.nickname LIKE %:keyword%) GROUP BY b")
    Page<Object[]> list(String type, String keyword, Pageable pageable);

}
