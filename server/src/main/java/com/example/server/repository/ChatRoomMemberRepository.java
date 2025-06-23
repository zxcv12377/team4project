package com.example.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

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
}
