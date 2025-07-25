package com.example.server.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.ImageDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyRepository;
import com.example.server.security.CustomMemberDetails;
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

    // 이미지 첨부 → JSON 문자열로 변환 (ImageDTO)
    private String toJson(List<ImageDTO> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            throw new RuntimeException("JSON 직렬화 실패", e);
        }
    }
    // private String toJson(List<ImageDTO> list) {
    // try {
    // return list == null ? null : objectMapper.writeValueAsString(list);
    // } catch (JsonProcessingException e) {
    // throw new RuntimeException("JSON 직렬화 실패", e);
    // }
    // }

    // JSON 문자열 → 이미지 첨부 리스트 (ImageDTO)
    private List<ImageDTO> fromJson(String json) {
        try {
            return (json == null || json.isBlank()) ? List.of()
                    : objectMapper.readValue(json, new TypeReference<List<ImageDTO>>() {
                    });
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }

    // 게시글 등록
    public Long create(BoardDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomMemberDetails userDetails = (CustomMemberDetails) auth.getPrincipal();
        Member loginMember = memberRepository.findById(userDetails.getId()).orElseThrow();

        Board board = Board.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .attachmentsJson(toJson(dto.getAttachments())) // ✅ ImageDTO로 저장
                .member(loginMember)
                .build();

        return boardRepository.save(board).getBno();
    }

    // 게시글 삭제
    @Transactional
    public void delete(Long bno) {
        replyRepository.deleteByBoardBno(bno);
        boardRepository.deleteById(bno);
    }

    // 게시글 수정
    @Transactional
    public Long update(BoardDTO dto) {
        Board board = boardRepository.findById(dto.getBno()).orElseThrow();

        board.changeTitle(dto.getTitle());
        board.changeContent(dto.getContent());
        board.changeAttachments(toJson(dto.getAttachments())); // ImageDTO 직렬화

        return board.getBno();
    }

    // 게시글 목록
    public PageResultDTO<BoardDTO> getList(PageRequestDTO pageRequestDTO) {

        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize(),
                Sort.by("bno").descending());

        Page<Object[]> result = boardRepository.getBoardList(
                pageRequestDTO.getType(),
                pageRequestDTO.getKeyword(), pageable);

        Function<Object[], BoardDTO> function = (en -> BoardDTO.builder()
                .bno((Long) en[0])
                .title((String) en[1])
                .createdDate((LocalDateTime) en[2])
                .nickname((String) en[3])
                .replyCount((Long) en[4])
                .attachments(fromJson((String) en[5])) // JSON → ImageDTO
                .build());

        return PageResultDTO.<BoardDTO>withAll()
                .dtoList(result.map(function).getContent())
                .totalCount(result.getTotalElements())
                .pageRequestDTO(pageRequestDTO)
                .build();
    }

    // 게시글 상세조회
    public BoardDTO getRow(Long bno) {
        Object[] result = boardRepository.getBoardRow(bno);
        return entityToDto((Board) result[0], (Member) result[1], (Long) result[2]);
    }

    public List<BoardDTO> getBoardsByWriterEmail(String email) {
        Member member = memberRepository.findByEmail(email).orElseThrow();
        List<Board> boards = boardRepository.findAllByMember(member);

        return boards.stream()
                // replycount는 기존 entitytodto재활용할거라 null로 지정했습니다
                .map(board -> entityToDto(board, member, null))
                .toList();
    }

    private BoardDTO entityToDto(Board board, Member member, Long replyCount) {
        List<ImageDTO> attachments = fromJson(board.getAttachmentsJson()); // ImageDTO 리스트

        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .createdDate(board.getCreatedDate())
                .updatedDate(board.getUpdatedDate())
                .memberid(member != null ? member.getId() : null)
                .nickname(member != null ? member.getNickname() : null)
                .replyCount(replyCount != null ? replyCount : 0L)
                .attachments(attachments) // ImageDTO 세팅
                .build();
    }
}
