package com.example.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class ChannelBannerUploadDTO {
    private Long id;
    private String paths;
    private Long channelId;
}
