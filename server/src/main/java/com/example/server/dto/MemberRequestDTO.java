package com.example.server.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberRequestDTO {

    @NotBlank
    private String email; // 이메일
    @NotBlank
    private String password;
    @NotBlank
    private String nickname;
}
