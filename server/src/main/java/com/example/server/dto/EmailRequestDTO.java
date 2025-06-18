package com.example.server.dto;

import lombok.Data;

@Data
public class EmailRequestDTO {
    private String email;
    private String nickname;
    private String password;
    private String token;
}
