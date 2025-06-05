package com.example.server.service;

// import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.entity.Member;
import com.example.server.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RequiredArgsConstructor
@Log4j2
@Service
public class MemberService {

    private final MemberRepository memberRepository;

    // 회원가입
    public void register(MemberRequestDTO dto) throws IllegalStateException {

        Member member = Member.builder()
                .nickname(dto.getNickname())
                .password(dto.getPassword())
                .email(dto.getEmail())
                .agree(true)
                .emailVerified(true)
                .build();

        memberRepository.save(member);
    }

    // 로그인
    // public MemberRequestDTO loginUser(String nickname) {
    // log.info("nickname {}", nickname);

    // Member member = memberRepository.findByNickname(nickname);

    // if (member == null)
    // throw new UsernameNotFoundException("닉네임 확인");

    // MemberRequestDTO memberDTO = MemberRequestDTO
    // .builder()
    // .nickname(member.getNickname())
    // .password(member.getPassword())
    // .build();

    // return memberDTO;
    // }

}
