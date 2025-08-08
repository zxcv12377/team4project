package com.example.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.example.server.entity.Board;
import com.example.server.entity.Member;

import io.lettuce.core.dynamic.annotation.Param;

public interface BoardRepository extends JpaRepository<Board, Long>, SearchBoardRepository {

    List<Board> findAllByMember(Member member);

    List<Board> findByChannelId(Long channelId);

    List<Board> findByBoardLikeCount(Long boardLikeCount);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Board b set b.member.id = :ghostId where b.member.id = :memberId")
    int reassignAuthor(@Param("ghostId") Long ghostId, @Param("memberId") Long memberId);

}
