package com.example.server.jwt;

import com.example.server.security.CustomMemberDetails;
import com.example.server.security.CustomMemberDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Log4j2
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomMemberDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String token = getTokenFromRequest(request);
        log.info("요청에서 추출된 토큰: {}", token);
        if (token != null) {
            if (!jwtUtil.isTokenValid(token)) {
                log.warn("유효하지 않은 토큰: {}", token);
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "유효하지 않은 토큰입니다.");
                return;
            }

            String email = jwtUtil.validateAndGetSubject(token);
            log.info("추출된 email: '{}'", email);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                CustomMemberDetails userDetails = (CustomMemberDetails) userDetailsService.loadUserByUsername(email);
                log.info("인증된 사용자 정보: {}", userDetails);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.info("SecurityContext에 인증 정보 설정 완료");
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        log.info("JWT 인증 필터 실행");

        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            log.info("Authorization 헤더에서 토큰 추출: {}", bearer);
            return bearer.substring(7); // "Bearer " 이후 부분만 추출
        }
        return null;
    }
}
