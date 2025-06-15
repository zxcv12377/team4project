package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

// @Builder : PageRequestDTO.builder().build()
// @SuperBuilder : 상속관계에서도 안전하게 사용 / 서브 클래스가 이 클래스를 상속할 때 부모필드도 함께 빌더로 생성 가능
// @Builder.Default : 빌더로 객체를 생성할 때 필드가 포함 안되는 경우 사용할 기본값 지정
//                    PageRequestDTO.builder().build() => page=1, size=10

@NoArgsConstructor
@AllArgsConstructor
@Data
@SuperBuilder
public class PageRequestDTO {

    @Builder.Default
    private int page = 1;

    @Builder.Default
    private int size = 10;

    // 검색
    private String type;
    private String keyword;

}
