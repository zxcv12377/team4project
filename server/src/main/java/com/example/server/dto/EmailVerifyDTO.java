package com.example.server.dto;

import lombok.Data;

@Data
// 인증코드 검증 요청 dto
public class EmailVerifyDTO {
    
    private String email;
    private String newPassword;
    private String code;
}
