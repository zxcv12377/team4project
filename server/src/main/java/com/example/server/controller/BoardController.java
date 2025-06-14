package com.example.server.controller;

import java.lang.ProcessBuilder.Redirect;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.service.BoardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RequestMapping("/board")
@Controller
@Log4j2
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/create")
    public String getCreate(@ModelAttribute("dto") BoardDTO dto, PageRequestDTO pageRequestDTO) {
        log.info("글 작성 폼 요청");
        return "board/create";
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/create")
    public String postCreate(@ModelAttribute("dto") @Valid BoardDTO dto,
                             BindingResult result,
                             PageRequestDTO pageRequestDTO,
                             RedirectAttributes rttr) {
        log.info("글 작성 요청: {}", dto);

        if (result.hasErrors()) {
            return "board/create";
        }

        boardService.create(dto);

        rttr.addAttribute("page", pageRequestDTO.getPage());
        rttr.addAttribute("size", pageRequestDTO.getSize());
        rttr.addAttribute("type", pageRequestDTO.getType());
        rttr.addAttribute("keyword", pageRequestDTO.getKeyword());

        return "redirect:/board/list";
    }



    @GetMapping("/list")
    public String getList(Model model, PageRequestDTO pageRequestDTO) {
    log.info("list 요청", pageRequestDTO);

        PageResultDTO<BoardDTO> result = boardService.getList(pageRequestDTO);
        model.addAttribute("result", result);

        return "board/list";
    }


    @GetMapping("/read")
    public String getRead(@RequestParam("bno") Long bno, PageRequestDTO pageRequestDTO, Model model) {
        log.info("read 요청 bno: {}", bno);

        BoardDTO dto = boardService.getRow(bno);
        model.addAttribute("dto", dto);
        model.addAttribute("requestDTO", pageRequestDTO);

        return "board/read";
    }

//수정page 부름
    @PreAuthorize("authentication.name == #dto.email")
    @GetMapping("/modify")
    public String getModify(@RequestParam("bno") Long bno,  PageRequestDTO pageRequestDTO, Model model) {
        log.info("modify 폼 요청 bno: {}", bno);

        BoardDTO dto = boardService.getRow(bno);
        model.addAttribute("dto", dto);
        model.addAttribute("requestDTO", pageRequestDTO);

        return "board/modify";
    }

    //수정 완료 후 서버 전송
   @PreAuthorize("authentication.name == #dto.email")
    @PostMapping("/modify")
    public String postModify(@ModelAttribute BoardDTO dto,
                             PageRequestDTO pageRequestDTO,
                             RedirectAttributes rttr) {
        log.info("수정 요청: {}", dto);

        boardService.update(dto);

        rttr.addAttribute("bno", dto.getBno());
        rttr.addAttribute("page", pageRequestDTO.getPage());
        rttr.addAttribute("size", pageRequestDTO.getSize());
        rttr.addAttribute("type", pageRequestDTO.getType());
        rttr.addAttribute("keyword", pageRequestDTO.getKeyword());

        return "redirect:/board/read";
    }

    //글쓴이만 삭제함.    
    @PreAuthorize("authentication.name == #email")
    @PostMapping("/remove")
    public String postRemove(@RequestParam("bno") Long bno,
                            @RequestParam("email") String email,
                            PageRequestDTO pageRequestDTO,
                            RedirectAttributes rttr) {
        log.info("삭제 요청 bno: {}", bno);
        boardService.delete(bno);

        rttr.addAttribute("page", pageRequestDTO.getPage());
        rttr.addAttribute("size", pageRequestDTO.getSize());
        rttr.addAttribute("type", pageRequestDTO.getType());
        rttr.addAttribute("keyword", pageRequestDTO.getKeyword());

        return "redirect:/board/list";
    }


}