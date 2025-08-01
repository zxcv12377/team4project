package com.example.server.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.server.dto.ServerMemberResponseDTO;
import com.example.server.dto.event.ServerMemberEvent;
import com.example.server.entity.Member;
import com.example.server.entity.Server;
import com.example.server.entity.ServerMember;
import com.example.server.entity.enums.ServerRole;
import com.example.server.infra.EventPublisher;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ServerMemberRepository;
import com.example.server.repository.ServerRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ServerMemberService {
    private final ServerRepository serverRepository;
    private final ServerMemberRepository serverMemberRepository;
    private final MemberRepository memberRepository;
    private final EventPublisher eventPublisher;

    // 서버 참여자 목록 반환
    @Transactional(readOnly = true)
    public List<ServerMemberResponseDTO> getServerMembers(Long serverId) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new IllegalArgumentException("서버 없음"));
        List<ServerMember> list = serverMemberRepository.findByServer(server);
        return list.stream().map(ServerMemberResponseDTO::from).toList();
    }

    // 서버 멤버 강퇴
    @Transactional
    public void removeServerMember(Long serverId, Long memberId) {
        ServerMember serverMember = serverMemberRepository.findByMemberIdAndServerId(memberId, serverId)
                .orElseThrow(() -> new IllegalArgumentException("해당 멤버가 서버에 없음"));
        serverMemberRepository.delete(serverMember);

        ServerMemberEvent event = new ServerMemberEvent(serverId, memberId, "KICK");
        eventPublisher.publishServerMemberEvent(event);
    }

    // 서버 멤버 권한 변경
    @Transactional
    public void changeServerMemberRole(Long serverId, Long memberId, ServerRole newRole) {
        ServerMember serverMember = serverMemberRepository.findByMemberIdAndServerId(memberId, serverId)
                .orElseThrow(() -> new IllegalArgumentException("해당 멤버가 서버에 없음"));
        serverMember.setRole(newRole);
        serverMemberRepository.save(serverMember);
    }

    // 중복 참여 체크 및 참여 추가
    @Transactional
    public void joinServer(Long serverId, Long memberId) {
        boolean exists = serverMemberRepository.existsByMemberIdAndServerId(memberId, serverId);
        if (exists)
            throw new IllegalStateException("이미 참여 중");
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new IllegalArgumentException("서버 없음"));
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        ServerMember serverMember = ServerMember.builder()
                .server(server)
                .member(member)
                .role(ServerRole.USER)
                .build();
        serverMemberRepository.save(serverMember);
        ServerMemberEvent event = new ServerMemberEvent(serverId, memberId, "JOIN");
        eventPublisher.publishServerMemberEvent(event);
    }

    // (선택) 참여자의 권한 반환
    @Transactional(readOnly = true)
    public String getMemberRole(Long serverId, Long memberId) {
        Optional<ServerMember> sm = serverMemberRepository.findByMemberIdAndServerId(memberId, serverId);
        return sm.map(serverMember -> serverMember.getRole().name()).orElse(null);
    }

    @Transactional
    public void leaveServer(Long serverId, Long memberId) {
        ServerMember serverMember = serverMemberRepository
                .findByMemberIdAndServerId(memberId, serverId)
                .orElseThrow(() -> new IllegalArgumentException("서버 참여 정보가 없습니다."));
        serverMemberRepository.delete(serverMember);

        // 실시간 퇴장 전파
        ServerMemberEvent event = new ServerMemberEvent(serverId, memberId, "LEAVE");
        eventPublisher.publishServerMemberEvent(event);
    }
}
