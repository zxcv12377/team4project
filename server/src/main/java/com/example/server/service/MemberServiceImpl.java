package com.example.server.service;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Member;
import com.example.server.mapper.MemberMapper;
import com.example.server.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    private final String uploadDir = "src/main/resources/static/img/"; // 프로필 이미지 저장경로

    @Override
    @Transactional
    public void register(MemberRequestDTO dto) {
        Member member = Member.builder()
                .nickname(dto.getNickname())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .build();
        memberRepository.save(member);
    }

    @Override
    public MemberResponseDTO getUserInfo(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));
        return MemberMapper.toDTO(member);
    }

    @Override
    @Transactional
    public MemberResponseDTO updateUserInfo(String email, MemberRequestDTO dto, MultipartFile profile) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        // 닉네임 수정
        member.setNickname(dto.getNickname());

        // 프로필 이미지가 들어온 경우 처리
        if (profile != null && !profile.isEmpty()) {
            try {
                String originalFilename = profile.getOriginalFilename();
                String newFilename = System.currentTimeMillis() + "_" + originalFilename;
                String uploadPath = System.getProperty("user.dir") + "/src/main/resources/static/img/" + newFilename;

                File dest = new File(uploadPath);
                profile.transferTo(dest);

                member.setProfileimg(newFilename);
            } catch (IOException e) {
                throw new RuntimeException("프로필 이미지 업로드 중 오류가 발생했습니다.", e);
            }
        }

        memberRepository.save(member);
        return MemberMapper.toDTO(member);
    }

    @Override
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        }

        member.setPassword(passwordEncoder.encode(newPassword));
        memberRepository.save(member);
    }

    @Override
    @Transactional
    public void delete(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));
        memberRepository.delete(member);
    }
}
