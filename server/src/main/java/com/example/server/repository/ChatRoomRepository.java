package com.example.server.repository;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.Server;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    // 채팅방 이름으로 조회
    // Optional을 사용하여 이름이 없을 경우를 처리
    Optional<ChatRoom> findByName(String name);

    // List<ChatRoom> findByRoomTypeAndMembersMno(ChatRoomType roomType, Long
    // memberId);

    @Query("""
            SELECT r
            FROM ChatRoom r
            JOIN r.members m1
            JOIN r.members m2
            WHERE r.roomType = com.example.server.entity.enums.ChatRoomType.DM
              AND (
                (m1.member.id = :id1 AND m2.member.id = :id2)
                OR
                (m1.member.id = :id2 AND m2.member.id = :id1)
              )
            """)
    Optional<ChatRoom> findDmRoomBetween(
            @Param("id1") Long id1,
            @Param("id2") Long id2);

    List<ChatRoom> findByServer(Server server);

    @Query("""
            SELECT DISTINCT r
            FROM ChatRoom r
            JOIN r.members crm
            WHERE r.roomType = com.example.server.entity.enums.ChatRoomType.DM
              AND crm.member.id = :memberId
            """)
    List<ChatRoom> findMyDmRooms(@Param("memberId") Long memberId);
}
