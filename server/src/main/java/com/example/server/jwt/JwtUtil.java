package com.example.server.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.log4j.Log4j2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.example.server.security.CustomMemberDetailsService;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Log4j2
@Component
public class JwtUtil {

    // JWT 비밀 키(application.properties에서 설정)
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long validityInMilliseconds;

    private Key key;

    private final CustomMemberDetailsService customMemberDetailsService;

    // 토큰 유효시간: 1시간
    // private static final long EXPIRATION_TIME_MS = 1000 * 60 * 60 * 1;

    public JwtUtil(CustomMemberDetailsService customMemberDetailsService) {
        this.customMemberDetailsService = customMemberDetailsService;
    }

    @PostConstruct
    public void init() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    // 토큰 생성
    public String generateToken(String email, String nickname) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .setSubject(email) //
                .claim("nickname", nickname)
                .setIssuedAt(now) // 토큰 발급 시간
                .setExpiration(expiry) // 토큰 만료 시간
                .signWith(key)
                .compact();
    }

    // 토큰에서 이메일 추출
    public String validateAndGetSubject(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Cannot parse JWT subject: {}", e.getMessage());
            return null;
        }
    }

    // 토큰 유효성 확인
    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT 파싱 실패: {}", e.getMessage());
        }
        return false;
    }

    // claim 파싱 메서드 추가!
    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Authentication getAuthentication(String token) {
        // Claims claims = parseClaims(token);
        String email = getEmail(token); // 또는 memberId
        var userDetails = customMemberDetailsService.loadUserByUsername(email);
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities()); // 권한 필요 시
                                                                                                       // List<GrantedAuthority>
                                                                                                       // 전달
    }

    public String getEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String createToken(String subject, long validityMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + validityMs);

        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key)
                .compact();
    }

}
