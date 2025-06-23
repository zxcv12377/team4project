package com.example.server.dto;

import lombok.Data;

@Data
public class EmailVerifyDTO {
    private String email;
    private String newPassword;
    private String code;
}
