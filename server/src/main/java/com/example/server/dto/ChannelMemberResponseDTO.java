package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChannelMemberResponseDTO {

    private Long id; // ChannelMember PK
    private Long memberId; // Member PK
    private String name; // 멤버 이름
    private String email; // 멤버 아이디(이메일 등)
    private String profile; // (선택) 프로필 이미지
    private String role; // ADMIN / USER
    private boolean muted;
    private boolean banned;
}
