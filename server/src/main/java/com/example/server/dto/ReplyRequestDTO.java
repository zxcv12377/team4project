package com.example.server.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyRequestDTO {

    private Long bno;
    @NotBlank(message = "댓글을 입력해주세요.")
    private String text;
    private Long parentRno;
    // 사용자 식별
    private String nickname;
    private Long channel; // 댓글이 속한 채널 ID

}
