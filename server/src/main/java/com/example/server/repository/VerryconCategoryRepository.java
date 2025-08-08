package com.example.server.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.VerryconCategory;

public interface VerryconCategoryRepository extends JpaRepository<VerryconCategory, Long> {

    Optional<VerryconCategory> findByName(String name);

    Optional<VerryconCategory> findBySlug(String slug);
}
