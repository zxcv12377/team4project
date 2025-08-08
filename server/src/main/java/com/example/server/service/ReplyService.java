package com.example.server.service;

import com.example.server.dto.ReplyDTO;
import com.example.server.dto.ReplyRequestDTO;
import com.example.server.dto.ReplyResponseDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.Reply;
import com.example.server.entity.ReplyLike;
import com.example.server.entity.enums.MemberRole;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.ReplyLikeRepository;
import com.example.server.repository.ReplyRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Log4j2
@RequiredArgsConstructor
@Service
public class ReplyService {

        private static final int BEST_COUNT = 3; // 상위 3개를 베스트로

        private final ReplyRepository replyRepository;
        private final BoardRepository boardRepository;
        private final ReplyLikeRepository replyLikeRepository;

        // 댓글 등록
        public Long create(ReplyRequestDTO dto, Member member) {
                Board board = boardRepository.findById(dto.getBno())
                                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));

                Reply parent = null;
                if (dto.getParentRno() != null) {
                        parent = replyRepository.findById(dto.getParentRno())
                                        .orElseThrow(() -> new IllegalArgumentException("부모 댓글이 존재하지 않습니다."));
                }

                Reply reply = Reply.builder()
                                .text(dto.getText())
                                .board(board)
                                .member(member) // 🔐 로그인된 사용자
                                .parent(parent)
                                .channel(board.getChannel())
                                .build();

                return replyRepository.save(reply).getRno();
        }

        // 특정 게시글 댓글 목록 (작성순)
        public List<ReplyResponseDTO> getList(Long bno, Member member) {
                List<Reply> parentReplies = replyRepository.findByBoardBnoAndParentIsNullOrderByCreatedDateAsc(bno);
                return parentReplies.stream()
                                .map(r -> toResponseDTOWithChildren(r, member))
                                .collect(Collectors.toList());
        }

        // 추천 많은 댓글 상위 3개
        public List<ReplyResponseDTO> getBestReplies(Long bno, Member member) {
                List<Reply> bestReplies = replyRepository.findTop3BestReplies(bno);
                return bestReplies.stream()
                                .map(r -> toResponseDTOWithChildren(r, member))
                                .collect(Collectors.toList());
        }

        public Map<String, List<ReplyResponseDTO>> getRepliesWithBest(Long boardId, Member member) {
                // 1) 최상위 댓글 조회
                List<Reply> topLevel = replyRepository
                                .findByBoardBnoAndParentIsNullOrderByCreatedDateAsc(boardId);

                // 2) 트리 전체 평탄화 (상위 + 대댓글 전부)
                List<Reply> allReplies = new ArrayList<>();
                for (Reply r : topLevel) {
                        collectAllReplies(r, allReplies);
                }

                // 3) 좋아요 개수 매핑
                Map<Reply, Long> likeCounts = allReplies.stream()
                                .collect(Collectors.toMap(
                                                reply -> reply,
                                                reply -> replyLikeRepository.countByReply(reply)));

                // 4) 좋아요 > 0 조건, 내림차순 정렬 후 상위 BEST_COUNT개 추출
                List<Reply> bestReplies = likeCounts.entrySet().stream()
                                .filter(e -> e.getValue() > 0)
                                .sorted(Map.Entry.<Reply, Long>comparingByValue().reversed())
                                .map(Map.Entry::getKey)
                                .limit(BEST_COUNT)
                                .collect(Collectors.toList());

                // 5) 베스트 댓글만 DTO로 복제
                List<ReplyResponseDTO> bestDto = bestReplies.stream()
                                .map(reply -> {
                                        ReplyResponseDTO dto = new ReplyResponseDTO(reply);
                                        dto.setLikeCount(likeCounts.get(reply));
                                        dto.setBest(true); // DTO에 ‘베스트 플래그’ 추가
                                        return dto;
                                })
                                .collect(Collectors.toList());

                // 6) 나머지 댓글은 계층 구조 유지하며 DTO 변환
                List<ReplyResponseDTO> normalDto = topLevel.stream()
                                .map(r -> toNestedDto(r, member))
                                .collect(Collectors.toList());

                // 7) 결과 맵 생성
                Map<String, List<ReplyResponseDTO>> result = new LinkedHashMap<>();
                result.put("bestReplies", bestDto);
                result.put("replies", normalDto);
                return result;
        }

        // 재귀 호출로 한 노드와 자식 노드까지 DTO로 변환해주는 헬퍼
        private ReplyResponseDTO toNestedDto(Reply reply, Member member) {
                ReplyResponseDTO dto = new ReplyResponseDTO(reply, member);
                dto.setLikeCount(replyLikeRepository.countByReply(reply));
                dto.setBest(false);
                dto.setChildren(
                                reply.getChildren().stream()
                                                .map(child -> toNestedDto(child, member))
                                                .collect(Collectors.toList()));
                return dto;
        }

        // 평탄화 헬퍼
        private void collectAllReplies(Reply root, List<Reply> flatList) {
                flatList.add(root);
                for (Reply child : root.getChildren()) {
                        collectAllReplies(child, flatList);
                }
        }

        // 댓글 조회
        public ReplyDTO get(Long rno) {
                Reply reply = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
                return ReplyDTO.fromEntity(reply);
        }

        // 댓글 수정
        public Long update(Long rno, String newText, Member currentUser) {
                Reply reply = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

                boolean isWriter = reply.getMember().getId().equals(currentUser.getId());
                boolean isAdmin = currentUser.getRoles().contains(MemberRole.ADMIN);

                if (!isWriter && !isAdmin) {
                        throw new SecurityException("수정 권한이 없습니다.");
                }

                reply.updateText(newText);
                return replyRepository.save(reply).getRno();
        }

        // 댓글 삭제
        @Transactional
        public void delete(Long rno, Member currentUser) {
                Reply target = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

                boolean isWriter = target.getMember() != null &&
                                target.getMember().getId().equals(currentUser.getId());
                boolean isAdmin = currentUser.getRoles().contains(MemberRole.ADMIN);
                if (!isWriter && !isAdmin)
                        throw new SecurityException("삭제 권한이 없습니다.");

                boolean hasChildren = replyRepository.existsByParentRno(rno);

                if (hasChildren) {
                        // 부모/대댓글 모두 내용만 숨김
                        target.softDelete();
                        // 여기서는 물리 삭제 없음
                } else {
                        // 잎이면 물리 삭제
                        Reply parent = target.getParent(); // delete 전에 참조 잡아두기
                        replyRepository.delete(target);
                        replyRepository.flush(); // 쿼리에서 자식 수 정확히 보이게

                        // 소프트삭제된 조상 중 리프가 된 것들 연쇄 삭제
                        pruneSoftDeletedAncestors(parent);
                }
        }

        @Transactional
        private void pruneSoftDeletedAncestors(Reply node) {
                while (node != null) {
                        Long nodeId = node.getRno(); // delete 전에 id 보관
                        Reply parent = node.getParent(); // 다음 단계 올라갈 부모 캐싱

                        boolean hasChildren = replyRepository.existsByParentRno(nodeId);
                        if (!hasChildren && node.isDeleted()) {
                                replyRepository.delete(node);
                                replyRepository.flush(); // 다음 existsByParentRno 정확히 반영
                                node = parent; // 계속 위로
                        } else {
                                break; // 자식이 남았거나 소프트삭제가 아니면 중단
                        }
                }
        }

        // 댓글 추천
        public boolean toggleLike(Long rno, Member member) {
                Reply reply = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

                Optional<ReplyLike> existing = replyLikeRepository.findByReplyAndMember(reply, member);
                if (existing.isPresent()) {
                        // 이미 좋아요 상태면 취소
                        replyLikeRepository.delete(existing.get());
                        return false;
                } else {
                        // 좋아요
                        ReplyLike like = ReplyLike.builder()
                                        .reply(reply)
                                        .member(member)
                                        .build();

                        replyLikeRepository.save(like);
                        return true;
                }
        }

        // 추천 수 조회
        public Long getLikeCount(Long rno) {
                Reply reply = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
                return replyLikeRepository.countByReply(reply);
        }

        public List<ReplyResponseDTO> getRepliesByWriter(Member member) {
                List<Reply> replies = replyRepository.findAllByMember(member);

                return replies.stream()
                                .map(r -> toResponseDTOWithChildren(r, member)) // 기존 내부변환 메서드 재활용
                                .toList();
        }

        // 내부 변환 메서드
        private ReplyResponseDTO toResponseDTOWithChildren(Reply reply, Member currentMember) {
                Long likeCount = replyLikeRepository.countByReply(reply);

                // → 이건 성능상 큰 문제는 아니지만, 댓글이 많을 경우 DB I/O가 많아짐
                // → 나중에 최적화 포인트로 한 번에 Map<rno, true/false>로 조회하는 것도 고려.
                boolean likedByCurrentMember = currentMember != null &&
                                replyLikeRepository.existsByReplyAndMember(reply, currentMember);

                // 뱃지
                String badge = null;
                if (reply.getMember().getRoles().contains(MemberRole.ADMIN)) {
                        badge = "관리자";
                } else if (reply.getMember().getId().equals(reply.getBoard().getMember().getId())) {
                        badge = "작성자";
                }

                return ReplyResponseDTO.builder()
                                .rno(reply.getRno())
                                .text(reply.getText())
                                .nickname(reply.getMember().getNickname())
                                .writerId(reply.getMember().getId())
                                .badge(badge)
                                .bno(reply.getBoard().getBno())
                                .createdDate(reply.getCreatedDate())
                                .deleted(reply.isDeleted())
                                .likeCount(likeCount)
                                .likedByCurrentMember(likedByCurrentMember)
                                .channelId(reply.getChannel().getId())
                                .channelName(reply.getChannel().getName())
                                .children(reply.getChildren().stream()
                                                .map(child -> toResponseDTOWithChildren(child, currentMember))
                                                .collect(Collectors.toList()))
                                .build();
        }
}