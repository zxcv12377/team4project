package com.example.server.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.server.entity.ChatRoom;
import com.example.server.entity.DmMember;
import com.example.server.entity.Member;

public interface DmMemberRepository extends JpaRepository<DmMember, Long> {
    List<DmMember> findByChatRoom(ChatRoom chatRoom);

    List<DmMember> findByMember(Member member);

    Optional<DmMember> findByChatRoomAndMember(ChatRoom chatRoom, Member member);
}
