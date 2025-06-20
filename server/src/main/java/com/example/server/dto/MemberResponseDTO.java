package com.example.server.dto;

import lombok.*;
import com.example.server.entity.Member;
import com.fasterxml.jackson.annotation.JsonProperty;

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
