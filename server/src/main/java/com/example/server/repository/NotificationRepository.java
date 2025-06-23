package com.example.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.server.entity.Member;
import com.example.server.entity.Notification;
import com.example.server.entity.enums.NotificationType;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
        // 사용자의 모든 알림 조회 (최신순)
        List<Notification> findByReceiverEmailOrderByCreatedAtDesc(String email);

        // 사용자의 읽지 않은 알림 개수 조회
        long countByReceiverEmailAndIsReadFalse(String email);

        // 특정 게시글/댓글과 관련된 알림 조회
        @Query("SELECT n FROM Notification n WHERE n.referenceId = :referenceId AND n.type = :type")
        List<Notification> findByReferenceIdAndType(@Param("referenceId") Long referenceId,
                        @Param("type") NotificationType type);

        // 사용자의 특정 타입의 알림 조회
        List<Notification> findByReceiverEmailAndTypeOrderByCreatedAtDesc(String email,
                        NotificationType type);

        // 사용자의 모든 알림을 읽음 처리
        @Query("UPDATE Notification n SET n.isRead = true WHERE n.receiver.email = :email")
        void markAllAsRead(@Param("email") String email);

        void deleteAllBySender(Member member);
        void deleteAllByReceiver(Member member);
}
