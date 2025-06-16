// package com.example.server.controller;

// import lombok.RequiredArgsConstructor;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.core.annotation.AuthenticationPrincipal;
// import org.springframework.util.StringUtils;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;

// import com.example.server.entity.Member;
// import com.example.server.security.CustomMemberDetails;
// import com.example.server.service.MemberService;

// import java.io.File;
// import java.io.IOException;
// import java.util.UUID;

// @RestController
// @RequiredArgsConstructor
// @RequestMapping("/api/profile-image")
// public class ProfileImageController {

// private final MemberService memberService;

// // 서버 저장 디렉토리 (team4project/server/uploads)
// private final String uploadDir = "server/uploads/";

// @PostMapping
// public ResponseEntity<?> uploadProfileImage(@RequestParam("file")
// MultipartFile file,
// @AuthenticationPrincipal CustomMemberDetails memberDetails) {
// if (file.isEmpty()) {
// return ResponseEntity.badRequest().body("파일이 비어 있습니다.");
// }

// String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
// String extension = getFileExtension(originalFilename);
// String savedFilename = UUID.randomUUID() + "." + extension;

// try {
// // 디렉토리 없으면 생성
// File uploadPath = new File(uploadDir);
// if (!uploadPath.exists()) {
// uploadPath.mkdirs();
// }

// // 이전 이미지 삭제
// Member member = memberService.findByEmail(memberDetails.getUsername());
// if (member.getProfileImagePath() != null) {
// File oldFile = new File(uploadDir + member.getProfileImagePath());
// if (oldFile.exists())
// oldFile.delete();
// }

// // 새 이미지 저장
// File dest = new File(uploadDir + savedFilename);
// file.transferTo(dest);

// // DB에 경로 업데이트
// memberService.updateProfileImage(member.getId(), savedFilename);

// return ResponseEntity.ok("프로필 이미지가 업로드되었습니다.");
// } catch (IOException e) {
// return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
// .body("파일 업로드 중 오류 발생: " + e.getMessage());
// }
// }

// @GetMapping
// public ResponseEntity<?> getProfileImagePath(@AuthenticationPrincipal
// CustomMemberDetails memberDetails) {
// Member member = memberService.findByEmail(memberDetails.getUsername());
// if (member.getProfileImagePath() == null) {
// return ResponseEntity.status(HttpStatus.NOT_FOUND).body("프로필 이미지가 없습니다.");
// }

// String imageUrl = "/uploads/" + member.getProfileImagePath();
// return ResponseEntity.ok(imageUrl);
// }

// private String getFileExtension(String filename) {
// int idx = filename.lastIndexOf('.');
// return idx != -1 ? filename.substring(idx + 1) : "png";
// }
// }
