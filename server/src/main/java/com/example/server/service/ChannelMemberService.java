package com.example.server.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.server.dto.ChannelMemberResponseDTO;
import com.example.server.entity.ChannelMember;
import com.example.server.entity.ChatRoom;
import com.example.server.entity.Member;
import com.example.server.entity.enums.ChannelRole;
import com.example.server.repository.ChannelMemberRepository;
import com.example.server.repository.ChatRoomRepository;
import com.example.server.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChannelMemberService {

        private final ChannelMemberRepository channelMemberRepository;
        private final MemberRepository memberRepository;
        private final ChatRoomRepository chatRoomRepository;

        // 채널 입장
        public ChannelMember joinChannel(Long memberId, Long roomId, ChannelRole role) {
                Member member = memberRepository.findById(memberId)
                                .orElseThrow(() -> new IllegalArgumentException("멤버 없음"));
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음"));

                if (channelMemberRepository.findByMemberAndRoom(member, room).isPresent())
                        throw new RuntimeException("이미 입장한 채널");

                ChannelMember channelMember = ChannelMember.builder()
                                .member(member)
                                .room(room)
                                .role(role) // 기본 역할은 USER
                                .muted(false)
                                .banned(false)
                                .speaking(false)
                                .build();
                return channelMemberRepository.save(channelMember);
        }

        // 채널 멤버 리스트
        public List<ChannelMemberResponseDTO> listMembers(Long roomId) {
                ChatRoom room = chatRoomRepository.findById(roomId)
                                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음"));
                List<ChannelMember> members = channelMemberRepository.findByRoom(room);

                return members.stream().map(cm -> new ChannelMemberResponseDTO(
                                cm.getId(),
                                cm.getMember().getId(),
                                cm.getMember().getNickname(),
                                cm.getMember().getEmail(),
                                cm.getMember().getProfileimg(), // 프로필 이미지 있으면
                                cm.getRole().name(),
                                cm.isMuted(),
                                cm.isBanned())).toList();
        }

        public void leaveChannel(Member member, ChatRoom room) {
                channelMemberRepository.findByRoom(room).stream()
                                .filter(vcm -> vcm.getMember().getId().equals(member.getId()))
                                .findFirst()
                                .ifPresent(channelMemberRepository::delete);
        }

        public long getCurrentParticipantCount(ChatRoom room) {
                return channelMemberRepository.countByRoom(room);
        }

        public void updateSpeakingStatus(Member member, ChatRoom room, boolean speaking) {
                channelMemberRepository.findByRoom(room).stream()
                                .filter(vcm -> vcm.getMember().getId().equals(member.getId()))
                                .findFirst()
                                .ifPresent(vcm -> {
                                        vcm.setSpeaking(speaking);
                                        channelMemberRepository.save(vcm);
                                });
        }
}