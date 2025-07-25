package com.example.server.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.service.BoardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RequestMapping("/api/boards")
@RestController
@Log4j2
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PostMapping("/")
    public ResponseEntity<?> create(@RequestBody @Valid BoardDTO dto) {
        log.info("게시글 작성 요청: {}", dto);
        boardService.create(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/list")
    public ResponseEntity<?> getList(@ModelAttribute PageRequestDTO pageRequestDTO) {
        if (pageRequestDTO != null) {
            log.info("페이지 리퀘스트 null 아님");
        } else {
            log.info("페이지 리퀘스트 null");
        }
        log.info("list 요청: {}", pageRequestDTO);

        PageResultDTO<BoardDTO> result = boardService.getList(pageRequestDTO);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/read/{bno}")
    public ResponseEntity<?> read(@PathVariable Long bno) {
        log.info("게시글 조회 요청 bno: {}", bno);

        BoardDTO dto = boardService.getRow(bno);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update/{bno}")
    public ResponseEntity<?> update(@PathVariable("bno") Long bno, @RequestBody BoardDTO dto) {
        log.info("게시글 수정 요청: {}", dto);
        dto.setBno(bno);
        boardService.update(dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/delete/{bno}")
    public ResponseEntity<?> delete(@PathVariable("bno") Long bno) {
        log.info("삭제 요청 bno: {}", bno);
        boardService.delete(bno);

        return ResponseEntity.ok().build();
    }

    // myprofile 이메일 걸어야되서 새로 추가함
    @GetMapping("/my")
    public ResponseEntity<?> getMyBoards(Authentication authentication) {
        String email = authentication.getName();
        List<BoardDTO> myBoards = boardService.getBoardsByWriterEmail(email);
        return ResponseEntity.ok(myBoards);
    }

    // 왜 두개씩 만듬? (진짜 모름)
    // @PutMapping("/{bno}")
    // @GetMapping("/modify")
    // public ResponseEntity<?> modify(@PathVariable Long bno, @RequestBody BoardDTO
    // dto) {
    // log.info("수정 요청: {}", dto);
    // dto.setBno(bno); // URL path로 받은 bno를 DTO에 세팅
    // boardService.update(dto);
    // return ResponseEntity.ok().build();
    // }

    // // 게시글 삭제
    // @DeleteMapping("/{bno}")
    // public ResponseEntity<?> remove(@PathVariable Long bno) {
    // log.info("삭제 요청 bno: {}", bno);
    // boardService.delete(bno);
    // return ResponseEntity.ok().build();
    // }

}