package com.example.server.repository;

import com.example.server.entity.Server;
import com.example.server.entity.ServerMember;
import com.example.server.entity.ServerRole;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerMemberRepository extends JpaRepository<ServerMember, Long> {
    List<ServerMember> findByMemberId(Long id);

    boolean existsByMemberIdAndServerId(Long id, Long serverId);

    Optional<ServerMember> findByServerIdAndRole(Long serverId, ServerRole role);

    List<ServerMember> findByServer(Server server);

    Optional<ServerMember> findByMemberIdAndServerId(Long id, Long serverId);
}
