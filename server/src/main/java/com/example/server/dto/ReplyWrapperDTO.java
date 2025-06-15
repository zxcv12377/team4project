package com.example.server.dto;

import java.util.List;

public class ReplyWrapperDTO {

    private List<ReplyDTO> bestReplies;
    private List<ReplyDTO> normalReplies;

    public ReplyWrapperDTO(List<ReplyDTO> bestReplies, List<ReplyDTO> normalReplies) {
        this.bestReplies = bestReplies;
        this.normalReplies = normalReplies;
    }

    public List<ReplyDTO> getBestReplies() {
        return bestReplies;
    }

    public List<ReplyDTO> getNormalReplies() {
        return normalReplies;
    }
}
