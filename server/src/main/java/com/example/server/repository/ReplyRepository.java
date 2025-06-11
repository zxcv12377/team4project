package com.example.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.example.server.entity.Board;
import com.example.server.entity.Reply;

public interface ReplyRepository extends JpaRepository<Reply, Long> {

    @Modifying
    @Query("DELETE FROM Reply r WHERE r.board.bno =:bno")
    void deleteByBoardBno(Long bno);

    // 게시글에 속한 최상위 댓글(부모 없음)만 조회, 생성일 오름차순
    List<Reply> findByBoardBnoAndParentIsNullOrderByCreatedDateAsc(Long bno);

}
