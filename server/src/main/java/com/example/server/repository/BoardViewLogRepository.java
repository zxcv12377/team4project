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

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update BoardViewLog v set v.member = null where v.member.id = :memberId")
    int nullMemberByMemberId(@Param("memberId") Long memberId);
}
