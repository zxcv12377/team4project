package com.example.server.entity;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.example.server.base.Base;
import com.example.server.entity.enums.MemberRole;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.Table;
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
@Table(name = "member")
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

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<ChatRoomMember> chatRoomMembers;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<DmMember> dmMembers;

    @OneToMany(mappedBy = "memberA", cascade = CascadeType.ALL)
    private List<Friend> friendsA;

    @OneToMany(mappedBy = "memberB", cascade = CascadeType.ALL)
    private List<Friend> friendsB;

    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    private List<Invite> invites;

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    private List<Notification> notificationSender;

    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL)
    private List<Notification> notificationReceiver;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<ReplyLike> replyLikes;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<ServerMember> serverMembers;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<BoardLike> boardLikes;

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
