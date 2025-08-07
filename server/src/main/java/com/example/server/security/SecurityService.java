package com.example.server.security;

import java.util.Optional;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.enums.MemberRole;
import com.example.server.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SecurityService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    // 작성자 권한 검증
    public void checkBoardOwnership(Board board, Member currentUser) {

        // 관리자일 경우 권한 통과
        if (currentUser.getRoles().contains(MemberRole.ADMIN)) {
            return;
        }

        // 작성자 본인만 허용
        if (!board.getMember().getEmail().equals(currentUser.getEmail())) {
            throw new SecurityException("작성자만 수정/삭제할 수 있습니다.");
        }
    }

    // 마이페이지용 기존 비밀번호 확인 후 변경
    public boolean changePassword(String email, String currentPassword, String newPassword) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("회원이 없습니다."));

        if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
            return false;
        }

        member.setPassword(passwordEncoder.encode(newPassword));
        memberRepository.save(member);
        return true;
    }

    // 비밀번호 찾기용 이메일로 직접 변경
    public boolean resetPasswordByEmail(String email, String newPassword) {
        Optional<Member> memberOpt = memberRepository.findByEmail(email);
        if (memberOpt.isEmpty())
            return false;

        Member member = memberOpt.get();
        member.setPassword(passwordEncoder.encode(newPassword));
        memberRepository.save(member);
        return true;
    }
}
