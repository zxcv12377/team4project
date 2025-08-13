package com.example.server.repository;

import com.example.server.entity.ChannelMember;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;

import io.lettuce.core.dynamic.annotation.Param;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
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

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ChannelMember cm where cm.member.id = :memberId")
    int deleteMemberships(@Param("memberId") Long memberId);
}
