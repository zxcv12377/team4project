package com.example.server.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.ReplyDTO;
import com.example.server.dto.ReplyResponseDTO;
import com.example.server.service.ReplyService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;

@RequiredArgsConstructor
@Log4j2
@RestController
@RequestMapping("/replies")
public class ReplyController {

    private final ReplyService replyService;

    // 댓글 등록
    @PostMapping
    public Long postReply(@RequestBody ReplyDTO dto) {
        log.info("댓글 삽입 {}", dto);
        return replyService.create(dto);
    }

    // 특정 게시글 댓글 목록 조회
    @GetMapping("/board/{bno}")
    public List<ReplyResponseDTO> getReplies(@PathVariable Long bno) {
        log.info("댓글 목록 조회 {}", bno);
        return replyService.getList(bno);
    }

    // 특정 댓글조회
    @GetMapping("/{rno}")
    public ReplyDTO getReply(@PathVariable Long rno) {
        log.info("댓글 조회 {}", rno);
        return replyService.get(rno);
    }

    // 댓글 수정
    @PutMapping("/{rno}")
    public Long updateReply(@PathVariable Long rno, @RequestBody ReplyDTO dto) {
        log.info("댓글 수정 요청 {}", rno);
        dto.setRno(rno);
        return replyService.update(dto);
    }

    @DeleteMapping("/{rno}")
    public void deleteReply(@PathVariable Long rno) {
        log.info("댓글 삭제 요청 {}", rno);
        replyService.delete(rno);
    }

}
