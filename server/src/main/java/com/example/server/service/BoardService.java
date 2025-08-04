package com.example.server.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.server.dto.BoardDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.entity.Board;
import com.example.server.entity.BoardLike;
import com.example.server.entity.Member;
import com.example.server.repository.BoardLikeRepository;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyRepository;
import com.example.server.security.CustomMemberDetails;
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
    private final BoardLikeRepository boardLikeRepository;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public boolean toggleBoardLike(Long bno, Member member) {
        Board board = boardRepository.findById(bno).orElseThrow();

        // 좋아요 중복 확인
        Optional<BoardLike> existing = boardLikeRepository.findByBoardAndMember(board, member);

        if (existing.isPresent()) {
            // 이미 누른 경우 → 삭제 (좋아요 취소)
            boardLikeRepository.delete(existing.get());
            return false; // 좋아요 취소
        } else {
            // 안 누른 경우 → 추가
            BoardLike like = BoardLike.builder()
                    .board(board)
                    .member(member)
                    .build();

            boardLikeRepository.save(like);
            return true; // 좋아요 등록
        }
    }

    // 게시글 등록
    public Long create(BoardDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomMemberDetails userDetails = (CustomMemberDetails) auth.getPrincipal();
        Member loginMember = memberRepository.findById(userDetails.getId()).orElseThrow();

        String attachmentsJson = "[]"; // ← 기본값으로 빈 배열 JSON

        try {
            // null도 허용 → 항상 JSON 문자열로 변환
            attachmentsJson = objectMapper.writeValueAsString(
                    Optional.ofNullable(dto.getAttachments()).orElse(List.of()));
        } catch (Exception e) {
            log.error("❌ attachments 직렬화 실패: {}", e.getMessage());
        }

        Board board = Board.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .member(loginMember)
                .attachments(attachmentsJson)
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
                .viewCount((Long) en[5]) //
                .boardLikeCount((Long) en[6])
                .build());

        return PageResultDTO.<BoardDTO>withAll()
                .dtoList(result.map(function).getContent())
                .totalCount(result.getTotalElements())
                .pageRequestDTO(pageRequestDTO)
                .build();
    }

    // 상세조회 시 조회수 증가 포함
    public BoardDTO getRow(Long bno) {
        Board board = boardRepository.findById(bno).orElseThrow();
        board.increaseViewCount(); // 조회수 +1

        Object[] result = boardRepository.getBoardRow(bno);
        return entityToDto((Board) result[0], (Member) result[1], (Long) result[2]);
    }

    public List<BoardDTO> getBoardsByWriterEmail(String email) {
        Member member = memberRepository.findByEmail(email).orElseThrow();
        List<Board> boards = boardRepository.findAllByMember(member);

        return boards.stream()
                .map(board -> entityToDto(board, member, null))
                .toList();
    }

    // 좋아요 처리 API용
    @Transactional
    public void increaseLike(Long bno) {
        Board board = boardRepository.findById(bno).orElseThrow();
        board.increaseBoardLikeCount();// 좋아요 +1
    }

    private BoardDTO entityToDto(Board board, Member member, Long replyCount) {

        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .createdDate(board.getCreatedDate())
                .updatedDate(board.getUpdatedDate())
                .memberid(member != null ? member.getId() : null)
                .nickname(member != null ? member.getNickname() : null)
                .replyCount(replyCount != null ? replyCount : 0L)
                .viewCount(board.getViewCount()) //
                .boardLikeCount(board.getBoardLikeCount())
                .build();
    }

}
