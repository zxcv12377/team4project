package com.example.server.service;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2 
@RequiredArgsConstructor 
@Service 
public class BoardService {

    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final ReplyRepository replyRepository;


    //create
    public Long create(BoardDTO dto) {
        // dto => entity(board) 변경
        Board board = dtoToEntity(dto);
        Board newBoard = boardRepository.save(board);
        return newBoard.getBno();
    }

    //Delete
    @Transactional
    public void delete(Long bno) {
        replyRepository.deleteByBoardBno(bno); 
        boardRepository.deleteById(bno);
    }

    // Update
    public Long update(BoardDTO dto) {
        Board board = boardRepository.findById(dto.getBno()).orElseThrow();

        board.changeTitle(dto.getTitle());
        board.changeContent(dto.getContent());
        boardRepository.save(board);

        return board.getBno();
    }

// 4. 페이징 목록 조회
    public PageResultDTO<BoardDTO> getList(PageRequestDTO pageRequestDTO) {
        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize(),
                Sort.by("bno").descending()
        );

        Page<Board> result = boardRepository.findAll(pageable);

        List<BoardDTO> dtoList = result.stream()
                .map(board -> entityToDto(board, board.getMember(), (long) board.getReplies().size()))
                .collect(Collectors.toList());

        return PageResultDTO.<BoardDTO>withAll()
                .dtoList(dtoList)
                .pageRequestDTO(pageRequestDTO)
                .totalCount(result.getTotalElements())
                .build();
    }

public BoardDTO getRow(Long bno) {
    Board board = boardRepository.findById(bno).orElseThrow();
    return entityToDto(board, board.getMember(), (long) board.getReplies().size());
}

    // ====== 변환 메서드 ======
    private BoardDTO entityToDto(Board board, Member member, Long replyCount) {
        BoardDTO dto = BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .id(member.getId())
                .nickname(member.getNickname())
                .replyCount(replyCount)
                .build();
        return dto;
    }

    
private Board dtoToEntity(BoardDTO dto) {
    Member member = memberRepository.findById(dto.getId())
            .orElseThrow(() -> new IllegalArgumentException("No member found with id: " + dto.getId()));

    Board board = Board.builder()
            .bno(dto.getBno())
            .title(dto.getTitle())
            .content(dto.getContent())
            .member(member) 
            .build();
    return board;
}


}
