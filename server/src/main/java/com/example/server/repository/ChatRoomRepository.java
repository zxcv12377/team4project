package com.example.server.repository;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.Server;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    // 채팅방 이름으로 조회
    // Optional을 사용하여 이름이 없을 경우를 처리
    Optional<ChatRoom> findByName(String name);

    // List<ChatRoom> findByRoomTypeAndMembersMno(ChatRoomType roomType, Long
    // memberId);

    @Query("""
                SELECT r FROM ChatRoom r
                JOIN DmMember m1 ON m1.chatRoom = r
                JOIN DmMember m2 ON m2.chatRoom = r
                WHERE r.roomType = 'DM'
                AND m1.member.id = :id1
                AND m2.member.id = :id2
            """)
    Optional<ChatRoom> findDmRoomBetween(Long id1, Long id2);

    List<ChatRoom> findByServer(Server server);

    ChatRoom findByRoomKey(String roomKey);
}
