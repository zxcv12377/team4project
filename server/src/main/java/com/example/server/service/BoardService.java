package com.example.server.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
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
import com.example.server.dto.ImageDTO;
import com.example.server.dto.PageRequestDTO;
import com.example.server.dto.PageResultDTO;
import com.example.server.entity.Board;
import com.example.server.entity.BoardChannel;
import com.example.server.entity.BoardLike;
import com.example.server.entity.Member;
import com.example.server.entity.Reply;
import com.example.server.repository.BoardChannelRepository;
import com.example.server.repository.BoardLikeRepository;
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
    private final BoardChannelRepository boardChannelRepository;
    private final BoardLikeRepository boardLikeRepository;

    private static final Long TOP_STRAWBERRY_CHANNEL_ID = 3L;
    // 좋아요 기준치
    private static final Long LIKE_THRESHOLD = 1L;

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
            return false;
        } else { // 등록
            BoardLike like = BoardLike.builder()
                    .board(board)
                    .member(member)
                    .build();
            boardLikeRepository.save(like);
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
    public BoardDTO getRow(Long bno) {
        // 1) 조회
        Board board = boardRepository.findById(bno).orElseThrow();
        board.increaseViewCount();
        Object[] result = boardRepository.getBoardRow(bno);
        return entityToDto((Board) result[0], (Member) result[1], (Long) result[2]);
    }

    @Transactional
    public void increaseLike(Long bno) {
        Board board = boardRepository.findById(bno).orElseThrow();
        board.increaseBoardLikeCount();
    }

    public List<BoardDTO> getBoardsByChannel(Long channelId) {
        List<Board> boards;

        if (TOP_STRAWBERRY_CHANNEL_ID.equals(channelId)) {
            // 1) 최고딸기 채널: 좋아요가 기준 이상인 글만
            boards = boardRepository
                    .findByBoardLikeCount(LIKE_THRESHOLD);
        } else {
            // 2) 일반 채널: 채널ID 로 뽑고 최신순 정렬
            boards = boardRepository
                    .findByChannelId(channelId);
        }
        if (boards.isEmpty()) {
            throw new NoSuchElementException("해당 채널에 게시글이 없습니다.");
        }
        return boards.stream()
                .map(b -> {
                    Member member = b.getMember();
                    Long replyCount = replyRepository.countByBoard(b);
                    return entityToDto(b, member, replyCount);
                })
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
