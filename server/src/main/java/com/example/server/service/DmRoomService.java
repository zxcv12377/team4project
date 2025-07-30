package com.example.server.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.server.dto.ChatRoomResponseDTO;
import com.example.server.dto.event.DmRestoreEvent;
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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DmRoomService {

        private final ChatRoomRepository chatRoomRepository;
        private final ChatRoomMemberRepository chatRoomMemberRepository;
        private final MemberRepository memberRepository;
        private final SimpMessagingTemplate messagingTemplate;
        private final ApplicationEventPublisher eventPublisher;

        // ✅ 1:1 DM방 생성 또는 기존방 조회 (중복 방지)
        @Transactional
        public ChatRoom getOrCreateDmRoom(Long memberAId, Long memberBId) {
                log.info("🔍 DM 생성 or 조회 요청: memberAId={}, memberBId={}", memberAId, memberBId);

                if (memberAId == null || memberBId == null) {
                        throw new IllegalArgumentException("memberAId, memberBId는 null 불가");
                }

                Long minId = Math.min(memberAId, memberBId);
                Long maxId = Math.max(memberAId, memberBId);

                boolean minUserExists = memberRepository.existsById(minId);
                boolean maxUserExists = memberRepository.existsById(maxId);

                if (!minUserExists || !maxUserExists) {
                        throw new IllegalArgumentException("❌ 대상 유저 없음");
                }

                Optional<ChatRoom> existingRoomOpt = chatRoomRepository.findDmRoomBetween(minId, maxId);
                if (existingRoomOpt.isPresent()) {
                        ChatRoom existingRoom = existingRoomOpt.get();
                        log.info("✅ 기존 DM방 반환: roomId={}", existingRoom.getId());

                        // ✅ 숨김 상태였으면 복구
                        List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoomId(existingRoom.getId());
                        boolean restored = false;
                        for (ChatRoomMember member : members) {
                                if (!member.isVisible()) {
                                        member.setVisible(true);
                                        chatRoomMemberRepository.save(member);
                                        restored = true;
                                        log.info("✅ DM 숨김 해제됨: memberId={}", member.getMember().getId());
                                }
                        }

                        // ✅ 만약 방금 visible 복구가 있었다면 WebSocket 복구 알림 전송
                        if (restored) {
                                for (ChatRoomMember member : members) {
                                        eventPublisher.publishEvent(
                                                        new DmRestoreEvent(member.getMember().getEmail(),
                                                                        existingRoom.getId()));
                                }
                        }

                        return existingRoom;
                }

                // ✅ 새 방 생성 로직 (기존 그대로 유지)
                ChatRoom newRoom = ChatRoom.builder()
                                .name("DM-" + minId + "-" + maxId)
                                .roomType(ChatRoomType.DM)
                                .type(ChannelType.TEXT)
                                .server(null)
                                .build();
                chatRoomRepository.save(newRoom);

                Member minUser = memberRepository.findById(minId)
                                .orElseThrow(() -> new RuntimeException("❌ minId 유저 없음"));
                Member maxUser = memberRepository.findById(maxId)
                                .orElseThrow(() -> new RuntimeException("❌ maxId 유저 없음"));

                chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(newRoom).member(minUser).build());
                chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(newRoom).member(maxUser).build());

                log.info("✅ 새 DM방 생성 완료: roomId={}", newRoom.getId());

                for (Long targetId : List.of(minId, maxId)) {
                        Member targetUser = memberRepository.findById(targetId)
                                        .orElseThrow(() -> new RuntimeException("❌ target 유저 없음"));

                        messagingTemplate.convertAndSendToUser(
                                        targetUser.getEmail(),
                                        "/queue/dm-restore",
                                        Map.of("roomId", newRoom.getId(), "status", "NEW"));
                        log.info("📡 WebSocket 전송 → targetUser={}", targetUser.getEmail());
                }

                return newRoom;
        }

        // ✅ 내가 속한 DM방 목록 반환 (visible = true 만)
        public List<ChatRoomResponseDTO> findMyDmRooms(Long myId) {
                log.info("📥 DM방 리스트 조회 요청: memberId={}", myId);
                List<ChatRoomMember> rooms = chatRoomMemberRepository.findByMemberIdAndVisibleTrue(myId);

                return rooms.stream()
                                .map(room -> ChatRoomResponseDTO.from(room.getChatRoom(), myId))
                                .toList();
        }

        // ✅ 특정 DM방 참여자 리스트 반환
        public List<Member> getMembers(Long roomId) {
                log.info("📥 DM 참여자 리스트 조회: roomId={}", roomId);
                return chatRoomMemberRepository.findByChatRoomId(roomId)
                                .stream().map(ChatRoomMember::getMember).toList();
        }

        @Transactional
        public void hideDmRoom(Long roomId, Long memberId) {
                log.info("🛑 DM 숨김 요청: roomId={}, memberId={}", roomId, memberId);

                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new RuntimeException("채팅방 없음"));

                if (room.getRoomType() != ChatRoomType.DM) {
                        log.error("❌ DM방 아님 → 숨김 불가");
                        throw new IllegalStateException("서버 채널은 숨길 수 없음");
                }

                chatRoomMemberRepository.markAsHidden(roomId, memberId, LocalDateTime.now());
                log.info("✅ [JPQL] DM 숨김 처리 완료");
        }

        @Transactional
        public void restoreDmIfHidden(Long roomId, Long memberId) {
                log.info("🔄 DM 복구 요청: roomId={}, memberId={}", roomId, memberId);

                chatRoomMemberRepository.findByChatRoomIdAndMemberId(roomId, memberId).ifPresent(cm -> {
                        if (!cm.isVisible()) {
                                cm.setVisible(true);
                                chatRoomMemberRepository.save(cm);
                                log.info("✅ DM visible 복구 완료");
                        }
                });
        }

        // ✅ visible=true인 DM방 리스트만 리턴 (다른 곳에서 사용 가능성 있음)
        public List<ChatRoom> getVisibleDmRooms(Long memberId) {
                log.info("📥 visible=true DM방만 조회: memberId={}", memberId);
                List<ChatRoomMember> visibleRooms = chatRoomMemberRepository.findByMemberIdAndVisibleTrue(memberId);
                return visibleRooms.stream()
                                .map(ChatRoomMember::getChatRoom)
                                .toList();
        }
}