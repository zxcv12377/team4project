package com.example.server.dto;

import com.example.server.entity.BoardChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BoardChannelDTO {

    private Long id;

    @NotBlank(message = "채널 이름은 필수입니다.")
    @Size(max = 15, message = "채널 이름은 15자 이하로 입력해주세요.")
    private String name;

    @Size(max = 200, message = "설명은 200자 이하로 입력해주세요.")
    private String description;

    /* ---------- 변환 메서드 ---------- */
    public static BoardChannelDTO fromEntity(BoardChannel e) {
        return BoardChannelDTO.builder()
                .id(e.getId())
                .name(e.getName())
                .description(e.getDescription())
                .build();
    }

    public BoardChannel toEntity() {
        return BoardChannel.builder()
                .id(id) // create 시 null, update 시 사용
                .name(name)
                .description(description)
                .build();
    }
}
