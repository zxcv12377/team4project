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
        // dto => entity(board) 변경
        Board board = dtoToEntity(dto);
        // 저장
        Board newBoard = boardRepository.save(board);
        return newBoard.getBno();
    }

    // 삭제
    @Transactional // 두개의 테이블 접근 => 한꺼번에 처리
    public void delete(Long bno) {

        // 댓글 삭제
        replyRepository.deleteByBoardBno(bno);
        boardRepository.deleteById(bno);
    }

    // 수정
    public Long update(BoardDTO dto) {
        // 수정할 대상 찾기(Id 로 찾기)
        Board board = boardRepository.findById(dto.getBno()).orElseThrow();
        // 내용 업데이트
        board.changeTitle(dto.getTitle());
        board.changeContent(dto.getContant());
        // 저장
        boardRepository.save(board);

        return board.getBno();
    }

    // // 게시판 조회
    // public PageResultDTO<BoardDTO> getList(PageRequestDTO pageRequestDTO) {

    // // 페이지 설정 객체 생성
    // Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1,
    // pageRequestDTO.getSize(),
    // Sort.by("bno").descending());

    // // DB에서 페이징+검색 쿼리 실행
    // Page<Object[]> result = boardRepository.list(pageRequestDTO.getType(),
    // pageRequestDTO.getKeyword(),
    // pageable);

    // // 엔티티 => DTO로 변환
    // // Function<T,R> : T => R 로 변환
    // Function<Object[], BoardDTO> fn = (entity -> entityToDto((Board) entity[0],
    // (Member) entity[1],
    // (Long) entity[2])); // Function<Object[], BoardDTO>: 배열 형태의 결과 → BoardDTO로 변환

    // // 스트림을 이용해 DTO 리스트 생성
    // List<BoardDTO> dtoList =
    // result.stream().map(fn).collect(Collectors.toList());
    // // 총 게시글 수 구하기
    // Long totalCount = result.getTotalElements();

    // // PageResultDTO에 결과 담기
    // PageResultDTO<BoardDTO> pageResultDTO = PageResultDTO.<BoardDTO>withAll()
    // .dtoList(dtoList)
    // .totalCount(totalCount)
    // .pageRequestDTO(pageRequestDTO)
    // .build();

    // return pageResultDTO;
    // }

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
