package com.example.server.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoardWithRepliesDTO {

   private BoardResponseDTO board;
   private List<ReplyDTO> replies;

}
