package com.example.server.dto;

import com.example.server.entity.ServerMember;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServerMemberResponseDTO {
    private Long id; // 참여자 ID
    private String name; // 참여자 이름
    private String profile; // 프로필 이미지
    private String role; // "ADMIN", "USER"

    public static ServerMemberResponseDTO from(ServerMember entity) {
        return ServerMemberResponseDTO.builder()
                .id(entity.getMember().getId()) // 실제 참여자 ID
                .name(entity.getMember().getNickname()) // 참여자 이름
                .profile(entity.getMember().getProfileimg()) // 프로필
                .role(entity.getRole().name()) // "ADMIN" or "USER"
                .build();
    }

}