package com.example.server.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Log4j2
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtTokenProvider;
    // private final CustomMemberDetailsService userDetailsService;

    // private final List<String> excludeUris = List.of(
    // "/api/members/register",
    // "/api/members/login",
    // "/api/members/check-nickname",
    // "/api/members/find-id",
    // "/api/auth/email/send");

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        // 로그인, 회원가입, 리프레시 경로는 필터 예외 처리
        if ("/api/members/login".equals(uri) ||
                "/api/members/register".equals(uri) ||
                "/auth/refresh".equals(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            // 1. 엑세스 토큰 유효한 경우
            if (jwtTokenProvider.isTokenValid(token)) {
                Authentication auth = jwtTokenProvider.getAuthentication(token);
                setAuth(auth, request);
                log.info(" JWT 유효: {}", token);

            } else {
                // 2. 엑세스 토큰 만료 → 리프레시 토큰 확인
                String refreshHeader = request.getHeader("Authorization-Refresh");

                if (refreshHeader != null && refreshHeader.startsWith("Bearer ")) {
                    String refreshToken = refreshHeader.substring(7);

                    if (jwtTokenProvider.validateRefreshToken(refreshToken)) {
                        // 🔄 새 토큰 발급 및 인증 처리
                        String newAccessToken = jwtTokenProvider.generateAccessTokenFromRefresh(refreshToken);
                        Authentication auth = jwtTokenProvider.getAuthentication(newAccessToken);
                        setAuth(auth, request);

                        response.setHeader("Authorization", "Bearer " + newAccessToken);
                        log.info(" AccessToken 재발급 완료");

                    } else {
                        log.warn(" 유효하지 않은 Refresh Token: {}", refreshToken);
                    }
                } else {
                    log.warn(" Access Token 만료 및 Refresh Token 없음 or 비정상: {}", token);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void setAuth(Authentication auth, HttpServletRequest request) {
        if (auth instanceof AbstractAuthenticationToken aat) {
            aat.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(aat);
        } else {
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
    }
}
