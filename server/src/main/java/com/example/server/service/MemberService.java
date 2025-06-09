package com.example.server.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

// import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Member;
import com.example.server.repository.MemberRepository;

import jakarta.servlet.http.HttpServletRequest;
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
    public Member authenticate(String nickname, String password) {
        Member member = memberRepository.findByNickname(nickname);
        if (member != null && member.getPassword().equals(password)) {
            return member;
        }
        return null;
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

    // 프로필 수정단
    public Member findByNickname(String nickname) {
        return memberRepository.findByNickname(nickname);
    }

    public void updateUserInfo(String nickname, MemberRequestDTO dto) {
        Member member = memberRepository.findByNickname(nickname);
        if (member == null) {
            throw new RuntimeException("사용자 없음");
        }

        member.setEmail(dto.getEmail());
        member.setProfileimg(dto.getProfileimg());
        memberRepository.save(member);
    }

    public void changePassword(String nickname, String currentPw, String newPw) {
        Member member = memberRepository.findByNickname(nickname);
        if (member == null) {
            throw new RuntimeException("사용자 없음");
        }

        if (!member.getPassword().equals(currentPw)) {
            throw new RuntimeException("기존 비밀번호가 일치하지 않습니다.");
        }

        member.setPassword(newPw);
        memberRepository.save(member);
    }

    // 프로필 이미지 업로드, 삭제
    public String updateProfileImageByNickname(String nickname, MultipartFile file) {
        Member member = memberRepository.findByNickname(nickname);
        if (member == null) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

        String uploadDir = "uploads/";
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 기존 이미지 삭제 (default는 건드리지 않음)
            if (!member.getProfileimg().equals("./img/default.png")) {
                Files.deleteIfExists(uploadPath.resolve(member.getProfileimg()));
            }

            Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

            member.setProfileimg(fileName);
            memberRepository.save(member);
            return "/images/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("프로필 이미지 저장 실패", e);
        }
    }

    public void deleteByNickname(String nickname) {
        Member member = memberRepository.findByNickname(nickname);
        if (member != null) {
            memberRepository.delete(member);
        } else {
            throw new RuntimeException("회원이 존재하지 않습니다");
        }
    }

}
