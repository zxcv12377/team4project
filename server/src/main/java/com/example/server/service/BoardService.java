package com.example.server.service;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
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

    // create
    public Long create(BoardDTO dto) {
        // dto => entity(board) 변경
        Board board = dtoToEntity(dto);
        Board newBoard = boardRepository.save(board);
        return newBoard.getBno();
    }

    // Delete
    @Transactional
public void delete(Long bno, Long requesterId) {
    Board board = boardRepository.findById(bno)
            .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다."));

    if (!board.getMember().getId().equals(requesterId)) {
        throw new AccessDeniedException("작성자만 삭제할 수 있습니다.");
    }

    boardRepository.delete(board);
}

    // Update
    @Transactional
    public void update(Long bno, BoardDTO dto, Long requesterId) {
    Board board = boardRepository.findById(bno)
            .orElseThrow(() -> new IllegalArgumentException("해당 게시글이 존재하지 않습니다."));

    // 작성자 확인
    if (!board.getMember().getId().equals(requesterId)) {
        throw new AccessDeniedException("작성자만 수정할 수 있습니다.");
    }

    board.changeTitle(dto.getTitle());
    board.changeContent(dto.getContent());
}

    // 4. 페이징 목록 조회
    public PageResultDTO<BoardDTO> getList(PageRequestDTO pageRequestDTO) {
        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize(),
                Sort.by("bno").descending());

        Page<Object[]> result = boardRepository.list(pageRequestDTO.getType(),
                pageRequestDTO.getKeyword(), pageable);
        System.out.println(result);
        Function<Object[], BoardDTO> function = (en -> entityToDto((Board) en[0], (Member) en[1], (Long) en[2]));

        List<BoardDTO> dtoList = result.stream().map(function).collect(Collectors.toList());
        Long totalCount = result.getTotalElements();
        // List<BoardDTO> dtoList = result.stream()
        // .map(board -> entityToDto(board, board.getMember(), (long)
        // board.getReplies().size()))
        // .collect(Collectors.toList());

        PageResultDTO<BoardDTO> pageResultDTO = PageResultDTO.<BoardDTO>withAll()
                .dtoList(dtoList)
                .totalCount(totalCount)
                .pageRequestDTO(pageRequestDTO)
                .build();
        return pageResultDTO;
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
                .memberId(board.getMember().getId())
                .nickname(member.getNickname())
                .replyCount(replyCount)
                .build();
        return dto;
    }

    private Board dtoToEntity(BoardDTO dto) {
        Member member = memberRepository.findById(dto.getId())
                .orElseThrow(() -> new IllegalArgumentException("No member found with id: " + dto.getId()));

        Board board = Board.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .member(member)
                .build();
        return board;
    }

}
