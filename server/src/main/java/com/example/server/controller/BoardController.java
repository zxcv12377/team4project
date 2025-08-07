package com.example.server.controller;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.server.dto.BoardViewResponseDTO;
import com.example.server.dto.BoardDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.entity.Member;
import com.example.server.repository.MemberRepository;
import com.example.server.security.CustomMemberDetails;
import com.example.server.service.BoardService;
import org.springframework.http.ResponseCookie;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RequestMapping("/api/boards")
@RestController
@Log4j2
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final MemberRepository memberRepository;

    @Value("${env.is-prod}")
    private String chkProd;

    @GetMapping("/channel/{channelId}")
    public ResponseEntity<PageResultDTO<BoardDTO>> listByChannel(@PathVariable Long channelId,
            @ModelAttribute PageRequestDTO pageRequestDTO) {

        PageResultDTO<BoardDTO> list = boardService.getBoardsByChannel(channelId, pageRequestDTO);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/best/channel")
    public ResponseEntity<PageResultDTO<BoardDTO>> bestListByChannel(@ModelAttribute PageRequestDTO pageRequestDTO) {

        PageResultDTO<BoardDTO> list = boardService.getBestBoards(pageRequestDTO, 1);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{bno}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long bno,
            @AuthenticationPrincipal CustomMemberDetails currentMember) {
        Member member = memberRepository.findById(currentMember.getId())
                .orElseThrow(() -> new IllegalArgumentException("로그인이 필요합니다."));
        boolean liked = boardService.toggleBoardLike(bno, member);
        long likeCount = boardService.getLikeCount(bno); // 실시간 추천 수
        return ResponseEntity.ok(Map.of(
                "liked", liked,
                "likeCount", likeCount));
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody @Valid BoardDTO dto) {
        if (dto.getChannelId() == null) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("게시글 작성 요청: {}", dto);
        boardService.create(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/list")
    public ResponseEntity<PageResultDTO<BoardDTO>> getList(
            @ModelAttribute PageRequestDTO pageRequestDTO) {

        log.info("list 요청: type={}, keyword={}, page={}, size={}",
                pageRequestDTO.getType(),
                pageRequestDTO.getKeyword(),
                pageRequestDTO.getPage(),
                pageRequestDTO.getSize());

        PageResultDTO<BoardDTO> result = boardService.getList(pageRequestDTO);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/read/{bno}")
    public ResponseEntity<BoardDTO> read(
            @PathVariable Long bno,
            @CookieValue(name = "viewedBoards", required = false, defaultValue = "") String viewedBoardsCookie) {
        BoardViewResponseDTO viewRes = boardService.getRow(bno, viewedBoardsCookie);

        if (viewRes.getNewCookieValue() != null) {
            // 개발환경은 HTTP라 secure=false,
            // 배포환경(HTTPS)에서는 secure=true 로 분기
            boolean isProd = !"local".equalsIgnoreCase(chkProd);

            ResponseCookie cookie = ResponseCookie.from("viewedBoards", viewRes.getNewCookieValue())
                    .path("/")
                    .maxAge(Duration.ofDays(1))
                    .httpOnly(true)
                    .sameSite(isProd ? "None" : "Lax")
                    .secure(isProd)
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(viewRes.getBoardDTO());
        }

        return ResponseEntity.ok(viewRes.getBoardDTO());
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

}