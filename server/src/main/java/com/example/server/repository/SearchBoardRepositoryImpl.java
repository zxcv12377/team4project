package com.example.server.repository;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.server.entity.Board;
import com.example.server.entity.QBoard;
import com.example.server.entity.QBoardChannel;
import com.example.server.entity.QMember;
import com.example.server.entity.QReply;
import com.example.server.entity.enums.PinScope;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.core.types.dsl.NumberPath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;

import lombok.extern.log4j.Log4j2;

@Log4j2
public class SearchBoardRepositoryImpl extends QuerydslRepositorySupport implements SearchBoardRepository {

        public SearchBoardRepositoryImpl() {
                super(Board.class);
        }

        @Override
        public Page<Object[]> getBoardList(String type, String keyword, Pageable pageable) {
                QBoard board = QBoard.board;
                QMember member = QMember.member;
                QReply reply = QReply.reply;
                QBoardChannel channel = QBoardChannel.boardChannel;

                // 댓글 수 별칭 Path 선언
                NumberPath<Long> replyCountAlias = Expressions.numberPath(Long.class, "replyCount");
                // 댓글 수 Expression 생성
                Expression<Long> replyCountExpr = ExpressionUtils.as(
                                JPAExpressions
                                                .select(reply.count())
                                                .from(reply)
                                                .where(reply.board.eq(board)),
                                replyCountAlias);

                // 기본 SELECT + JOIN 구성[게시판 단순 리스트업]
                JPQLQuery<Tuple> query = from(board)
                                .leftJoin(board.member, member)
                                .leftJoin(board.channel, channel)
                                .select(
                                                board.bno,
                                                board.title,
                                                board.createdDate,
                                                member.nickname,
                                                replyCountExpr,
                                                board.viewCount,
                                                board.boardLikeCount,
                                                channel.id,
                                                channel.name,
                                                board.pinned,
                                                board.pinScope,
                                                member.id);

                if (type != null && keyword != null && !keyword.isBlank()) {
                        BooleanBuilder builder = new BooleanBuilder();

                        if (type.contains("t"))
                                builder.or(board.title.containsIgnoreCase(keyword));
                        if (type.contains("c"))
                                builder.or(board.content.containsIgnoreCase(keyword));
                        if (type.contains("w"))
                                builder.or(member.nickname.containsIgnoreCase(keyword));

                        query.where(builder);
                }
                // GROUP BY (Oracle 대응)
                query.groupBy(
                                board.bno,
                                board.title,
                                board.createdDate,
                                member.nickname,
                                board.viewCount,
                                board.boardLikeCount,
                                channel.id,
                                channel.name,
                                board.pinScope,
                                board.pinOrder,
                                board.pinnedAt);

                // 전역 핀 우선 정렬
                NumberExpression<Integer> rankExprAll = new CaseBuilder()
                                .when(board.pinScope.eq(PinScope.GLOBAL)).then(0)
                                .otherwise(1);

                query.orderBy(
                                rankExprAll.asc(),
                                board.pinOrder.asc().nullsLast(),
                                board.pinnedAt.desc().nullsLast(),
                                board.bno.desc());
                // 페이징 처리
                List<Tuple> resultList = getQuerydsl().applyPagination(pageable, query).fetch();

                // Tuple → Object[] 변환
                List<Object[]> results = resultList.stream()
                                .map(t -> new Object[] {
                                                t.get(board.bno),
                                                t.get(board.title),
                                                t.get(board.createdDate),
                                                t.get(member.nickname),
                                                t.get(replyCountAlias),
                                                t.get(board.viewCount),
                                                t.get(board.boardLikeCount),
                                                t.get(channel.id),
                                                t.get(channel.name),
                                                t.get(board.pinned),
                                                t.get(board.pinScope),
                                                t.get(member.id)
                                })
                                .collect(Collectors.toList());

                return PageableExecutionUtils.getPage(results, pageable, query::fetchCount);
        }

