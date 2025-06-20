// package com.example.server.mapper;

// import com.example.server.dto.MemberRequestDTO;
// import com.example.server.dto.MemberResponseDTO;
// import com.example.server.entity.Member;
// import com.example.server.security.dto.MemberSecurityDTO;

// public class MemberMapper {

// // DTO → Entity
// public static Member toEntity(MemberRequestDTO dto) {
// return Member.builder()
// .email(dto.getEmail())
// .password(dto.getPassword()) // 실무에서는 반드시 암호화 필요
// .nickname(dto.getNickname())
// .emailVerified(false) // 기본값
// .build();
// }

// // Entity → DTO
// public static MemberResponseDTO toDTO(Member member) {
// return MemberResponseDTO.builder()
// .mno(member.getMno())
// .memberId(member.getMno())
// .username(member.getUsername())
// .name(member.getName())
// .build();
// }

// // MemberSecurityDTO → Member 변환 추가
// public static Member toEntity(MemberSecurityDTO dto) {
// return Member.builder()
// .username(dto.getUsername())
// .password(dto.getPassword())
// .name(dto.getName())
// .build();
// }
// }
