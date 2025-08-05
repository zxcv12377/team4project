package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BoardViewResponseDTO {
    private BoardDTO boardDTO;
    // 쿠키를 갱신해야 할 경우, 새로운 쿠키 값을 담는다. 갱신이 필요 없으면 null.
    private String newCookieValue;
}
