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
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.dsl.Expressions;
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
                                                channel.name);

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
                                channel.name);
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
                                                t.get(channel.name)
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

                // 댓글 수 별칭 및 서브쿼리
                NumberPath<Long> replyCountAlias = Expressions.numberPath(Long.class, "replyCount");
                Expression<Long> replyCountExpr = ExpressionUtils.as(
                                JPAExpressions
                                                .select(reply.count())
                                                .from(reply)
                                                .where(reply.board.eq(board)),
                                replyCountAlias);

                // 기본 SELECT + JOIN
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
                                                channel.name);

                // 1) 채널 필터
                query.where(board.channel.id.eq(channelId));

                // 2) 검색 타입/키워드 조건
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

                // 3) GROUP BY (Oracle 대응)
                query.groupBy(
                                board.bno,
                                board.title,
                                board.createdDate,
                                member.nickname,
                                board.viewCount,
                                board.boardLikeCount,
                                channel.id,
                                channel.name);

                // 4) 페이징 적용 & 조회
                List<Tuple> fetchList = getQuerydsl()
                                .applyPagination(pageable, query)
                                .fetch();

                // 5) Tuple → Object[] 변환
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
                                                t.get(channel.name)
                                })
                                .collect(Collectors.toList());

                // 6) Page 객체로 리턴
                return PageableExecutionUtils.getPage(
                                results,
                                pageable,
                                query::fetchCount);
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
                JPQLQuery<Tuple> query = from(board).leftJoin(board.member, member).leftJoin(board.channel, channel)
                                .select(board.bno,
                                                board.title,
                                                board.createdDate,
                                                member.nickname,
                                                replyCountExpr,
                                                board.viewCount,
                                                board.boardLikeCount,
                                                channel.id,
                                                channel.name)
                                .where(board.boardLikeCount.goe(minlike));

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

                // 3) GROUP BY (Oracle 대응)
                query.groupBy(
                                board.bno,
                                board.title,
                                board.createdDate,
                                member.nickname,
                                board.viewCount,
                                board.boardLikeCount,
                                channel.id,
                                channel.name);

                // 4) 페이징 적용 & 조회
                List<Tuple> fetchList = getQuerydsl()
                                .applyPagination(pageable, query)
                                .fetch();

                // 5) Tuple → Object[] 변환
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
                                                t.get(channel.name)
                                })
                                .collect(Collectors.toList());

                // 6) Page 객체로 리턴
                return PageableExecutionUtils.getPage(
                                results,
                                pageable,
                                query::fetchCount);
        }
}
