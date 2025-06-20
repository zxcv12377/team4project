package com.example.server.repository;

import com.example.server.entity.ChannelMember;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ChannelMemberRepository extends JpaRepository<ChannelMember, Long> {

    List<ChannelMember> findByRoom(ChatRoom room);

    List<ChannelMember> findByMember(Member member);

    Optional<ChannelMember> findByMemberAndRoom(Member member, ChatRoom room);

    Optional<ChannelMember> findByRoomIdAndMemberId(Long roomId, Long memberId);

    boolean existsByRoomIdAndMemberId(Long roomId, Long memberId);

    long countByRoom(ChatRoom room);

    @Transactional
    void deleteByRoomId(Long roomId);
}
