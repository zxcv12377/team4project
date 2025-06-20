package com.example.server.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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

@RequestMapping("/board")
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
    public ResponseEntity<?> getList(Model model, PageRequestDTO pageRequestDTO) {
        log.info("list 요청", pageRequestDTO);

        PageResultDTO<BoardDTO> result = boardService.getList(pageRequestDTO);
        model.addAttribute("result", result);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/read")
    public ResponseEntity<?> read(@PathVariable Long bno) {
        log.info("게시글 조회 요청 bno: {}", bno);

        BoardDTO dto = boardService.getRow(bno);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update")
    public ResponseEntity<?> update(@PathVariable("bno") Long bno, @RequestBody BoardDTO dto) {
        log.info("게시글 수정 요청: {}", dto);
        dto.setBno(bno);
        boardService.update(dto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> delete(@PathVariable("bno") Long bno) {
        log.info("삭제 요청 bno: {}", bno);
        boardService.delete(bno);

        return ResponseEntity.ok().build();
    }

}