package com.example.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.Board;
import com.example.server.entity.Member;

public interface BoardRepository extends JpaRepository<Board, Long>, SearchBoardRepository {

    List<Board> findAllByMember(Member member);

    List<Board> findByChannelId(Long channelId);

}
