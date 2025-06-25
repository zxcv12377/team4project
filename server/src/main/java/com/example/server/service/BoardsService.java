package com.example.server.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.server.dto.BoardRequestDTO;
import com.example.server.dto.BoardResponseDTO;
import com.example.server.dto.BoardWithRepliesDTO;
import com.example.server.dto.PagesRequestsDTO;
import com.example.server.dto.PagesResultDTO;
import com.example.server.dto.ReplyDTO;
import com.example.server.entity.Boards;
import com.example.server.entity.Member;
import com.example.server.entity.Reply;
import com.example.server.mapperc.BoardMapper;
import com.example.server.repository.BoardsRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyRepository;
import com.example.server.security.SecurityService;
import com.example.server.util.HtmlUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardsService {

    private final BoardsRepository boardRepository;
    private final SecurityService securityService;
    private final MemberRepository memberRepository;
    private final ReplyRepository replyRepository;

    // 게시글 등록
    public Boards register(BoardRequestDTO dto, String username) {
        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalStateException("회원 정보 없음"));

        Boards board = BoardMapper.toEntity(dto, member);
        boardRepository.save(board);
        return board;
    }

    // 전체 게시글 조회
    public PagesResultDTO<BoardResponseDTO> getAll(PagesRequestsDTO pageRequestDTO) {
        Sort.Direction direction = pageRequestDTO.getSort().equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = pageRequestDTO.getPageable(Sort.by(direction, "createdDate"));
        Page<Boards> result = boardRepository.search(pageRequestDTO, pageable);

        return new PagesResultDTO<>(result.map(BoardMapper::toDTO));
    }

    // 게시글 단건 조회
    public BoardResponseDTO get(Long bno) {
        Boards board = boardRepository.findById(bno)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다"));
        return BoardMapper.toDTO(board);
    }

    // 게시글 수정
    public void modify(Long bno, BoardRequestDTO dto, String username) {
        Boards board = boardRepository.findById(bno)
                .orElseThrow(() -> new IllegalArgumentException("수정할 게시글이 없습니다"));

        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자 없음"));
        securityService.checkBoardOwnership(board, member);

        // ★ 기존 content 백업
        String beforeContent = board.getContent();

        // 기존 content에서 <img> 제거
        String rawContent = dto.getContent();
        String cleanedContent = rawContent;

        // 1. content에서 이미지 추출
        String thumbnail = HtmlUtils.extractFirstImageUrl(rawContent);

        // 2. 썸네일 없으면 기존 이미지 재사용
        if (thumbnail == null || thumbnail.isBlank()) {
            // 기존 content에서 <img> 추출 (혹은 imageUrl 필드)
            thumbnail = HtmlUtils.extractFirstImageUrl(beforeContent);
        }

        // 3. timestamp 추가 (안바뀌는 증상 발생 시 캐시 무시용)
        String thumbnailWithTimestamp = thumbnail != null
                ? thumbnail + "?t=" + System.currentTimeMillis()
                : null;

        board.setTitle(dto.getTitle());
        board.setContent(cleanedContent);

        boardRepository.save(board);
    }

    // 게시글 삭제
    public void delete(Long bno, String username) {
        Boards board = boardRepository.findById(bno)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 게시글이 없습니다"));
        if (board.getMember() == null) {
            throw new IllegalStateException("게시글에 작성자 정보가 없습니다.");
        }

        System.out.println(" 로그인 사용자: " + username);
        System.out.println(" 게시글 작성자: " + board.getMember().getEmail());

        if (!board.getMember().getEmail().equals(username)) {
            throw new AccessDeniedException("작성자만 삭제할 수 있습니다.");
        }
        boardRepository.deleteById(bno);
    }

    // 게시글 + 댓글 트리 전체 조회
    public BoardWithRepliesDTO getBoardWithReplies(Long bno) {
        Boards board = boardRepository.findById(bno)
                .orElseThrow(() -> new IllegalArgumentException("게시글 없음"));

        List<Reply> replies = replyRepository.findByBoardsBnoAndParentIsNullOrderByCreatedDateAsc(bno);
        List<ReplyDTO> replyDTOs = replies.stream()
                .map(ReplyDTO::fromEntity)
                .collect(Collectors.toList());

        List<ReplyDTO> treeReplies = buildReplyTree(replyDTOs);

        return BoardWithRepliesDTO.builder()
                .board(BoardMapper.toDTO(board)) // static 방식
                .replies(treeReplies)
                .build();
    }

    // 댓글 트리 구성
    private List<ReplyDTO> buildReplyTree(List<ReplyDTO> flatList) {
        Map<Long, ReplyDTO> dtoMap = flatList.stream()
                .collect(Collectors.toMap(ReplyDTO::getRno, dto -> dto));

        List<ReplyDTO> roots = new ArrayList<>();

        for (ReplyDTO dto : flatList) {
            if (dto.getParentRno() != null) {
                ReplyDTO parent = dtoMap.get(dto.getParentRno());
                if (parent != null) {
                    parent.getChildren().add(dto);
                }
            } else {
                roots.add(dto);
            }
        }

        return roots;
    }
}
