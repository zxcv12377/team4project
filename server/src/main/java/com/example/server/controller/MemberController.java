package com.example.server.controller;

import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.service.MemberService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RequiredArgsConstructor
@RequestMapping
@Controller
public class MemberController {

    private final MemberService service;

    @GetMapping("/login")
    public void getLogin() {
        log.info("로그인 요청");
    }

    @PostMapping("/register")
    public String postMember(@Valid MemberRequestDTO memberDTO, BindingResult result) {
        log.info("회원가입 요청 {}", memberDTO);

        if (result.hasErrors()) {
            return "member/register";
        }

        try {
            service.register(memberDTO);
        } catch (Exception e) {
            return "member/register";
        }

        return "redirect:/member/login";
    }

}
