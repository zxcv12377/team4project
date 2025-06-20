package com.example.server.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "uploaded_files")
public class UploadedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 파일 경로 (서버 내 저장 위치)
    @Column(name = "file_path", nullable = false)
    private String filePath;

    // 업로드 일자 (기본값 현재시간)
    @Column(name = "upload_date", nullable = false)
    private LocalDateTime uploadDate;

    // 삭제 여부
    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    public UploadedFile() {
        this.uploadDate = LocalDateTime.now();
        this.deleted = false;
    }
}
