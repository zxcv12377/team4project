package com.example.server.service;

import com.example.server.dto.ReplyDTO;
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
        private final MemberRepository memberRepository;
        private final BoardRepository boardRepository;
        private final ReplyLikeRepository replyLikeRepository;

        // 댓글 등록
        public Long create(ReplyDTO dto) {
                Member member = memberRepository.findByEmail(dto.getNickname())
                                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

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
                                .member(member)
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
                List<Reply> bestReplies = replyRepository.findTop3BestReplies(bno);
                List<Reply> allTopLevel = replyRepository.findByBoardBnoAndParentIsNullOrderByCreatedDateAsc(bno);

                List<Reply> generalReplies = allTopLevel.stream()
                                .filter(reply -> !bestReplies.contains(reply))
                                .collect(Collectors.toList());

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
        public Long update(ReplyDTO dto) {
                Reply reply = replyRepository.findById(dto.getRno())
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
                reply.updateText(dto.getText());
                return replyRepository.save(reply).getRno();
        }

        // 댓글 삭제
        public void delete(Long rno) {
                replyRepository.deleteById(rno);
        }

        // 댓글 추천
        public void likeReply(Long rno, String nickname) {
                Reply reply = replyRepository.findById(rno)
                                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

                Member member = memberRepository.findByEmail(nickname)
                                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

                boolean alreadyLiked = replyLikeRepository.existsByReplyAndMember(reply, member);
                if (alreadyLiked) {
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
