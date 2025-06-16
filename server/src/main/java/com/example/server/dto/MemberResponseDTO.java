package com.example.server.dto;

import lombok.*;
import com.example.server.entity.Member;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberResponseDTO {
    private Long mno;
    private String email;
    private String nickname;
    private String profileimg;

}
