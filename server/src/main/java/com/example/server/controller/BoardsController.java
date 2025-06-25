package com.example.server.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Sort;
import com.example.server.dto.BoardRequestDTO;
import com.example.server.dto.BoardResponseDTO;
import com.example.server.dto.BoardWithRepliesDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.dto.PagesRequestsDTO;
import com.example.server.dto.PagesResultDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Boards;
import com.example.server.entity.Member;
import com.example.server.mapperc.BoardMapper;
import com.example.server.security.CustomMemberDetails;
import com.example.server.service.BoardService;
import com.example.server.service.BoardsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardsController {
    private final BoardsService boardService;

    // 게시글 등록
    @PostMapping
    public ResponseEntity<BoardResponseDTO> register(@RequestBody BoardRequestDTO dto,
            @AuthenticationPrincipal CustomMemberDetails memberDTO) {
        log.info("🧑 로그인 사용자 = {}", memberDTO.getUsername()); // null이면 인증 실패 상태임
        Boards saved = boardService.register(dto, memberDTO.getUsername());
        return ResponseEntity.ok(BoardMapper.toDTO(saved));
    }

    // 전체 게시글 조회
    @GetMapping
    public ResponseEntity<PagesResultDTO<BoardResponseDTO>> getAll(PagesRequestsDTO pageRequestDTO) {
        return ResponseEntity.ok(boardService.getAll(pageRequestDTO));
    }

    // 게시글 단건 조회
    @GetMapping("/{bno}")
    public ResponseEntity<BoardResponseDTO> get(@PathVariable Long bno) {
        return ResponseEntity.ok(boardService.get(bno));
    }

    // 게시글 수정
    @PutMapping("/{bno}")
    public ResponseEntity<Void> modify(@PathVariable Long bno,
            @RequestBody BoardRequestDTO dto,
            @AuthenticationPrincipal CustomMemberDetails memberDTO) {

        boardService.modify(bno, dto, memberDTO.getUsername());
        return ResponseEntity.ok().build();
    }

    // 게시글 삭제
    @DeleteMapping("/{bno}")
    public ResponseEntity<Void> delete(@PathVariable Long bno,
            @AuthenticationPrincipal CustomMemberDetails membersecurityDTO) {

        if (membersecurityDTO == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 인증 실패 시 401
        }

        boardService.delete(bno, membersecurityDTO.getUsername());
        return ResponseEntity.ok().build();
    }

    // 게시글 1 댓글 전체 불러오기

    @GetMapping("/{bno}/full")
    public ResponseEntity<BoardWithRepliesDTO> getFull(@PathVariable Long bno) {
        return ResponseEntity.ok(boardService.getBoardWithReplies(bno));
    }
}
