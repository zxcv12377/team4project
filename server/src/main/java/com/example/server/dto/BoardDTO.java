package com.example.server.dto;

import java.time.LocalDateTime;

import com.example.server.entity.Member;

import jakarta.validation.constraints.NotBlank;
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
public class BoardDTO {

    // BoardDTO
    // : 클라이언트 ↔ 서버 간 데이터 전달용 객체

    private Long bno;// 게시글 번호(기본 key)

    // 게시글 제목
    @NotBlank(message = "제목을 입력해 주세요") // 유효성 검사
    private String title;

    // 게시글 내용
    @NotBlank(message = "내용을 입력해 주세요")
    private String content;

    // 작성자 id
    private Long id;
    private String nickname;

    private LocalDateTime regDate;
    private LocalDateTime modDate;

    // 댓글 수
    private Long replyCount;

}
