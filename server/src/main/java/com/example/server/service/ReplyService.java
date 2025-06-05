package com.example.server.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.server.dto.ReplyDTO;
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

    // 댓글 삽입
    public Long create(ReplyDTO dto) {
        Member member = memberRepository.findById(dto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        Board board = boardRepository.findById(dto.getBno())
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));

        Reply reply = Reply.builder()
                .text(dto.getText())
                .member(member)
                .board(board)
                .build();

        return replyRepository.save(reply).getRno();
    }

    public List<ReplyDTO> getList(Long bno) {
        List<Reply> replies = replyRepository.findByBoardBno(bno);
        List<ReplyDTO> result = new ArrayList<>();

        for (Reply reply : replies) {
            result.add(entityToDto(reply));
        }

        return result;
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

    private Reply dtoToEntity(ReplyDTO dto, Member member, Board board) {
        return Reply.builder()
                .text(dto.getText())
                .member(member)
                .board(board)
                .build();
    }

}
