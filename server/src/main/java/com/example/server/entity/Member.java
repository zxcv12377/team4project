package com.example.server.entity;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.example.server.base.Base;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
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

    @NotBlank(message = "이메일을 입력해주세요")
    @Column(unique = true, nullable = false)
    private String email; // 이메일(id)

    @NotBlank(message = "닉네임을 입력해주세요")
    private String nickname; // 로그인 아이디

    @NotBlank(message = "비밀번호를 입력해주세요")
    private String password; // 비밀번호

    private boolean agree; // 약관 동의 입니다

    private String profileimg; // 프로필 사진입니다(이미지 경로넣기)

    private boolean emailVerified; // 이메일 인증여부

    @Column(name = "user_comment", length = 500)
    private String comment; // 코멘트 넣기(500자까지)

    // 다중 권한 지원 (USER, ADMIN)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "member_roles", joinColumns = @JoinColumn(name = "member_id"))
    @Column(name = "role")
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Set<MemberRole> roles = new HashSet<>();

    // 선택: 양방향 관계
    @OneToMany(mappedBy = "member")
    private List<Board> boards;

    @OneToMany(mappedBy = "member")
    private List<Reply> replies;

    @OneToMany(mappedBy = "member")
    private List<VoiceChatLog> voiceLogs;

    // 기본 권한 부여 메서드(db 저장 전 호출)
    // 회원가입 시 기본적으로 USER 권한을 부여
    @PrePersist
    public void setDefaultRoleIfEmpty() {
        if (roles.isEmpty()) {
            roles.add(MemberRole.USER);
        }
        if (profileimg == null) {
            profileimg = "default.png";
        }
    }

}
