package com.example.server.repository;

import com.example.server.entity.BoardChannel;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardChannelRepository extends JpaRepository<BoardChannel, Long> {
    Optional<BoardChannel> findByName(String name);
}
