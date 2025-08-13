package com.example.server.repository;

import com.example.server.entity.Board;
import com.example.server.entity.BoardViewLog;
import com.example.server.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardViewLogRepository extends JpaRepository<BoardViewLog, Long> {
    boolean existsByBoardAndMember(Board board, Member member);

    @Modifying
    @Query("UPDATE BoardViewLog rl SET rl.member = NULL WHERE rl.member.id = :memberId")
    void setMemberToNullByMemberId(@Param("memberId") Long memberId);
}
