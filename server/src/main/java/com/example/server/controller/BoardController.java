package com.example.server.controller;

import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.server.dto.BoardDTO;
import com.example.server.service.BoardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RequestMapping("/board")
@Controller
@RequiredArgsConstructor
@Log4j2
public class BoardController {

    private final BoardService boardService;

    @GetMapping("/create")
    public void getCreate(BoardDTO dto) {
        log.info("글 작성 폼");
    }

    @PostMapping("/create")
    public String postCreate(@ModelAttribute("dto") @Valid BoardDTO dto, BindingResult result) {
        log.info("글 작성 요청 {}", dto);

        if (result.hasFieldErrors()) {
            return "/board/create";
        }

        boardService.create(dto);

        return "redirect:/board/list";
    }

    @PostMapping("/modify")
    public String postModify(BoardDTO dto) {
        log.info("수정 {}", dto);
        boardService.update(dto);

        return "redirect:/board/read";
    }

    @GetMapping({ "/remove" })
    public String getRemove(Long bno) {
        log.info("삭제", bno);

        boardService.delete(bno);

        return "redirect:/board/list";
    }

}
