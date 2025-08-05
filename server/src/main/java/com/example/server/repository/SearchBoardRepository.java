package com.example.server.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SearchBoardRepository {
    Page<Object[]> getBoardList(String type, String keyword, Pageable pageable);

    Object[] getBoardRow(Long mno);

    Page<Object[]> getBoardListByChannel(Long channelId, String type, String keyword, Pageable pageable);
}
