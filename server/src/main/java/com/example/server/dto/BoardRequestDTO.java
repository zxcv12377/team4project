package com.example.server.dto;

import java.util.List;

import lombok.*;

@Setter
@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BoardRequestDTO {
    private String title;
    private String content;
    private String username; // 작성자 식별용

    private List<String> attachments; // 첨부파일 리스트 (PDF, zip 등)
}
