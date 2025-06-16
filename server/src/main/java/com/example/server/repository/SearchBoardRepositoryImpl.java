package com.example.server.repository;

import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;

import com.example.server.entity.Board;
import com.example.server.entity.QBoard;
import com.example.server.entity.QMember;
import com.example.server.entity.QReply;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;

import lombok.extern.log4j.Log4j2;

@Log4j2
public class SearchBoardRepositoryImpl extends QuerydslRepositorySupport implements SearchBoardRepository {

    public SearchBoardRepositoryImpl() {
        super(Board.class);
    }

    @Override
    public List<Object[]> list() {
   log.info("SearchBoard");


   QBoard board = QBoard.board;
   QMember member = QMember.member;
   QReply reply = QReply.reply;
   
    JPQLQuery<Board>query =  from(board);
    query.leftJoin(member).on(board.member.eq(member));

    //댓글 개수
JPQLQuery<Long>replyCount =JPAExpressions.select(reply.rno.count())
                            .from(reply)
                            .where(reply.board.eq(reply.board));

JPQLQuery<Tuple>tuple = query.select(board, member, replyCount);


log.info("===============");

log.info("===============");

List<Tuple> result = tuple.fetch();

List<Object[]> list = result.stream().map(t->t.toArray()).collect(Collectors.toList());

return list;
}
    
}
