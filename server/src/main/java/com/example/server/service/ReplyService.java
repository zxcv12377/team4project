package com.example.server.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.server.dto.ReplyDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.Reply;
import com.example.server.repository.ReplyRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RequiredArgsConstructor
@Service
public class ReplyService {

    private final ReplyRepository replyRepository;

    // 댓글 삽입
    public Long create(ReplyDTO dto) {
        Reply reply = dtoToEntity(dto);

        return replyRepository.save(reply).getRno();
    }

    // public List<ReplyDTO> getList(Long bno) {
    // Board board = Board.builder().bno(bno).build();
    // List<Reply> result = replyRepository.findByBoardByRno(board);

    // return result.stream().map(reply ->
    // entityToDto(reply)).collect(Collectors.toList());
    // }

    // 댓글 하나 가져오기
    public ReplyDTO get(Long rno) {
        Reply reply = replyRepository.findById(rno).get();
        return entityToDto(reply);
    }

    // 댓글 수정하기
    public Long update(ReplyDTO dto) {
        Reply reply = replyRepository.findById(dto.getBno()).get();
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

    private Reply dtoToEntity(ReplyDTO dto) {
        Reply reply = Reply.builder()
                .rno(dto.getRno())
                .text(dto.getText())
                .member(Member.builder().nickname(dto.getNickname()).build())
                .board(Board.builder().bno(dto.getBno()).build())
                .build();

        return reply;
    }

}
