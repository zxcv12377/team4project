package com.example.server.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyResponseDTO {

    private Long rno;
    private String text;
    private String nickname;
    private LocalDateTime createdDate;
    private boolean deleted;

    private List<ReplyResponseDTO> children; // 대댓글 리스트

    private Long likeCount; // 추천 수

    private String badge; // 작성자, 관리자, null

    private Long writerId;

}
