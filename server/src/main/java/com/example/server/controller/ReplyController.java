package com.example.server.controller;

import com.example.server.dto.ReplyDTO;
import com.example.server.dto.ReplyResponseDTO;
import com.example.server.entity.Member;
import com.example.server.jwt.JwtUtil;
import com.example.server.repository.MemberRepository;
import com.example.server.service.ReplyService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Log4j2
@RestController
@RequestMapping("/api/replies")
public class ReplyController {

    private final ReplyService replyService;
    private final JwtUtil jwtUtil;
    private final MemberRepository memberRepository;

    // 댓글 등록
    @PostMapping
    public ResponseEntity<?> createReply(@RequestBody ReplyDTO dto,
            HttpServletRequest request) {
        Member member = getMemberFromRequest(request);
        if (member == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        Long rno = replyService.create(dto, member);
        return ResponseEntity.ok("댓글 작성 완료 (rno=" + rno + ")");
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
    public ResponseEntity<?> updateReply(@PathVariable Long rno,
            @RequestBody ReplyDTO dto,
            HttpServletRequest request) {
        Member member = getMemberFromRequest(request);
        if (member == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        replyService.update(rno, dto.getText(), member);
        return ResponseEntity.ok("댓글 수정 완료");
    }

    // 댓글 추천
    @PostMapping("/{rno}/like")
    public ResponseEntity<Void> likeReply(@PathVariable Long rno, @RequestBody Map<String, String> payload) {
        log.info("페이로드 : {}", payload);
        replyService.likeReply(rno, payload.get("email"));
        return ResponseEntity.ok().build();
    }

    // 추천 수 조회
    @GetMapping("/{rno}/likeCount")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long rno) {
        return ResponseEntity.ok(replyService.getLikeCount(rno));
    }

    // 댓글 삭제
    @DeleteMapping("/{rno}")
    public ResponseEntity<?> deleteReply(@PathVariable Long rno,
            HttpServletRequest request) {
        Member member = getMemberFromRequest(request);
        if (member == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        replyService.delete(rno, member);
        return ResponseEntity.ok("댓글 삭제 완료");
    }

    // ✅ 토큰에서 Member 객체 추출 (공통)
    private Member getMemberFromRequest(HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null || !jwtUtil.isTokenValid(token)) {
            return null;
        }

        String email = jwtUtil.getEmail(token); // 또는 jwtUtil.validateAndGetSubject(token)
        return memberRepository.findByEmail(email).orElse(null);
    }

    // ✅ Authorization 헤더에서 Bearer 토큰 추출
    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7); // "Bearer " 제거
        }
        return null;
    }

}
