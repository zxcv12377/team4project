package com.example.server.controller;

import com.example.server.dto.ReplyDTO;
import com.example.server.dto.ReplyRequestDTO;
import com.example.server.dto.ReplyResponseDTO;
import com.example.server.entity.Member;
import com.example.server.repository.MemberRepository;
import com.example.server.security.CustomMemberDetails;
import com.example.server.service.ReplyService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Log4j2
@RestController
@RequestMapping("/api/replies")
public class ReplyController {

    private final ReplyService replyService;
    private final MemberRepository memberRepository;

    // 댓글 등록
    @Transactional
    @PostMapping
    public ResponseEntity<?> createReply(@RequestBody @Valid ReplyRequestDTO dto,
            @AuthenticationPrincipal CustomMemberDetails currentMember) {
        Member member = memberRepository.findById(currentMember.getId())
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));

        Long rno = replyService.create(dto, member);
        return ResponseEntity.ok("댓글 작성 완료 (rno=" + rno + ")");
    }

    // 댓글 목록 조회 (sort: best 또는 recent)
    @Transactional(readOnly = true)
    @GetMapping("/board/{bno}")
    public ResponseEntity<?> getReplies(
            @PathVariable Long bno,
            @RequestParam(defaultValue = "recent") String sort,
            @AuthenticationPrincipal CustomMemberDetails currentMember) {

        Member member = null;
        if (currentMember != null) {
            member = memberRepository.findById(currentMember.getId())
                    .orElseThrow(() -> new IllegalArgumentException("로그인 하지 않은 상태 입니다."));
        }

        if (sort.equals("best")) {
            // 베스트 댓글 + 일반 댓글 분리된 구조로 반환
            Map<String, List<ReplyResponseDTO>> separated = replyService.getRepliesWithBest(bno, member);
            return ResponseEntity.ok(separated); // { best: [...], general: [...] }
        } else {
            // 작성순 전체 댓글 목록 반환 (트리 구조 포함)
            List<ReplyResponseDTO> replies = replyService.getList(bno, member);
            return ResponseEntity.ok(replies);
        }
    }

    // 댓글 조회
    @Transactional(readOnly = true)
    @GetMapping("/{rno}")
    public ResponseEntity<ReplyDTO> getReply(@PathVariable Long rno) {
        return ResponseEntity.ok(replyService.get(rno));
    }

    // 댓글 수정
    @Transactional
    @PutMapping("/{rno}")
    public ResponseEntity<?> updateReply(@PathVariable Long rno,
            @RequestBody ReplyDTO dto,
            @AuthenticationPrincipal CustomMemberDetails currentMember) {
        Member member = memberRepository.findById(currentMember.getId())
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));

        replyService.update(rno, dto.getText(), member);
        return ResponseEntity.ok("댓글 수정 완료");
    }

    // 댓글 추천
    @Transactional
    @PostMapping("/{rno}/like")
    public ResponseEntity<Map<String, Object>> likeReply(@PathVariable Long rno,
            @AuthenticationPrincipal CustomMemberDetails currentMember) {
        Member member = memberRepository.findById(currentMember.getId())
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));

        boolean likedNow = replyService.toggleLike(rno, member);
        long likeCount = replyService.getLikeCount(rno);
        return ResponseEntity.ok(Map.of(
                "liked", likedNow,
                "likeCount", likeCount));

        // try {
        // replyService.toggleLike(rno, member);
        // return ResponseEntity.ok().build();
        // } catch (IllegalArgumentException e) {
        // return ResponseEntity.badRequest().body(e.getMessage());
        // } catch (Exception e) {
        // log.error("댓글 추천 실패", e);
        // return ResponseEntity.status(500).body("서버 오류로 추천에 실패했습니다.");
        // }
    }

    // 추천 수 조회
    @Transactional(readOnly = true)
    @GetMapping("/{rno}/likeCount")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long rno) {
        return ResponseEntity.ok(replyService.getLikeCount(rno));
    }

    // 댓글 삭제
    @Transactional
    @DeleteMapping("/{rno}")
    public ResponseEntity<?> deleteReply(@PathVariable Long rno,
            HttpServletRequest request,
            @AuthenticationPrincipal CustomMemberDetails currentMember) {
        Member member = memberRepository.findById(currentMember.getId())
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));

        replyService.delete(rno, member);
        return ResponseEntity.ok("댓글 삭제 완료");
    }

    @Transactional(readOnly = true)
    @GetMapping("/my")
    public ResponseEntity<?> getMyReplies(@AuthenticationPrincipal CustomMemberDetails currentMemeber) {
        Member member = memberRepository.findById(currentMemeber.getId())
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));

        List<ReplyResponseDTO> replies = replyService.getRepliesByWriter(member);
        return ResponseEntity.ok(replies);
    }

}
