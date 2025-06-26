package com.example.server.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
import com.example.server.repository.SearchBoardRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

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

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private String toJson(List<String> list) {
        try {
            return list == null ? null : objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 직렬화 실패", e);
        }
    }

    private List<String> fromJson(String json) {
        try {
            return (json == null || json.isBlank()) ? List.of()
                    : objectMapper.readValue(json, new TypeReference<>() {
                    });
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }

    // create
    public Long create(BoardDTO dto) {
        // dto => entity(board) 변경
        Board board = dtoToEntity(dto);
        return boardRepository.save(board).getBno();
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

        return board.getBno();
    }

    // 4. 게시글 페이징 목록
    public PageResultDTO<BoardDTO> getList(PageRequestDTO pageRequestDTO) {

        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize(),
                Sort.by("bno").descending());

        Page<Object[]> result = boardRepository.getBoardList(
                pageRequestDTO.getType(),
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

    // 5. 게시글 상세 조회
    public BoardDTO getRow(Long bno) {
        Object[] result = boardRepository.getBoardRow(bno);
        return entityToDto((Board) result[0], (Member) result[1], (Long) result[2]);
    }

    // ====== DTO 변환 메서드 ======
    private BoardDTO entityToDto(Board board, Member member, Long replyCount) {

        List<String> attachments = fromJson(board.getAttachmentsJson());

        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent()) // 상세보기에만 사용
                .id(member != null ? member.getId() : null)// 작성자id
                .attachments(attachments)
                .regDate(board.getCreatedDate())
                .replyCount(replyCount != null ? replyCount : 0L)
                .build();
    }

    private Board dtoToEntity(BoardDTO dto) {
        Member member = memberRepository.findById(dto.getId())
                .orElseThrow(() -> new IllegalArgumentException("No member found with id: " + dto.getId()));

        Board board = Board.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .attachmentsJson(toJson(dto.getAttachments()))
                .member(member)
                .build();
        return board;
    }

}
