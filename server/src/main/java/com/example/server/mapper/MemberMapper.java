package com.example.server.mapper;

import com.example.server.dto.MemberRequestDTO;
import com.example.server.dto.MemberResponseDTO;
import com.example.server.entity.Member;

public class MemberMapper {

    // DTO → Entity
    public static Member toEntity(MemberRequestDTO dto) {
        return Member.builder()
                .email(dto.getEmail())
                .password(dto.getPassword()) // 실무에서는 반드시 암호화 필요
                .nickname(dto.getNickname())
                .emailVerified(false)
                .profileimg(dto.getProfileimg() != null ? dto.getProfileimg() : "default.png")
                .agree(false)
                .comment(dto.getComment())
                .build();
    }

    // Entity → DTO

    public static MemberResponseDTO toDTO(Member member) {
        return MemberResponseDTO.builder()
                .id(member.getId())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .profileimg(member.getProfileimg())
                .comment(member.getComment())
                .roles(member.getRoles())
                .build();
    }
}
