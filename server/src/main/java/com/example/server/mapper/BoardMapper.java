package com.example.server.mapper;

import java.time.LocalDateTime;
import java.util.List;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.ImageDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class BoardMapper {

    // DTO → Entity(게시글) | 작성,수정 시에 DB 저장용
    public static Board toEntity(BoardDTO dto, Member member) {
        String attachmentsJson = null;
        try {
            if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
                attachmentsJson = new ObjectMapper().writeValueAsString(dto.getAttachments());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return Board.builder()
                .bno(dto.getBno())
                .title(dto.getTitle())
                .content(dto.getContent())
                .member(member)
                .attachments(attachmentsJson)
                .build();
    }

    // Entity → DTO (리스트 전용: 목록 조회 시 사용)
    public static BoardDTO toDTO(Board board, Long replyCount) {
        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .nickname(board.getMember().getNickname())
                .replyCount(replyCount)
                .createdDate(board.getCreatedDate())
                .build();
    }

    // Entity → DTO (상세보기 전용)
    public static BoardDTO toDetailDTO(Board board, Long replyCount) {
        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .nickname(board.getMember().getNickname())
                .memberid(board.getMember().getId())
                .replyCount(replyCount)
                .createdDate(board.getCreatedDate())
                .updatedDate(board.getUpdatedDate())
                .build();
    }

    // Object[] → DTO (SearchBoardRepositoryImpl 전용: 직접 SELECT한 튜플에서 변환)
    public static BoardDTO fromTuple(Object[] arr) {
        return BoardDTO.builder()
                .bno((Long) arr[0])
                .title((String) arr[1])
                .nickname((String) arr[6])
                .replyCount((Long) arr[8])
                .createdDate((LocalDateTime) arr[3])
                .build();
    }
}
