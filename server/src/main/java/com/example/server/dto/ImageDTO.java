package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImageDTO {
    private String originalUrl;
    private String thumbnailUrl;

    // String 하나만 받으면 둘 다 같은 값으로 초기화!
    public ImageDTO(String url) {
        this.originalUrl = url;
        this.thumbnailUrl = url;
    }
}

// Board (게시글)
// - bno (PK)
// - title
// - content
// - created_date
// - ...

// Image (첨부 이미지)
// - id (PK)
// - board_bno (FK) ← 게시글과 연결
// - original_url
// - thumbnail_url
// - created_at
// → Board 1 : N Image 관계
// → 게시글이 삭제되면 cascade로 이미지도 삭제 가능