package com.example.server.service;

// import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
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
    public MemberResponseDTO register(MemberRequestDTO dto) {
        Member member = Member.builder()
                .email(dto.getEmail())
                .nickname(dto.getNickname())
                .password(dto.getPassword())
                .profileimg(dto.getProfileimg() != null ? dto.getProfileimg() : "/img/default.png")
                .build();

        Member saved = memberRepository.save(member);

        return MemberResponseDTO.builder()
                .mno(saved.getId())
                .email(saved.getEmail())
                .nickname(saved.getNickname())
                .profileimg(saved.getProfileimg())
                .build();
    }

    // 로그인 검증에만 씀
    public boolean authenticate(String nickname, String password) {
        Member member = memberRepository.findByNickname(nickname);
        return member != null && member.getPassword().equals(password);
    }

    // 로그인 정보 조회만 씀
    public MemberRequestDTO loginUser(String nickname, String password) {
        log.info("nickname {}", nickname);

        Member member = memberRepository.findByNickname(nickname);

        // if (member == null)
        // throw new UsernameNotFoundException("닉네임 확인");

        MemberRequestDTO memberDTO = MemberRequestDTO
                .builder()
                .nickname(member.getNickname())
                .password(member.getPassword())
                .build();

        return memberDTO;
    }

}
