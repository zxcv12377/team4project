package com.example.server.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.Board;

public interface BoardRepository extends JpaRepository<Board, Long> {

}
