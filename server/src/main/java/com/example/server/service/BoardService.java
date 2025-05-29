package com.example.server.service;

import org.springframework.stereotype.Service;

import com.example.server.dto.BoardDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.ReplyRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RequiredArgsConstructor
@Service
public class BoardService {

    private final BoardRepository boardRepository;
    private final ReplyRepository replyRepository;

    // 글 생성
    public Long create(BoardDTO dto) {
        Board board = dtoToEntity(dto);

        Board newBoard = boardRepository.save(board);
        return newBoard.getBno();
    }

    // 삭제
    @Transactional
    public void delete(Long bno) {

        // 댓글 삭제
        replyRepository.deleteByBoardBno(bno);

        boardRepository.deleteById(bno);
    }

    // 수정
    public Long update(BoardDTO dto) {
        Board board = boardRepository.findById(dto.getBno()).orElseThrow();

        board.changeTitle(dto.getTitle());
        board.changeContent(dto.getContant());
        boardRepository.save(board);

        return board.getBno();
    }

    private BoardDTO entityToDto(Board board, Member member, Long replyCount) {
        BoardDTO dto = BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .contant(board.getContent())
                .nickname(member.getNickname())
                .replyCount(replyCount)
                .build();

        return dto;
    }

    private Board dtoToEntity(BoardDTO dto) {
        Board board = Board.builder()
                .bno(dto.getBno())
                .title(dto.getTitle())
                .content(dto.getContant())
                .member(Member.builder().nickname(dto.getNickname()).build())
                .build();

        return board;
    }

}
