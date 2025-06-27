package com.example.server.dto;

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

}
