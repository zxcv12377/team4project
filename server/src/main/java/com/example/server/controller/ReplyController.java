package com.example.server.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.ReplyDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Reply;
import com.example.server.service.ReplyService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RequiredArgsConstructor
@Log4j2
@RestController
@RequestMapping
public class ReplyController {

    private final ReplyService replyService;

    @PostMapping
    public Long postMethodName(ReplyDTO dto) {
        log.info("댓글 삽입 {}", dto);
        return replyService.create(dto);
    }

}
