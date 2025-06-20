package com.example.server.repository;

import com.example.server.entity.Server;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerRepository extends JpaRepository<Server, Long> {
    List<Server> findByNameContainingIgnoreCase(String keyword);
}
