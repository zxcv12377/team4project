package com.example.server.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.ChatRoomMember;
import com.example.server.entity.Member;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

        // 채팅방 기준으로 모든 참여자 가져오기
        List<ChatRoomMember> findByChatRoom(ChatRoom chatRoom);

        // 채팅방 ID 기준으로 참여자 가져오기
        List<ChatRoomMember> findByChatRoomId(Long chatRoomId);

        List<ChatRoomMember> findByMember(Member member);

        List<ChatRoomMember> findByMemberId(Long memberId);

        boolean existsByChatRoomIdAndMemberId(Long chatRoomId, Long memberId);

        Optional<ChatRoomMember> findByChatRoomIdAndMemberId(Long chatRoomId, Long memberId);

        List<ChatRoomMember> findByMemberIdAndVisibleTrue(Long memberId);

        @Transactional
        @Modifying
        @Query("""
                            UPDATE ChatRoomMember cm
                            SET cm.visible = false, cm.leftAt = :leftAt
                            WHERE cm.chatRoom.id = :roomId AND cm.member.Id = :memberId
                        """)
        void markAsHidden(@Param("roomId") Long roomId, @Param("memberId") Long memberId,
                        @Param("leftAt") LocalDateTime leftAt);

}
