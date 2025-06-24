package com.example.server.service;

import java.time.LocalDateTime;
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

    // create
    public Long create(BoardDTO dto) {
        // dto => entity(board) 변경
        Board board = dtoToEntity(dto);
        Board newBoard = boardRepository.save(board);
        return newBoard.getBno();
    }

    // Delete
    @Transactional
    public void delete(Long bno) {
        replyRepository.deleteByBoardBno(bno);
        boardRepository.deleteById(bno);
    }

    // Update
    @Transactional
    public Long update(BoardDTO dto) {
        Board board = boardRepository.findById(dto.getBno()).orElseThrow();

        board.changeTitle(dto.getTitle());
        board.changeContent(dto.getContent());
        // boardRepository.save(board);

        return board.getBno();
    }

    // 4. 페이징 목록 조회
    // Object[]를 DTO로 바꾸고 리스트로 감쌉니다.
    // .map(function)으로 게시글마다 BoardDTO로 변환합니다.
    public PageResultDTO<BoardDTO> getList(PageRequestDTO pageRequestDTO) {

        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize(),
                Sort.by("bno").descending());

        Page<Object[]> result = boardRepository.getBoardList(pageRequestDTO.getType(),
                pageRequestDTO.getKeyword(), pageable);
        System.out.println(result);

        Function<Object[], BoardDTO> function = (en -> BoardDTO.builder()
                .bno((Long) en[0])
                .title((String) en[1])
                .content((String) en[2])
                .regDate((LocalDateTime) en[3])
                .modDate((LocalDateTime) en[4])
                .id((Long) en[5])
                .nickname((String) en[6])
                .email((String) en[7])
                .replyCount((Long) en[8])
                .build());

        return PageResultDTO.<BoardDTO>withAll()
                .dtoList(result.map(function).getContent())
                .totalCount(result.getTotalElements())
                .pageRequestDTO(pageRequestDTO)
                .build();
    }

    public BoardDTO getRow(Long bno) {
        Object[] result = boardRepository.getBoardRow(bno);
        return entityToDto((Board) result[0], (Member) result[1], (Long) result[2]);
    }

    // ====== 변환 메서드 ======
    private BoardDTO entityToDto(Board board, Member member, Long replyCount) {
        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent()) // 상세보기에만 사용
                .id(member != null ? member.getId() : null)// 작성자id
                .regDate(board.getRegDate())
                .replyCount(replyCount != null ? replyCount : 0L)
                .build();
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
