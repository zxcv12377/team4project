package com.example.server.service;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.dto.InviteRequestDTO;
import com.example.server.dto.InviteResponseDTO;
import com.example.server.entity.ChannelMember;
import com.example.server.entity.ChannelRole;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Invite;
import com.example.server.entity.Member;
import com.example.server.repository.ChannelMemberRepository;
import com.example.server.repository.ChatRoomRepository;
import com.example.server.repository.InviteRepository;
import com.example.server.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class InviteService {

    private final ChatRoomRepository chatRoomRepository;
    private final MemberRepository memberRepository;
    private final InviteRepository inviteRepository;
    private final ChannelMemberRepository channelMemberRepository;

    // 랜덤 코드 생성 유틸
    private String generateRandomCode() {
        // 8자리 영문+숫자 (커스텀 가능)
        return RandomStringUtils.randomAlphanumeric(8);
    }

    public Invite createInvite(Long creatorId, InviteRequestDTO dto) {
        ChatRoom room = chatRoomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음"));

        Member creator = memberRepository.findById(creatorId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

        // 중복 방지, 충돌날 때 재시도
        String code;
        do {
            code = generateRandomCode();
        } while (inviteRepository.findByCodeAndActiveTrue(code).isPresent());

        Invite invite = Invite.builder()
                .code(code)
                .room(room)
                .creator(creator)
                .expireAt(dto.getExpireAt())
                .maxUses(dto.getMaxUses())
                .memo(dto.getMemo())
                .build();

        return inviteRepository.save(invite);
    }

    public InviteResponseDTO getInviteInfo(String inviteCode) {
        Invite invite = inviteRepository.findByCodeAndActiveTrue(inviteCode)
                .orElseThrow(() -> new NoSuchElementException("초대코드 없음"));

        // 만료 체크
        if (invite.getExpireAt() != null && invite.getExpireAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("초대코드 만료됨");
        }
        // 횟수 제한 체크
        if (invite.getMaxUses() != null && invite.getUses() >= invite.getMaxUses()) {
            throw new IllegalStateException("최대 사용횟수 초과");
        }

        // DTO 변환
        InviteResponseDTO dto = new InviteResponseDTO();
        dto.setInviteCode(invite.getCode());
        dto.setRoomId(invite.getRoom().getId());
        dto.setRoomName(invite.getRoom().getName());
        dto.setRoomDescription(invite.getRoom().getDescription());
        dto.setCreatorName(invite.getCreator().getNickname());
        dto.setExpireAt(invite.getExpireAt());
        dto.setMaxUses(invite.getMaxUses());
        dto.setUses(invite.getUses());
        dto.setActive(invite.getActive());
        dto.setMemo(invite.getMemo());

        return dto;
    }

    // 초대코드로 방에 참여
    @Transactional
    public Long joinByInvite(String inviteCode, Long memberId) {
        // 1. 초대코드(활성/유효) 검색
        Invite invite = inviteRepository.findByCodeAndActiveTrue(inviteCode)
                .orElseThrow(() -> new NoSuchElementException("초대코드 없음"));

        // 2. 만료/횟수 초과 체크
        if (invite.getExpireAt() != null && invite.getExpireAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("초대코드 만료됨");
        }
        if (invite.getMaxUses() != null && invite.getUses() >= invite.getMaxUses()) {
            throw new IllegalStateException("최대 사용횟수 초과");
        }

        // 3. 방 멤버십 체크 (이미 입장된 사용자면 예외)
        ChatRoom room = invite.getRoom();
        boolean isMember = channelMemberRepository.existsByRoomIdAndMemberId(room.getId(), memberId);
        if (isMember) {
            throw new IllegalStateException("이미 참여 중인 방입니다.");
        }

        // 4. 방 멤버 등록
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("사용자 없음"));

        ChannelMember newMember = ChannelMember.builder()
                .room(room)
                .member(member)
                .role(ChannelRole.USER) // 이거 반드시 추가!!
                .muted(false)
                .banned(false)
                .build();
        channelMemberRepository.save(newMember);

        // 5. 사용횟수 증가, 최대치 도달시 active=false
        invite.setUses(invite.getUses() + 1);
        if (invite.getMaxUses() != null && invite.getUses() >= invite.getMaxUses()) {
            invite.setActive(false);
        }
        inviteRepository.save(invite);

        return room.getId();
    }
}
