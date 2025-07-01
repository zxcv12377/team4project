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