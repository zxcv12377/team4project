package com.example.server.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.server.entity.Member;
import com.example.server.entity.enums.MemberRole;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.security.Principal;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CustomMemberDetails implements UserDetails, Principal {

    // private final Member member;
    private Long id;
    private String email;
    private String password;
    private String nickname;
    private Set<MemberRole> roles;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toList());

    }

    // 회원 번호 반환
    public Long getId() {
        return id;
    }

    // 비밀번호 반환
    @Override
    public String getPassword() {
        return password;
    }

    // ** Spring Security의 "username" → email 사용 **

    // 계정 상태 관련 (필요 시 수정 가능)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public String getName() {
        return email;
    }

    @Override
    public String getUsername() {
        return email;
    }

    public static CustomMemberDetails from(Member member) {
        return CustomMemberDetails.builder()
                .id(member.getId())
                .email(member.getEmail())
                .password(member.getPassword())
                .nickname(member.getNickname())
                .roles(member.getRoles())
                .build();
    }
}
