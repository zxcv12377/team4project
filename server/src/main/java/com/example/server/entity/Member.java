package com.example.server.entity;

import java.util.HashSet;
import java.util.Set;

import com.example.server.base.Base;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Entity
public class Member extends Base {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 회원번호
    @Column(unique = true)
    private String nickname; // 로그인 아이디
    @NotBlank
    private String password; // 비밀번호입니다!
    @NotBlank(message = "")
    private String email; // 이메일 인증용 입니다

    private boolean agree; // 약관 동의 입니다

    private String profileimg; // 프로필 사진입니다(이미지 경로넣기)

    private boolean emailVerified; // 이메일 인증여부

    @ElementCollection(fetch = FetchType.LAZY) // 1:N 관계로 테이블 생성
    @Builder.Default
    private Set<MemberRole> roleSet = new HashSet<>();

    public void addMemberRole(MemberRole memberRole) {
        roleSet.add(memberRole);
    }
}
