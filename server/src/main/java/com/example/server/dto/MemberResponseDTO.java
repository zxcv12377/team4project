package com.example.server.dto;

import java.util.Set;

import com.example.server.entity.enums.MemberRole;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberResponseDTO {
    private Long id;
    private String email;
    private String nickname;
    private String profileimg;
    private String comment;
    private Set<MemberRole> roles;

}
