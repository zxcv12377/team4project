package com.example.server.controller;

import com.example.server.dto.ReplyDTO;
import com.example.server.dto.ReplyResponseDTO;
import com.example.server.entity.Reply;
import com.example.server.service.ReplyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Log4j2
@RestController
@RequestMapping("/replies")
public class ReplyController {

    private final ReplyService replyService;

    // 댓글 등록
    @PostMapping
    public ResponseEntity<Long> createReply(@RequestBody ReplyDTO dto) {
        return ResponseEntity.ok(replyService.create(dto));
    }

    // 댓글 목록 조회 (sort: best 또는 recent)
    @GetMapping("/board/{bno}")
    public ResponseEntity<?> getReplies(
            @PathVariable Long bno,
            @RequestParam(defaultValue = "recent") String sort) {

        if (sort.equals("best")) {
            // 베스트 댓글 + 일반 댓글 분리된 구조로 반환
            Map<String, List<ReplyResponseDTO>> separated = replyService.getRepliesSeparated(bno);
            return ResponseEntity.ok(separated); // { best: [...], general: [...] }
        } else {
            // 작성순 전체 댓글 목록 반환 (트리 구조 포함)
            List<ReplyResponseDTO> replies = replyService.getList(bno);
            return ResponseEntity.ok(replies);
        }
    }

    // 댓글 조회
    @GetMapping("/{rno}")
    public ResponseEntity<ReplyDTO> getReply(@PathVariable Long rno) {
        return ResponseEntity.ok(replyService.get(rno));
    }

    // 댓글 수정
    @PutMapping("/{rno}")
    public ResponseEntity<Long> updateReply(@PathVariable Long rno, @RequestBody ReplyDTO dto) {
        dto.setRno(rno);
        return ResponseEntity.ok(replyService.update(dto));
    }

    // 댓글 추천
    @PostMapping("/{rno}/like")
    public ResponseEntity<Void> likeReply(@PathVariable Long rno, @RequestBody Map<String, String> payload) {
        replyService.likeReply(rno, payload.get("nickname"));
        return ResponseEntity.ok().build();
    }

    // 추천 수 조회
    @GetMapping("/{rno}/likeCount")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long rno) {
        return ResponseEntity.ok(replyService.getLikeCount(rno));
    }

    // 댓글 삭제
    @DeleteMapping("/{rno}")
    public ResponseEntity<Void> deleteReply(@PathVariable Long rno) {
        replyService.delete(rno);
        return ResponseEntity.ok().build();
    }
}
