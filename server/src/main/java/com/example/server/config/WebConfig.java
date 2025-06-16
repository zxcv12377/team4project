package com.example.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 프론트엔드에서 호출할 API 경로
                .allowedOrigins("http://localhost:5173") // React 개발 서버 주소
                .allowedMethods("*") // GET, POST, PUT 등
                .allowedHeaders("*") // 모든 헤더 허용
                .allowCredentials(true); // ★ JSESSIONID 쿠키 허용
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
<<<<<<< HEAD
                .addResourceLocations("file:uploads/");
=======
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/");
>>>>>>> 506068dc6a91cc0510b3fd11b34ca7d294aa2924
    }

}