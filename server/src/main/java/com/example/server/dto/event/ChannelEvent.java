package com.example.server.dto.event;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChannelEvent {

  private String type; // CHANNEL_CREATED / CHANNEL_DELETED / CHANNEL_UPDATED
  private Long serverId;
  private Long channelId;
  private String name;
  private String channelType; // TEXT / VOICE
}
