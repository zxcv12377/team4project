package com.example.server.service;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Member;
import com.example.server.mapper.MemberMapper;
import com.example.server.repository.BoardLikeRepository;
import com.example.server.repository.BoardViewLogRepository;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyLikeRepository;
import com.example.server.repository.ReplyRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import java.util.List;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Log4j2
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final EmailVerificationTokenRepository tokenRepository;

    // 멤버가 삭제되어도 좋아요는 사라지지 않고 좋아요의 member값만 null로 바꾸도록 함
    private final BoardLikeRepository boardLikeRepository;
    private final ReplyLikeRepository replyLikeRepository;
    private final BoardViewLogRepository boardViewLogRepository;
    private final ReplyRepository replyRepository;

    // 회원 가입시 이메일 중복여부 확인
    @Override
    public void register(String email) {
        if (memberRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }

        emailVerificationService.sendVerificationEmail(email);
    }

    // 회원 정보 조회
    @Override
    public MemberResponseDTO getUserInfo(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));
        return MemberMapper.toDTO(member);
    }

    // 회원 정보 수정
    @Override
    @Transactional
    public MemberResponseDTO updateUserInfo(String email, MemberRequestDTO dto) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        member.setNickname(dto.getNickname());
        return MemberMapper.toDTO(member);
    }

    // 회원 비밀번호 변경
    @Override
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        }
        log.info("[Service] 비밀번호 변경 시도 이메일: {}", email);
        member.setPassword(passwordEncoder.encode(newPassword));
        memberRepository.save(member);
    }

    // 회원 탈퇴
    @Override
    @Transactional
    public void delete(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));
        //
        boardLikeRepository.setMemberToNullByMemberId(member.getId());
        replyLikeRepository.setMemberToNullByMemberId(member.getId());
        boardViewLogRepository.setMemberToNullByMemberId(member.getId());
        replyRepository.setMemberToNullByMemberId(member.getId());

        tokenRepository.deleteByEmail(member.getEmail());
        memberRepository.delete(member);
    }

    // 프로필 이미지 가져오기
    @Override
    public String getProfileImageFilename(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));
        return member.getProfileimg(); // 기존 필드 사용
    }

    // 프로필 이미지 업데이트
    @Override
    @Transactional
    public void updateProfileImage(String email, String profileimg) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));
        member.setProfileimg(profileimg);
        memberRepository.save(member);
    }

    // 코멘트 업데이트
    @Override
    @Transactional
    public void updateComment(String email, String comment) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 없음"));
        member.setComment(comment);
        memberRepository.save(member);
    }

    @Override
    public Member getByEmail(String email) {
        log.debug("getByEmail 호출됨, email={}", email);
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("존재하지 않는 사용자"));
    }

    @Override
    public List<MemberResponseDTO> searchMembers(String nickname, Long myMno) {
        List<Member> found = memberRepository.findAllByNickname(nickname);
        return found.stream()
                .filter(m -> !m.getId().equals(myMno))
                .map(MemberMapper::toDTO)
                .toList();
    }

    @Override
    @Transactional
    public List<MemberResponseDTO> findAll() {
        return memberRepository.findAll() // 모든 Member 엔티티
                .stream()
                .map(MemberMapper::toDTO) // DTO 변환
                .toList();
    }

    @Override
    @Transactional
    public void deleteByEmail(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));
        tokenRepository.deleteByEmail(member.getEmail());
        memberRepository.delete(member);
    }
}
