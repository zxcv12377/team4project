package com.example.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

import jakarta.annotation.PostConstruct;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 프론트엔드에서 호출할 API 경로
                .allowedOrigins(allowedOrigins) // React 개발 서버 주소
                .allowedMethods("*") // GET, POST, PUT 등
                .allowedHeaders("*") // 모든 헤더 허용
                .allowCredentials(true) // ★ JSESSIONID 쿠키 허용
                .maxAge(3600); // 1시간
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // // 서버의 실제 경로
        // String path = "file:" + System.getProperty("user.dir") + "/uploads/";

        // // 클라이언트가 접근할 수 있도록 정적 리소스 매핑
        // registry.addResourceHandler("/uploads/**")
        // .addResourceLocations(path)
        // .setCachePeriod(3600); // (선택 사항) 캐시 시간 설정

        // // API 주소 패턴에서도 접근 허용 (예외적으로 필요 시)
        // registry.addResourceHandler("/api/uploads/**")
        // .addResourceLocations(path);

        String path = "file:" + System.getProperty("user.dir") + "/uploads/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(path)
                .setCachePeriod(3600);

        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations(path);
    }

    @PostConstruct
    public void init() {
        System.out.println("✅ allowedOrigins = " + allowedOrigins);
        System.out.println("📁 현재 작업 디렉토리 (user.dir): " + System.getProperty("user.dir"));
    }
}