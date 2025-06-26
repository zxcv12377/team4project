package com.example.server.mapper;

import java.util.List;

import com.example.server.dto.BoardDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

public class BoradMapper {

    private static List<String> parseAttachments(String json) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return List.of(); // 실패 시 빈 리스트
        }
    }

    // DTO → Entity(게시글) | 작성,수정
    public static Board toEntity(BoardDTO dto, Member member) {
        return Board.builder()
                .bno(dto.getBno()) // 수정 시 사용
                .title(dto.getTitle())
                .content(dto.getContent())
                .member(member)
                .build();
    }

    // Entity → DTO(리스트 전용)
    public static BoardDTO toDTO(Board board, Long replyCount) {
        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .nickname(board.getMember().getNickname())
                .memberid(board.getMember().getId())
                .email(board.getMember().getEmail())
                .replyCount(replyCount)
                .attachments( // ✅ JSON 파싱 필요
                        board.getAttachmentsJson() != null
                                ? parseAttachments(board.getAttachmentsJson())
                                : List.of())
                .createdDate(board.getCreatedDate())
                .updatedDate(board.getUpdatedDate())
                .build();
    }

    // Entity→DTO 변환 (상세보기용)
    // content 포함됨
    public static BoardDTO toDetailDTO(Board board, Long replyCount) {
        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .nickname(board.getMember().getNickname())
                .memberid(board.getMember().getId())
                .email(board.getMember().getEmail())
                .replyCount(replyCount)
                .attachments(
                        board.getAttachmentsJson() != null
                                ? parseAttachments(board.getAttachmentsJson())
                                : List.of())
                .createdDate(board.getCreatedDate())
                .updatedDate(board.getUpdatedDate())
                .build();
    }

}
