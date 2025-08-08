package com.example.server.repository;

import com.example.server.entity.Server;
import com.example.server.entity.ServerMember;
import com.example.server.entity.enums.ServerRole;

import io.lettuce.core.dynamic.annotation.Param;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ServerMemberRepository extends JpaRepository<ServerMember, Long> {
    List<ServerMember> findByMemberId(Long id);

    boolean existsByMemberIdAndServerId(Long id, Long serverId);

    Optional<ServerMember> findByServerIdAndRole(Long serverId, ServerRole role);

    List<ServerMember> findByServer(Server server);

    Optional<ServerMember> findByMemberIdAndServerId(Long id, Long serverId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ServerMember sm where sm.member.id = :memberId")
    int deleteMemberships(@Param("memberId") Long memberId);
}
