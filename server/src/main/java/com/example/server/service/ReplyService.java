package com.example.server.service;

import com.example.server.dto.ReplyDTO;
import com.example.server.dto.ReplyRequestDTO;
import com.example.server.dto.ReplyResponseDTO;
import com.example.server.entity.Board;
import com.example.server.entity.Member;
import com.example.server.entity.MemberRole;
import com.example.server.entity.Reply;
import com.example.server.entity.ReplyLike;
import com.example.server.repository.BoardRepository;
import com.example.server.repository.MemberRepository;
import com.example.server.repository.ReplyLikeRepository;
import com.example.server.repository.ReplyRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Log4j2
@RequiredArgsConstructor
@Service
public class ReplyService {

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
                                .build();

                return replyRepository.save(reply).getRno();
        }

        // 특정 게시글 댓글 목록 (작성순)
        public List<ReplyResponseDTO> getList(Long bno) {
                List<Reply> parentReplies = replyRepository.findByBoardBnoAndParentIsNullOrderByCreatedDateAsc(bno);
                return parentReplies.stream()
                                .map(this::toResponseDTOWithChildren)
                                .collect(Collectors.toList());
        }

        // 추천 많은 댓글 상위 3개
        public List<ReplyResponseDTO> getBestReplies(Long bno) {
                List<Reply> bestReplies = replyRepository.findTop3BestReplies(bno);
                return bestReplies.stream()
                                .map(this::toResponseDTOWithChildren)
                                .collect(Collectors.toList());
        }

        // 추천/작성 기준 분리 목록
        public Map<String, List<ReplyResponseDTO>> getRepliesSeparated(Long bno) {
                List<Reply> allTopLevel = replyRepository.findByBoardBnoAndParentIsNullOrderByCreatedDateAsc(bno);

                // 2. 댓글별 추천 수 매핑
                Map<Reply, Long> likeCounts = allTopLevel.stream()
                                .collect(Collectors.toMap(
                                                reply -> reply,
                                                reply -> replyLikeRepository.countByReply(reply)));

                // 3. 추천 수가 1 이상인 댓글만 필터링
                List<Map.Entry<Reply, Long>> sortedReplies = likeCounts.entrySet().stream()
                                .filter(entry -> entry.getValue() > 0)
                                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue())) // 내림차순
                                .toList();

                // 4. 최대 추천 수 확인
                long maxLike = sortedReplies.isEmpty() ? 0 : sortedReplies.get(0).getValue();

                // 5. 최대 추천 수와 같은 댓글만 BEST 후보로 추출
                List<Reply> bestReplies = sortedReplies.stream()
                                .filter(entry -> entry.getValue() == maxLike)
                                .limit(3) // 최대 3개까지만 BEST
                                .map(Map.Entry::getKey)
                                .toList();

                // 6. 나머지는 일반 댓글로 분류
                List<Reply> generalReplies = allTopLevel.stream()
                                .filter(reply -> !bestReplies.contains(reply))
                                .toList();

                // 7. 변환 후 결과 반환
                Map<String, List<ReplyResponseDTO>> result = new HashMap<>();
                result.put("best", bestReplies.stream().map(this::toResponseDTOWithChildren).toList());
                result.put("general", generalReplies.stream().map(this::toResponseDTOWithChildren).toList());

                return result;
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
        public void delete(Long rno, Member currentUser) {
                Reply reply = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

                boolean isWriter = reply.getMember().getId().equals(currentUser.getId());
                boolean isAdmin = currentUser.getRoles().contains(MemberRole.ADMIN);

                if (!isWriter && !isAdmin) {
                        throw new SecurityException("삭제 권한이 없습니다.");
                }

                replyRepository.delete(reply);
        }

        // 댓글 추천
        public void likeReply(Long rno, Member member) {
                Reply reply = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

                if (replyLikeRepository.existsByReplyAndMember(reply, member)) {
                        throw new IllegalArgumentException("이미 추천한 댓글입니다.");
                }

                ReplyLike like = ReplyLike.builder()
                                .reply(reply)
                                .member(member)
                                .build();

                replyLikeRepository.save(like);
        }

        // 추천 수 조회
        public Long getLikeCount(Long rno) {
                Reply reply = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
                return replyLikeRepository.countByReply(reply);
        }

        // 내부 변환 메서드
        private ReplyResponseDTO toResponseDTOWithChildren(Reply reply) {
                Long likeCount = replyLikeRepository.countByReply(reply);

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
                                .createdDate(reply.getCreatedDate())
                                .deleted(reply.isDeleted())
                                .likeCount(likeCount)
                                .children(reply.getChildren().stream()
                                                .map(this::toResponseDTOWithChildren)
                                                .collect(Collectors.toList()))
                                .build();
        }
}