package com.example.server.service;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Member;
import com.example.server.mapper.MemberMapper;
import com.example.server.repository.BoardLikeRepository;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.BoardViewLogRepository;
import com.example.server.repository.ChannelMemberRepository;
import com.example.server.repository.ChatMessageRepository;
import com.example.server.repository.ChatRoomMemberRepository;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyLikeRepository;
import com.example.server.repository.ReplyRepository;
import com.example.server.repository.ServerMemberRepository;
import com.example.server.repository.voiceChat.VoiceChatLogRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import java.util.List;
import java.util.Set;

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
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final ServerMemberRepository serverMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final VoiceChatLogRepository voiceChatLogRepository;
    private final BoardRepository boardRepository;

    private static final String GHOST_EMAIL = "deleted@local";
    private static final String GHOST_NICK = "탈퇴한 사용자";

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
        Long ghostId = ensureGhostMember();

        if (member.getId().equals(ghostId)) {
            throw new IllegalStateException("고스트 계정은 삭제할 수 없습니다.");
        }
        Long memberId = member.getId();
        // 1) 멤버십/조인 제거
        chatRoomMemberRepository.deleteMemberships(memberId);
        channelMemberRepository.deleteMemberships(memberId);
        serverMemberRepository.deleteMemberships(memberId);

        // 2) 참여데이터 보존: member_id = NULL
        boardLikeRepository.nullMemberByMemberId(memberId);
        replyLikeRepository.nullMemberByMemberId(memberId);
        boardViewLogRepository.nullMemberByMemberId(memberId);

        // 3) 콘텐츠/로그 재할당 (작성자/발신자 → 고스트)
        chatMessageRepository.reassignSender(ghostId, memberId);
        replyRepository.reassignAuthor(ghostId, memberId);
        boardRepository.reassignAuthor(ghostId, memberId);

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

    @Override
    public Long ensureGhostMember() {
        return memberRepository.findIdByEmail(GHOST_EMAIL)
                .orElseGet(() -> {
                    Member ghost = Member.builder()
                            .email(GHOST_EMAIL)
                            .password("{noop}N/A")
                            .nickname("탈퇴한 사용자")
                            .ghost(true) // ← 기본 롤 부여 우회
                            // .roles(new HashSet<>()) // 굳이 안 넣어도 됨(Builder.Default 사용)
                            .build();
                    memberRepository.save(ghost);
                    return ghost.getId();
                });
    }

    @Transactional
    @Override
    public void deleteByAdmin(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));
        //
        Long ghostId = ensureGhostMember();

        if (member.getId().equals(ghostId)) {
            throw new IllegalStateException("고스트 계정은 삭제할 수 없습니다.");
        }
        Long memberId = member.getId();
        // 1) 멤버십/조인 제거
        chatRoomMemberRepository.deleteMemberships(memberId);
        channelMemberRepository.deleteMemberships(memberId);
        serverMemberRepository.deleteMemberships(memberId);

        // 2) 참여데이터 보존: member_id = NULL
        boardLikeRepository.nullMemberByMemberId(memberId);
        replyLikeRepository.nullMemberByMemberId(memberId);
        boardViewLogRepository.nullMemberByMemberId(memberId);

        // 3) 콘텐츠/로그 재할당 (작성자/발신자 → 고스트)
        chatMessageRepository.reassignSender(ghostId, memberId);
        replyRepository.reassignAuthor(ghostId, memberId);
        boardRepository.reassignAuthor(ghostId, memberId);

        tokenRepository.deleteByEmail(member.getEmail());
        memberRepository.delete(member);
    }

    @Override
    public long count() {
        return memberRepository.count(); // JpaRepository 기본 제공
    }
}
