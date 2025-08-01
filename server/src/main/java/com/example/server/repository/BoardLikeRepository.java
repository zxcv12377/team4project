package com.example.server.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.Board;
import com.example.server.entity.BoardLike;
import com.example.server.entity.Member;

public interface BoardLikeRepository extends JpaRepository<BoardLike, Long> {
    // 특정 게시글에 대해 특정 유저가 좋아요를 눌렀는지 확인
    Optional<BoardLike> findByBoardAndMember(Board board, Member member);

    // 해당 게시글의 총 좋아요 수
    Long countByBoard(Board board);

    // 로그인한 유저가 누른 모든 좋아요 목록
    List<BoardLike> findAllByMember(Member member);
}
