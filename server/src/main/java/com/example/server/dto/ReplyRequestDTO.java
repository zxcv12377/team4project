package com.example.server.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyRequestDTO {

    private Long bno;
    private String text;
    private Long parentRno;
    // 사용자 식별
    private String nickname;

}
