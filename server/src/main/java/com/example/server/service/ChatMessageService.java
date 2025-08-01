package com.example.server.service;

import com.example.server.dto.event.DmRestoreEvent;
import com.example.server.entity.ChatMessageEntity;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.ChatRoomMember;
import com.example.server.entity.Member;
import com.example.server.repository.ChatMessageRepository;
import com.example.server.repository.ChatRoomMemberRepository;
import com.example.server.repository.ChatRoomRepository;
import com.example.server.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.hibernate.Hibernate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

        private final ChatMessageRepository chatMessageRepository;
        private final MemberRepository memberRepository;
        private final ChatRoomRepository chatRoomRepository;
        private final ChatRoomMemberRepository chatRoomMemberRepository;
        private final ApplicationEventPublisher eventPublisher;

        // 채팅방 메시지 조회
        public List<ChatMessageEntity> getMessagesByRoomId(Long roomId, Long memberId) {
                ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음"));
                LocalDateTime leftAt = chatRoomMemberRepository.findByChatRoomIdAndMemberId(roomId, memberId)
                                .map(ChatRoomMember::getLeftAt)
                                .orElse(null);
                if (leftAt != null) {
                        return chatMessageRepository.findByRoomAndSentAtAfterOrderBySentAtAsc(chatRoom,
                                        leftAt);
                } else {
                        return chatMessageRepository.findByRoomOrderBySentAtAsc(chatRoom);
                }
        }

        public void handleMessage(Long roomId, String message, String email) {
                // DB에 저장
                Member sender = memberRepository.findByEmail(email)
                                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

                ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음"));

                List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoomId(roomId);

                for (ChatRoomMember member : members) {
                        Long memberId = member.getMember().getId();
                        if (!memberId.equals(sender.getId())) {
                                if (!member.isVisible()) {
                                        member.setVisible(true);
                                        chatRoomMemberRepository.save(member);
                                        log.info("✅ 숨김 해제 및 visible 복구: memberId={}", memberId);
                                        Hibernate.initialize(member.getMember());
                                        // WebSocket 알림
                                        eventPublisher.publishEvent(
                                                        new DmRestoreEvent(member.getMember().getEmail(), roomId));
                                }
                        }
                }

                ChatMessageEntity chatMessage = ChatMessageEntity.builder()
                                .room(chatRoom)
                                .message(message)
                                .sentAt(LocalDateTime.now())
                                .sender(sender)
                                .build();
                chatMessageRepository.save(chatMessage);

        }
}
