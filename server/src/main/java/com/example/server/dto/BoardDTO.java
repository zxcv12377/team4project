package com.example.server.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
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
    private String email;

    // 작성자 id
    private Long memberid;
    private String nickname;

    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    // 댓글 수
    private Long replyCount;

    // 프론트에 넘겨줄 이미지 리스트
    private List<String> attachments;

}
