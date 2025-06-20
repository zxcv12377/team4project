package com.example.server.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.dto.NotificationDTO;
import com.example.server.entity.Member;
import com.example.server.entity.Notification;
import com.example.server.entity.enums.NotificationType;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// boardapi/src/main/java/com/example/boardapi/service/NotificationService.java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

        private final NotificationRepository notificationRepository;
        private final WebSocketEventService webSocketEventService;
        private final MemberRepository memberRepository;

        // 알림 생성 및 발송
        public void createAndSendNotification(String sederEmail, String receiverEmail,
                        NotificationType type, String message, Long referenceId) {
                Member sender = memberRepository.findByEmail(sederEmail)
                                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
                Member receiver = memberRepository.findByEmail(receiverEmail)
                                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

                Notification notification = Notification.builder()
                                .type(type)
                                .message(message)
                                .sender(sender)
                                .receiver(receiver)
                                .referenceId(referenceId)
                                .isRead(false)
                                .build();

                notificationRepository.save(notification);

                // WebSocket으로 실시간 알림 전송
                webSocketEventService.publishNotification(
                                receiverEmail,
                                type.name(),
                                NotificationDTO.from(notification));
        }

        // 사용자의 알림 목록 조회
        public List<NotificationDTO> getUserNotifications(String email) {
                return notificationRepository.findByReceiverEmailOrderByCreatedAtDesc(email)
                                .stream()
                                .map(NotificationDTO::from)
                                .collect(Collectors.toList());
        }

        // 알림 읽음 처리
        public void markAsRead(Long notificationId) {
                Notification notification = notificationRepository.findById(notificationId)
                                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
                notification.markAsRead();
                notificationRepository.save(notification);
        }

        // 읽지 않은 알림 개수 조회
        public long getUnreadCount(String email) {
                return notificationRepository.countByReceiverEmailAndIsReadFalse(email);
        }

        // 모든 알림 읽음 처리
        @Transactional
        public void markAllAsRead(String email) {
                notificationRepository.markAllAsRead(email);
        }
}