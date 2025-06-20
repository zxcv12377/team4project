package com.example.server.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.server.entity.Member;
import com.example.server.entity.MemberRole;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.security.Principal;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
public class CustomMemberDetails implements UserDetails, Principal {

    private final Member member;

    public CustomMemberDetails(Member member) {
        this.member = member;
    }

    // 이메일(ID) 반환
    public String getEmail() {
        return member.getEmail();
    }

    // 회원 번호 반환
    public Long getId() {
        return member.getId();
    }

    // 닉네임 반환
    public String getNickname() {
        return member.getNickname();
    }

    // 권한 목록 반환
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<MemberRole> roles = member.getRoles();
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toList());
    }

    // 비밀번호 반환
    @Override
    public String getPassword() {
        return member.getPassword();
    }

    // ** Spring Security의 "username" → email 사용 **
    @Override
    public String getUsername() {
        return member.getEmail();
    }

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
        throw new UnsupportedOperationException("Unimplemented method 'getName'");
    }
}
