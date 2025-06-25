package com.example.server.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardResponseDTO {

    private Long bno;
    private String title;
    private String content;
    private String writerName; // 작성자 출력용
    private String createdDate; // 엔티티의 Base에서 수동으로 넣어줌
    private String modifiedDate;

}
