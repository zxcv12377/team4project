package com.example.server.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.ChatRoomMember;
import com.example.server.entity.Member;
import com.example.server.entity.enums.ChannelType;
import com.example.server.entity.enums.ChatRoomType;
import com.example.server.repository.ChatRoomMemberRepository;
import com.example.server.repository.ChatRoomRepository;
import com.example.server.repository.MemberRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
@RequiredArgsConstructor
public class DmRoomService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final MemberRepository memberRepository;

    // 1:1 DM방 생성 또는 조회
    @Transactional
    public ChatRoom getOrCreateDmRoom(Long memberAId, Long memberBId) {
        log.info("📦 DM 요청 도착 - myId: {}, friendId: {}", memberAId, memberBId);

        if (memberAId == null || memberBId == null) {
            throw new IllegalArgumentException("memberAId, memberBId는 null일 수 없습니다.");
        }

        Long minId = Math.min(memberAId, memberBId);
        Long maxId = Math.max(memberAId, memberBId);
        String name = "DM-" + minId + "-" + maxId;

        // 먼저 기존 방 있는지 조회
        Optional<ChatRoom> existing = chatRoomRepository.findByName(name);
        if (existing.isPresent()) {
            return existing.get();
        }

        return chatRoomRepository.findDmRoomBetween(minId, maxId)
                .orElseGet(() -> {
                    try {
                        ChatRoom room = ChatRoom.builder()
                                .name(name)
                                .roomType(ChatRoomType.DM)
                                .type(ChannelType.TEXT)
                                .server(null)
                                .build();

                        ChatRoom saved = chatRoomRepository.saveAndFlush(room);

                        Member member1 = memberRepository.findById(minId)
                                .orElseThrow(() -> new RuntimeException("유저 없음: " + minId));
                        Member member2 = memberRepository.findById(maxId)
                                .orElseThrow(() -> new RuntimeException("유저 없음: " + maxId));

                        chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(saved).member(member1).build());
                        chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(saved).member(member2).build());

                        return saved;

                    } catch (Exception e) {
                        log.warn("⚠️ DM방 중복 생성 충돌 감지. 기존 방 다시 조회 시도.");
                        return chatRoomRepository.findDmRoomBetween(minId, maxId)
                                .orElseGet(() -> {
                                    log.error("❌ 중복 생성 실패 + 재조회 실패 — 완전한 충돌");
                                    throw new RuntimeException("DM 방 생성에 실패했습니다. 다시 시도해주세요.");
                                });
                    }
                });
    }
    // public ChatRoom getOrCreateDmRoom(Long memberAId, Long memberBId) {
    // log.info("📦 DM 요청 도착 - myId: {}, friendId: {}", memberAId, memberBId);
    // if (memberAId == null || memberBId == null) {
    // throw new IllegalArgumentException("memberAId, memberBId는 null일 수 없습니다.");
    // }
    // Long minId = Math.min(memberAId, memberBId);
    // Long maxId = Math.max(memberAId, memberBId);

    // ChatRoom dmRoom = chatRoomRepository.findDmRoomBetween(minId, maxId)
    // .orElseGet(() -> {
    // ChatRoom room = ChatRoom.builder()
    // .name("DM-" + minId + "-" + maxId)
    // .roomType(ChatRoomType.DM)
    // .type(ChannelType.TEXT)
    // .server(null)
    // .build();
    // chatRoomRepository.save(room);

    // ChatRoomMember m1 = ChatRoomMember.builder()
    // .chatRoom(room).member(memberRepository.findById(minId).orElseThrow()).build();
    // ChatRoomMember m2 = ChatRoomMember.builder()
    // .chatRoom(room).member(memberRepository.findById(maxId).orElseThrow()).build();
    // chatRoomMemberRepository.save(m1);
    // chatRoomMemberRepository.save(m2);

    // return room;
    // });
    // return dmRoom;
    // }

    // 내 DM방 리스트
    public List<ChatRoom> findMyDmRooms(Long memberId) {
        List<ChatRoomMember> memberships = chatRoomMemberRepository.findByMemberId(memberId);
        return memberships.stream()
                .map(ChatRoomMember::getChatRoom)
                .filter(room -> room.getRoomType() == ChatRoomType.DM)
                .toList();
    }

    // DM방 참여자 리스트
    public List<Member> getMembers(Long roomId) {
        return chatRoomMemberRepository.findByChatRoomId(roomId)
                .stream().map(ChatRoomMember::getMember).toList();
    }
}