        @Override
        public Page<Object[]> getBoardListByChannel(
                        Long channelId,
                        String type,
                        String keyword,
                        Pageable pageable) {

                QBoard board = QBoard.board;
                QMember member = QMember.member;
                QReply reply = QReply.reply;
                QBoardChannel channel = QBoardChannel.boardChannel;

                // 댓글 수 서브쿼리 (기존 스타일 유지)
                NumberPath<Long> replyCountAlias = Expressions.numberPath(Long.class, "replyCount");
                Expression<Long> replyCountExpr = ExpressionUtils.as(
                                JPAExpressions
                                                .select(reply.count())
                                                .from(reply)
                                                .where(reply.board.eq(board)),
                                replyCountAlias);

                JPQLQuery<Tuple> query = from(board)
                                .leftJoin(board.member, member)
                                .leftJoin(board.channel, channel)
                                .select(
                                                board.bno,
                                                board.title,
                                                board.createdDate,
                                                member.nickname,
                                                replyCountExpr,
                                                board.viewCount,
                                                board.boardLikeCount,
                                                channel.id,
                                                channel.name,
                                                board.pinned,
                                                board.pinScope,
                                                member.id);

                // 1) 채널 글 + 전역 핀 포함
                query.where(
                                board.channel.id.eq(channelId)
                                                .or(board.pinScope.eq(PinScope.GLOBAL)));

                // 2) 검색 조건
                if (type != null && keyword != null && !keyword.isBlank()) {
                        BooleanBuilder builder = new BooleanBuilder();
                        if (type.contains("t"))
                                builder.or(board.title.containsIgnoreCase(keyword));
                        if (type.contains("c"))
                                builder.or(board.content.containsIgnoreCase(keyword));
                        if (type.contains("w"))
                                builder.or(member.nickname.containsIgnoreCase(keyword));
                        query.where(builder);
                }

                // 3) GROUP BY (정렬/선택 컬럼 포함)
                query.groupBy(
                                board.bno,
                                board.title,
                                board.createdDate,
                                member.nickname,
                                board.viewCount,
                                board.boardLikeCount,
                                channel.id,
                                channel.name,
                                board.pinScope,
                                board.pinOrder,
                                board.pinnedAt);

                // 4) 정렬: GLOBAL(0) → CHANNEL(1, 같은 채널일 때) → 일반(2)
                NumberExpression<Integer> rankExpr = new CaseBuilder()
                                .when(board.pinScope.eq(PinScope.GLOBAL)).then(0)
                                .when(board.pinScope.eq(PinScope.CHANNEL).and(board.channel.id.eq(channelId))).then(1)
                                .otherwise(2);

                query.orderBy(
                                rankExpr.asc(),
                                // QueryDSL 버전에 따라 .nullsLast()가 없으면 빼도 됨
                                board.pinOrder.asc().nullsLast(),
                                board.pinnedAt.desc().nullsLast(),
                                board.bno.desc());

                // 페이징 + 매핑
                List<Tuple> tuples = getQuerydsl().applyPagination(pageable, query).fetch();

                List<Object[]> results = tuples.stream()
                                .map(t -> new Object[] {
                                                t.get(board.bno),
                                                t.get(board.title),
                                                t.get(board.createdDate),
                                                t.get(member.nickname),
                                                t.get(replyCountAlias),
                                                t.get(board.viewCount),
                                                t.get(board.boardLikeCount),
                                                t.get(channel.id),
                                                t.get(channel.name),
                                                t.get(board.pinned),
                                                t.get(board.pinScope),
                                                t.get(member.id)
                                })
                                .collect(Collectors.toList());

                return PageableExecutionUtils.getPage(results, pageable, query::fetchCount);
        }

