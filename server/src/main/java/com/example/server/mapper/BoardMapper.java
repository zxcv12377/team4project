package com.example.server.mapper;

import java.time.LocalDateTime;
import java.util.List;

import com.example.server.dto.BoardDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

public class BoardMapper {

    // JSON 문자열 → List<String> 변환 (첨부파일용)
    private static List<String> parseAttachments(String json) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return List.of(); // 실패 시 빈 리스트 반환
        }
    }

    // List<String> → JSON 문자열 변환 (첨부파일 저장용)
    private static String toJson(List<String> attachments) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.writeValueAsString(attachments);
        } catch (Exception e) {
            return null;
        }
    }

    // DTO → Entity(게시글) | 작성,수정 시에 DB 저장용
    public static Board toEntity(BoardDTO dto, Member member) {
        return Board.builder()
                .bno(dto.getBno())
                .title(dto.getTitle())
                .content(dto.getContent())
                .attachmentsJson(toJson(dto.getAttachments()))
                .member(member)
                .build();
    }

    // Entity → DTO (리스트 전용: 목록 조회 시 사용)
    public static BoardDTO toDTO(Board board, Long replyCount) {
        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .nickname(board.getMember().getNickname())
                .replyCount(replyCount)
                .attachments(board.getAttachmentsJson() != null
                        ? parseAttachments(board.getAttachmentsJson())
                        : List.of())
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
                .attachments(board.getAttachmentsJson() != null
                        ? parseAttachments(board.getAttachmentsJson())
                        : List.of())
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
