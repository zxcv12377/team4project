package com.example.server.dto;

import lombok.Data;

@Data
    // 인증 코드 전송 요청 dto
public class EmailRequestDTO {
    private String email;
    private String nickname;
    private String password;
    private String token;
}
