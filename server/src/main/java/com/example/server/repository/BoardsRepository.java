package com.example.server.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.server.entity.Boards;

public interface BoardsRepository extends JpaRepository<Boards, Long>, BoardsRepositoryCustom {

    @Query("SELECT b FROM Boards b JOIN FETCH b.member WHERE b.bno = :bno")
    Optional<Boards> findByIdWithMember(@Param("bno") Long bno);
}
