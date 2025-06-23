package com.example.server.mapper;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;

public class BoradMapper {

    // DTO → Entity(게시글)
    public static Board toEntity(BoardDTO dto, Member member) {
        return Board.builder()
                .title(dto.getTitle()) // 사용자 입력
                .content(dto.getContent()) // 사용자 입력
                .member(member) // 서버 내부에서 매핑 (세션 or 인증 토큰에서 추출)
                .build();
    }

    // Entity → DTO
    public static BoardDTO toDTO(Board board) {
        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .nickname(board.getMember().getNickname())
                .build();
    }

}
