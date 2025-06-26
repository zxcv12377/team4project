package com.example.server.base;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

@Getter
@MappedSuperclass // 테이블과 매핑되지 않고 자식 클래스에 엔티티의 매핑정보 상속
@EntityListeners(value = AuditingEntityListener.class)
public class Base {

    @CreatedDate
    @Column(name = "createdDate", updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    @Column(name = "updatedDate")
    private LocalDateTime updatedDate;

}
