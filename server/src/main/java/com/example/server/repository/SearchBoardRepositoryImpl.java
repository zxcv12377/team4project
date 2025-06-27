package com.example.server.repository;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.server.entity.Board;
import com.example.server.entity.QBoard;
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
                                .select(
                                                board.bno,
                                                board.title,
                                                board.createdDate,
                                                member.nickname,
                                                replyCountExpr,
                                                board.attachmentsJson);

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
                                board.attachmentsJson);
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
                                                t.get(board.attachmentsJson)
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

                JPQLQuery<Tuple> tuple = query.select(board, member, replyCount);
                Tuple row = tuple.fetchFirst();

                return row != null ? row.toArray() : null;
        }
}
