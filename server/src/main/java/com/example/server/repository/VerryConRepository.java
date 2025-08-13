package com.example.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.VerryCon;
import com.example.server.entity.VerryconCategory;

public interface VerryConRepository extends JpaRepository<VerryCon, Long> {
    List<VerryCon> findByVerryconCategory(VerryconCategory verryconCategory);
}
