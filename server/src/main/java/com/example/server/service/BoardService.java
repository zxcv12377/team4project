package com.example.server.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
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
import com.example.server.dto.BoardViewResponseDTO;
import com.example.server.dto.ImageDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.entity.Board;
import com.example.server.entity.BoardChannel;
import com.example.server.entity.BoardLike;
import com.example.server.entity.Member;
import com.example.server.entity.BoardViewLog;
import com.example.server.entity.Reply;
import com.example.server.repository.BoardChannelRepository;
import com.example.server.repository.BoardLikeRepository;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.BoardViewLogRepository;
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
    private final BoardChannelRepository boardChannelRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final BoardViewLogRepository boardViewLogRepository;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private String toJson(List<ImageDTO> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            throw new RuntimeException("JSON 직렬화 실패", e);
        }
    }

    private List<ImageDTO> fromJson(String json) {
        try {
            return (json == null || json.isBlank()) ? List.of()
                    : objectMapper.readValue(json, new TypeReference<List<ImageDTO>>() {
                    });
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }

    @Transactional
    public boolean toggleBoardLike(Long bno, Member member) {
        Board board = boardRepository.findById(bno).orElseThrow();

        Optional<BoardLike> existing = boardLikeRepository.findByBoardAndMember(board, member);

        if (existing.isPresent()) { // 취소
            boardLikeRepository.delete(existing.get());
            board.setBoardLikeCount(board.getBoardLikeCount() - 1);
            boardRepository.save(board);
            return false;
        } else { // 등록
            BoardLike like = BoardLike.builder()
                    .board(board)
                    .member(member)
                    .build();
            boardLikeRepository.save(like);
            board.setBoardLikeCount(board.getBoardLikeCount() + 1);
            boardRepository.save(board);
            return true;
        }
    }

    // 추천 수 조회
    @Transactional
    public Long getLikeCount(Long bno) {
        Board board = boardRepository.findById(bno)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        return boardLikeRepository.countByBoard(board);
    }

    public Long create(BoardDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomMemberDetails userDetails = (CustomMemberDetails) auth.getPrincipal();
        Member loginMember = memberRepository.findById(userDetails.getId()).orElseThrow();

        BoardChannel channel = boardChannelRepository.findById(dto.getChannelId())
                .orElseThrow(() -> new RuntimeException("채널 없음"));

        Board board = Board.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .attachmentsJson(toJson(dto.getAttachments()))
                .member(loginMember)
                .channel(channel)
                .build();

        return boardRepository.save(board).getBno();
    }

    @Transactional
    public void delete(Long bno) {
        replyRepository.deleteByBoardBno(bno);
        boardRepository.deleteById(bno);
    }

    @Transactional
    public Long update(BoardDTO dto) {
        Board board = boardRepository.findById(dto.getBno())
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        if (dto.getChannelId() != null) {
            BoardChannel channel = boardChannelRepository.findById(dto.getChannelId())
                    .orElseThrow(() -> new RuntimeException("채널이 존재하지 않습니다."));
            board.setChannel(channel);
        }

        board.setTitle(dto.getTitle());
        board.setContent(dto.getContent());
        board.setAttachmentsJson(toJson(dto.getAttachments()));

        return boardRepository.save(board).getBno();
    }

    public PageResultDTO<BoardDTO> getList(PageRequestDTO pageRequestDTO) {

        Pageable pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize(),
                Sort.by("bno").descending());

        Page<Object[]> result = boardRepository.getBoardList(
                pageRequestDTO.getType(),
                pageRequestDTO.getKeyword(), pageable);

        Function<Object[], BoardDTO> fn = en -> BoardDTO.builder()
                .bno((Long) en[0])
                .title((String) en[1])
                .createdDate((LocalDateTime) en[2])
                .nickname((String) en[3])
                .replyCount((Long) en[4])
                .attachments(fromJson((String) en[5]))
                .viewCount((Long) en[6])
                .boardLikeCount((Long) en[7])
                .channelId((Long) en[8])
                .channelName((String) en[9])
                .build();

        return PageResultDTO.<BoardDTO>withAll()
                .dtoList(result.map(fn).getContent())
                .totalCount(result.getTotalElements())
                .pageRequestDTO(pageRequestDTO)
                .build();
    }

    @Transactional
    public BoardViewResponseDTO getRow(Long bno, String viewedBoardsCookie) {
        Board board = boardRepository.findById(bno)
                .orElseThrow(() -> new NoSuchElementException("게시글을 찾을 수 없습니다. bno=" + bno));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String newCookieValue = null;

        // 1. 로그인 사용자 처리
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof CustomMemberDetails) {
            CustomMemberDetails userDetails = (CustomMemberDetails) authentication.getPrincipal();
            Member member = memberRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다. ID: " + userDetails.getId()));

            if (!boardViewLogRepository.existsByBoardAndMember(board, member)) {
                board.increaseViewCount(); // 조회수 증가
                BoardViewLog viewLog = BoardViewLog.builder().board(board).member(member).build();
                boardViewLogRepository.save(viewLog); // 조회 기록 저장
            }
        }
        // 2. 비로그인 사용자 처리 (쿠키 기반)
        else {
            boolean alreadyViewed = false;
            String bnoStr = String.valueOf(bno);

            if (viewedBoardsCookie != null && !viewedBoardsCookie.isBlank()) {
                // 쿠키 값에 현재 게시글 ID가 있는지 확인
                if (viewedBoardsCookie.contains("[" + bnoStr + "]")) {
                    alreadyViewed = true;
                }
            }

            if (!alreadyViewed) {
                board.increaseViewCount(); // 조회수 증가
                // 컨트롤러에서 쿠키를 생성할 수 있도록 새로운 쿠키 값을 준비
                newCookieValue = (viewedBoardsCookie == null ? "" : viewedBoardsCookie) + "[" + bnoStr + "]";
            }
        }

        Object[] result = boardRepository.getBoardRow(bno);
        BoardDTO boardDTO;
        if (result == null) {
            // getBoardRow가 결과를 못찾는 경우 (삭제 직후 등)
            boardDTO = entityToDto(board, board.getMember(), 0L);
        } else {
            boardDTO = entityToDto((Board) result[0], (Member) result[1], (Long) result[2]);
        }

        return new BoardViewResponseDTO(boardDTO, newCookieValue);
    }

    public List<BoardDTO> getBoardsByChannel(Long channelId) {

        BoardChannel channel = boardChannelRepository.findById(channelId)
                .orElseThrow(() -> new NoSuchElementException("채널 없음 id=" + channelId));

        List<Board> boards = "전체게시판".equals(channel.getName())
                ? boardRepository.findAll()
                : boardRepository.findByChannelId(channelId);

        return boards.stream()
                .map(b -> entityToDto(b, b.getMember(), null))
                .collect(Collectors.toList());
    }

    public List<BoardDTO> getBoardsByWriterEmail(String email) {
        Member member = memberRepository.findByEmail(email).orElseThrow();
        return boardRepository.findAllByMember(member)
                .stream()
                .map(b -> entityToDto(b, member, null))
                .collect(Collectors.toList());
    }

    private BoardDTO entityToDto(Board board, Member member, Long replyCount) {
        List<ImageDTO> attachments = fromJson(board.getAttachmentsJson());

        return BoardDTO.builder()
                .bno(board.getBno())
                .title(board.getTitle())
                .content(board.getContent())
                .createdDate(board.getCreatedDate())
                .updatedDate(board.getUpdatedDate())
                .memberid(member != null ? member.getId() : null)
                .nickname(member != null ? member.getNickname() : null)
                .replyCount(replyCount != null ? replyCount : 0L)
                .attachments(attachments)
                .viewCount(board.getViewCount())
                .boardLikeCount(board.getBoardLikeCount())
                .channelId(board.getChannel().getId())
                .channelName(board.getChannel().getName())
                .build();
    }
}
