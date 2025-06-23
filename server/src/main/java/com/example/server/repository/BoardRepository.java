package com.example.server.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.server.entity.Board;
import com.example.server.entity.Member;

import jakarta.transaction.Transactional;

public interface BoardRepository extends JpaRepository<Board, Long>, SearchBoardRepository {

   void deleteAllByMember(Member member);

}
