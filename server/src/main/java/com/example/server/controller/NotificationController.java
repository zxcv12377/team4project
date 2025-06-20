package com.example.server.controller;

import com.example.server.dto.NotificationDTO;
import com.example.server.security.CustomMemberDetails;
import com.example.server.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 사용자의 알림 목록 조회
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(
            @AuthenticationPrincipal CustomMemberDetails member) {
        return ResponseEntity.ok(notificationService.getUserNotifications(member.getUsername()));
    }

    // 읽지 않은 알림 개수 조회
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal CustomMemberDetails member) {
        long count = notificationService.getUnreadCount(member.getUsername());
        return ResponseEntity.ok(Map.of("count", count));
    }

    // 알림 읽음 처리
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    // 모든 알림 읽음 처리
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal CustomMemberDetails member) {
        notificationService.markAllAsRead(member.getUsername());
        return ResponseEntity.ok().build();
    }
}