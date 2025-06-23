package com.example.server.service;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Member;
import com.example.server.mapper.MemberMapper;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.ChatRoomMemberRepository;
import com.example.server.repository.EmailVerificationTokenRepository;
import com.example.server.repository.FriendRepository;
import com.example.server.repository.InviteRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.NotificationRepository;
import com.example.server.repository.ReplyRepository;
import com.example.server.repository.ServerMemberRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

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
    private final BoardRepository boardRepository;
    private final ReplyRepository replyRepository;
    private final FriendRepository friendRepository;
    private final NotificationRepository notificationRepository;
    private final InviteRepository inviteRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ServerMemberRepository serverMemberRepository;



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

                // 댓글삭제
        replyRepository.deleteAllByMember(member);
        // 게시글 삭제
        boardRepository.deleteAllByMember(member);
        // 채팅방 멤버 삭제
        chatRoomMemberRepository.deleteAllByMember(member);
        // 서버 멤버 삭제
        serverMemberRepository.deleteAllByMember(member);

        // 삭제하는게 나아보이는 entity 3개 
        friendRepository.deleteAllByMemberA(member);
        friendRepository.deleteAllByMemberB(member);
        notificationRepository.deleteAllBySender(member);
        notificationRepository.deleteAllByReceiver(member);
        inviteRepository.deleteAllByCreator(member);

        tokenRepository.deleteByMember(member);
        // 회원삭제
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
}
