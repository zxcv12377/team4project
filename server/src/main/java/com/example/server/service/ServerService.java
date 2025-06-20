package com.example.server.service;

import com.example.server.dto.ChatRoomResponseDTO;
import com.example.server.dto.ServerRequestDTO;
import com.example.server.dto.ServerResponseDTO;
import com.example.server.entity.Server;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;
import com.example.server.entity.ServerMember;
import com.example.server.entity.ServerRole;
import com.example.server.repository.ServerRepository;
import com.example.server.repository.ServerMemberRepository;
import com.example.server.repository.ChatRoomRepository;
import com.example.server.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ServerService {

        private final ServerRepository serverRepository;
        private final ServerMemberRepository serverMemberRepository;
        private final MemberRepository memberRepository;
        private final ChatRoomRepository chatRoomRepository;

        @Transactional
        public ServerResponseDTO createServer(ServerRequestDTO dto, Long ownerId) {
                Member owner = memberRepository.findById(ownerId)
                                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

                Server server = Server.builder()
                                .name(dto.getName())
                                .description(dto.getDescription())
                                .build();
                serverRepository.save(server);

                // 서버 개설자에게 ADMIN 권한 부여
                ServerMember serverMember = ServerMember.builder()
                                .member(owner)
                                .server(server)
                                .role(ServerRole.ADMIN)
                                .build();
                serverMemberRepository.save(serverMember);

                return ServerResponseDTO.from(server);
        }

        @Transactional(readOnly = true)
        public List<ServerResponseDTO> getAllServers(Long memberId) {
                // "내가 참여한 서버"만 보여주려면 아래처럼
                List<ServerMember> joined = serverMemberRepository.findByMemberId(memberId);

                return joined.stream()
                                .map(ServerMember::getServer)
                                .map(ServerResponseDTO::from)
                                .collect(Collectors.toList());
        }

        @Transactional
        public void joinServer(Long serverId, Long memberId) {
                Server server = serverRepository.findById(serverId)
                                .orElseThrow(() -> new IllegalArgumentException("서버 없음"));

                // 이미 참여중이면 예외/무시
                boolean already = serverMemberRepository.existsByMemberIdAndServerId(memberId, serverId);
                if (already)
                        throw new IllegalStateException("이미 참여 중");

                Member member = memberRepository.findById(memberId)
                                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));

                ServerMember serverMember = ServerMember.builder()
                                .member(member)
                                .server(server)
                                .role(ServerRole.USER)
                                .build();
                serverMemberRepository.save(serverMember);
        }

        @Transactional
        public void deleteServer(Long serverId, Long memberId) {
                Server server = serverRepository.findById(serverId)
                                .orElseThrow(() -> new IllegalArgumentException("서버 없음"));

                // 개설자(Owner)만 삭제 허용
                ServerMember ownerMember = serverMemberRepository
                                .findByServerIdAndRole(serverId, ServerRole.ADMIN)
                                .orElseThrow(() -> new IllegalAccessError("서버 오너가 존재하지 않습니다."));

                if (!ownerMember.getMember().getId().equals(memberId)) {
                        throw new IllegalAccessError("서버 삭제 권한이 없습니다.");
                }
                serverRepository.delete(server);
        }

        @Transactional(readOnly = true)
        public List<ServerResponseDTO> searchServers(String keyword) {
                List<Server> servers;
                if (keyword == null || keyword.isBlank()) {
                        servers = serverRepository.findAll();
                } else {
                        servers = serverRepository.findByNameContainingIgnoreCase(keyword);
                }
                return servers.stream().map(ServerResponseDTO::from).collect(Collectors.toList());
        }

        // 서버별 채널 목록 조회
        public List<ChatRoomResponseDTO> getChannelsByServer(Long serverId) {
                Server server = serverRepository.findById(serverId)
                                .orElseThrow(() -> new IllegalArgumentException("서버 없음"));
                List<ChatRoom> channels = chatRoomRepository.findByServer(server);
                return channels.stream()
                                .map(room -> {
                                        // DTO에 서버 정보도 추가해서 반환
                                        ChatRoomResponseDTO dto = ChatRoomResponseDTO.from(room);
                                        dto.setServerId(server.getId());
                                        dto.setServerName(server.getName());
                                        // 필요시 ownerName 등 추가
                                        return dto;
                                })
                                .toList();
        }

}
