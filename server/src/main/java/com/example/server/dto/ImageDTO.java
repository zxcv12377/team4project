package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor // 기본 생성자 필요 시
@AllArgsConstructor // 모든 필드를 초기화하는 생성자 자동 생성
public class ImageDTO {
    private String originalUrl;
    private String thumbnailUrl;

    // 썸네일이 필요 없는 경우에도 명확하게 작성 가능
    public static ImageDTO fromSingleUrl(String url) {
        return new ImageDTO(url, url);
    }
}
