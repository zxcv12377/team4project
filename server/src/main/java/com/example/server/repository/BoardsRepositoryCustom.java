package com.example.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.server.dto.PagesRequestsDTO;
import com.example.server.entity.Boards;

public interface BoardsRepositoryCustom {
    Page<Boards> search(PagesRequestsDTO requestDTO, Pageable pageable);
}
