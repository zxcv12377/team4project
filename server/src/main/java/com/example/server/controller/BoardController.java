package com.example.server.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.security.CustomMemberDetails;
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

    @PostMapping("/write")
    public ResponseEntity<?> create(@RequestBody BoardDTO boardDTO,
                                @AuthenticationPrincipal CustomMemberDetails memberDetails) {
    log.info("게시글 작성 요청: {}", boardDTO);

    boardDTO.setId(memberDetails.getMember().getId());

    boardService.create(boardDTO);
    return ResponseEntity.ok("success");
}

    @GetMapping("/list")
    public ResponseEntity<?> getList(PageRequestDTO pageRequestDTO) {
        log.info("list 요청", pageRequestDTO);

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
public ResponseEntity<?> update(@PathVariable Long bno,
                                @RequestBody BoardDTO dto,
                                @AuthenticationPrincipal CustomMemberDetails memberDetails) {
    Long currentUserId = memberDetails.getMember().getId();
    boardService.update(bno, dto, currentUserId);
    return ResponseEntity.ok("수정 완료");
}

    @DeleteMapping("/delete/{bno}")
    public ResponseEntity<?> delete(@PathVariable Long bno,
                                @AuthenticationPrincipal CustomMemberDetails memberDetails) {
    Long currentUserId = memberDetails.getMember().getId();
    boardService.delete(bno, currentUserId);
    return ResponseEntity.ok("삭제 완료");
}

}