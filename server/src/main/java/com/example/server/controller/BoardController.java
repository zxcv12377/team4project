package com.example.server.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
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
import org.springframework.web.bind.annotation.ResponseBody;
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
@RequiredArgsConstructor
@Log4j2
public class BoardController {

    private final BoardService boardService;

    // @GetMapping("/list")
    // public void getList(Model model, PageRequestDTO pageRequestDTO) {
    // log.info("List 요청 {}", pageRequestDTO);


    @GetMapping("/create")
    public void getCreate(BoardDTO dto) {
        log.info("글 작성 폼");
    }

 
    @GetMapping("/list")
    public List<BoardDTO> getList() {
        return boardService.getList();
    }
    

    @PostMapping("/create")
    public BoardDTO postCreate(@RequestBody @Valid BoardDTO dto) {

    log.info("JSON 글 작성 요청: {}", dto);
    boardService.create(dto);
    return dto;
    }

    @PutMapping("/modify/{bno}")
    public BoardDTO updateBoard(@PathVariable Long bno, @RequestBody @Valid BoardDTO dto) {
        dto.setBno(bno);
        boardService.update(dto);
        return boardService.getRow(bno); // 업데이트 후 결과 반환
    }



//     @PostMapping("/modify/")
//     public BoardDTO postModify(@RequestBody @Valid BoardDTO dto) {
//         log.info("수정 {}", dto);
//         boardService.update(dto);

//         return boardService.getRow(dto.getBno()); // 수정된 결과 반환
// } 
    

    @DeleteMapping({ "/remove/{bno}" })
    public ResponseEntity<String> getRemove(@PathVariable Long bno) {
        log.info("삭제 {}", bno);
        boardService.delete(bno);

   return ResponseEntity.ok("삭제 완료"); 
    }

}
