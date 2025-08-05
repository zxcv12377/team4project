package com.example.server.repository;

import com.example.server.entity.Board;
import com.example.server.entity.BoardViewLog;
import com.example.server.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardViewLogRepository extends JpaRepository<BoardViewLog, Long> {
    boolean existsByBoardAndMember(Board board, Member member);
}
