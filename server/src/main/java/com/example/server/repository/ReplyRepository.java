package com.example.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.Reply;

public interface ReplyRepository extends JpaRepository<Reply, Long> {

    @Modifying
    @Query("DELETE FROM Reply r WHERE r.board.bno = :bno")
    void deleteByBoardBno(@Param("bno") Long bno);

    List<Reply> findByBoardBnoAndParentIsNullOrderByCreatedDateAsc(Long bno);

    List<Reply> findAllByMember(Member member);

    // List<Reply> findByBnoAndLikeCountGreaterThanOrderByLikeCountDesc(Long bno,
    // int count);

    long countByBoard(Board board);

    @Query("SELECT r FROM Reply r LEFT JOIN r.likes l WHERE r.board.bno = :bno GROUP BY r ORDER BY COUNT(l) DESC")
    List<Reply> findTop3BestReplies(@Param("bno") Long bno);

    @Modifying
    @Query("UPDATE Reply r SET r.member = NULL WHERE r.member.id = :memberId")
    void setMemberToNullByMemberId(@Param("memberId") Long memberId);

    @Modifying
    @Query("UPDATE Reply r SET r.text = '삭제된 댓글입니다' WHERE r.deleted = true")
    void updateDeletedReplies();
}
