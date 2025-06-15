package com.example.server.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberRequestDTO {

    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email; // 이메일

    @NotBlank(message = "비밀번호는 필수 입력입니다.")
    private String password;

    @NotBlank(message = "닉네임은 필수 입력입니다.")
    private String nickname;

    private String profileimg;

}
