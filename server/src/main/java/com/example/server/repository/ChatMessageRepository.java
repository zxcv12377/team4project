package com.example.server.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.entity.ChatMessageEntity;
import com.example.server.entity.ChatRoom;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {
    List<ChatMessageEntity> findByRoomOrderBySentAtAsc(ChatRoom room);

    List<ChatMessageEntity> findByRoomAndSentAtAfterOrderBySentAtAsc(ChatRoom room, LocalDateTime sentAt);

    @Transactional
    @Modifying
    @Query("DELETE FROM ChatMessageEntity m WHERE m.room.id = :roomId")
    void deleteByRoomId(@Param("roomId") Long roomId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ChatMessageEntity c set c.sender.id = :ghostId where c.sender.id = :memberId")
    int reassignSender(@Param("ghostId") Long ghostId, @Param("memberId") Long memberId);
}