        @Override
        public Object[] getBoardRow(Long bno) {
                QBoard board = QBoard.board;
                QMember member = QMember.member;
                QReply reply = QReply.reply;

                JPQLQuery<Board> query = from(board);
                query.leftJoin(member).on(board.member.eq(member));
                query.where(board.bno.eq(bno));

                JPQLQuery<Long> replyCount = JPAExpressions.select(reply.count())
                                .from(reply)
                                .where(reply.board.eq(board));

                JPQLQuery<Tuple> tuple = query.select(board, member, replyCount, board.viewCount, board.boardLikeCount);
                Tuple row = tuple.fetchFirst();

                return row != null ? row.toArray() : null;
        }

        @Override
        public Page<Object[]> getBestAllBoards(String type, String keyword, Pageable pageable,
                        int minlike) {
                QBoard board = QBoard.board;
                QMember member = QMember.member;
                QReply reply = QReply.reply;
                QBoardChannel channel = QBoardChannel.boardChannel;

                NumberPath<Long> replyCountAlias = Expressions.numberPath(Long.class, "replyCount");
                Expression<Long> replyCountExpr = ExpressionUtils.as(
                                JPAExpressions
                                                .select(reply.count())
                                                .from(reply)
                                                .where(reply.board.eq(board)),
                                replyCountAlias);

                JPQLQuery<Tuple> query = from(board)
                                .leftJoin(board.member, member)
                                .leftJoin(board.channel, channel)
                                .select(
                                                board.bno,
                                                board.title,
                                                board.createdDate,
                                                member.nickname,
                                                replyCountExpr,
                                                board.viewCount,
                                                board.boardLikeCount,
                                                channel.id,
                                                channel.name,
                                                board.pinned,
                                                board.pinScope,
                                                member.id)
                                // 👍 베스트 조건(좋아요 기준)은 그대로 유지
                                .where(board.boardLikeCount.goe(minlike));

                // 검색 조건
                if (type != null && keyword != null && !keyword.isBlank()) {
                        BooleanBuilder builder = new BooleanBuilder();
                        if (type.contains("t"))
                                builder.or(board.title.containsIgnoreCase(keyword));
                        if (type.contains("c"))
                                builder.or(board.content.containsIgnoreCase(keyword));
                        if (type.contains("w"))
                                builder.or(member.nickname.containsIgnoreCase(keyword));
                        query.where(builder);
                }

                // GROUP BY: 정렬/선택 컬럼 포함 (only_full_group_by 대비)
                query.groupBy(
                                board.bno,
                                board.title,
                                board.createdDate,
                                member.nickname,
                                board.viewCount,
                                board.boardLikeCount,
                                channel.id,
                                channel.name,
                                board.pinScope,
                                board.pinOrder,
                                board.pinnedAt);

                // 🔽 전역 핀 우선 정렬 (GLOBAL 먼저), 그다음 pinOrder ASC → pinnedAt DESC → bno DESC
                NumberExpression<Integer> rankExprAll = new CaseBuilder()
                                .when(board.pinScope.eq(PinScope.GLOBAL)).then(0)
                                .otherwise(1);

                query.orderBy(
                                rankExprAll.asc(),
                                // QueryDSL 버전에 따라 .nullsLast() 미지원이면 제거하거나 coalesce 사용
                                board.pinOrder.asc().nullsLast(),
                                board.pinnedAt.desc().nullsLast(),
                                board.bno.desc());

                // 페이징 조회
                List<Tuple> fetchList = getQuerydsl().applyPagination(pageable, query).fetch();

                // 매핑
                List<Object[]> results = fetchList.stream()
                                .map(t -> new Object[] {
                                                t.get(board.bno),
                                                t.get(board.title),
                                                t.get(board.createdDate),
                                                t.get(member.nickname),
                                                t.get(replyCountAlias),
                                                t.get(board.viewCount),
                                                t.get(board.boardLikeCount),
                                                t.get(channel.id),
                                                t.get(channel.name),
                                                t.get(board.pinned),
                                                t.get(board.pinScope),
                                                t.get(member.id)

                                })
                                .collect(Collectors.toList());

                return PageableExecutionUtils.getPage(results, pageable, query::fetchCount);
        }

}
