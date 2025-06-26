package com.example.server.mapper;

import com.example.server.dto.BoardDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;

public class BoradMapper {

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
                .id(board.getMember().getId())
                .email(board.getMember().getEmail())
                .replyCount(replyCount)
                .regDate(board.getCreatedDate())
                .modDate(board.getUpdatedDate())
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
                .id(board.getMember().getId())
                .email(board.getMember().getEmail())
                .replyCount(replyCount)
                .regDate(board.getCreatedDate())
                .modDate(board.getUpdatedDate())
                .build();
    }

}
