package com.example.server.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.server.dto.ReplyDTO;
import com.example.server.dto.ReplyResponseDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.Reply;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RequiredArgsConstructor
@Service
public class ReplyService {

    private final ReplyRepository replyRepository;
    private final MemberRepository memberRepository;
    private final BoardRepository boardRepository;

    // 댓글 등록
    public Long create(ReplyDTO dto) {
        Member member = memberRepository.findByNickname(dto.getNickname())
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        Board board = boardRepository.findById(dto.getBno())
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));

        Reply parent = null;
        if (dto.getParentRno() != null) {
            parent = replyRepository.findById(dto.getParentRno())
                    .orElseThrow(() -> new IllegalArgumentException("Parent reply not found"));
        }

        Reply reply = Reply.builder()
                .text(dto.getText())
                .board(board)
                .member(member)
                .parent(parent)
                .build();

        return replyRepository.save(reply).getRno();
    }

    public List<ReplyResponseDTO> getList(Long bno) {
        List<Reply> parentReplies = replyRepository.findByBoardBnoAndParentIsNullOrderByCreatedDateAsc(bno);
        return parentReplies.stream()
                .map(this::toResponseDTOWithChildren)
                .collect(Collectors.toList());
    }

    // 댓글 하나 가져오기
    public ReplyDTO get(Long rno) {
        Reply reply = replyRepository.findById(rno).get();
        return entityToDto(reply);
    }

    // 댓글 수정하기
    public Long update(ReplyDTO dto) {
        Reply reply = replyRepository.findById(dto.getRno()).get();
        reply.updateText(dto.getText());
        return replyRepository.save(reply).getRno();
    }

    // 삭제
    public void delete(Long rno) {
        replyRepository.deleteById(rno);
    }

    private ReplyDTO entityToDto(Reply reply) {
        ReplyDTO dto = ReplyDTO.builder()
                .rno(reply.getRno())
                .text(reply.getText())
                .id(reply.getMember().getId())
                .nickname(reply.getMember().getNickname())
                .bno(reply.getBoard().getBno())
                .createdDate(reply.getCreatedDate())
                .build();

        return dto;
    }

    private ReplyResponseDTO toResponseDTOWithChildren(Reply reply) {
        return ReplyResponseDTO.builder()
                .rno(reply.getRno())
                .text(reply.getText())
                .nickname(reply.getMember().getNickname())
                .createdDate(reply.getCreatedDate())
                .deleted(reply.isDeleted())
                .children(reply.getChildren().stream()
                        .map(this::toResponseDTOWithChildren) // 재귀 호출
                        .collect(Collectors.toList()))
                .build();
    }

}
