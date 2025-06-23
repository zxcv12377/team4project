package com.example.server.controller;

import com.example.server.entity.Friend;
import com.example.server.entity.FriendStatus;
import com.example.server.security.CustomMemberDetails;
import com.example.server.service.FriendService;
import com.example.server.service.UserStatusService;
import com.example.server.dto.FriendDTO;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;
    private final UserStatusService userStatusService;

    // 1. 친구 신청
    @PostMapping
    public void requestFriend(@RequestBody FriendDTO.Request dto,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        friendService.requestFriend(principal.getId(), dto.getTargetMemberId());
    }

    // 2. 친구 수락
    @PostMapping("/{friendId}/accept")
    public void acceptFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        friendService.acceptFriend(friendId, principal.getId());
    }

    // 3. 친구 거절 (옵션)
    @PostMapping("/{friendId}/reject")
    public void rejectFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        friendService.rejectFriend(friendId, principal.getId());
    }

    // 4. 내 친구 목록 (SimpleResponse로 변경)
    @GetMapping
    public List<FriendDTO.SimpleResponse> getFriends(@AuthenticationPrincipal CustomMemberDetails member) {
        return friendService.getFriends(member.getId());
    }

    // 관계 상태 조회 (친구추가 식별용)
    @GetMapping("/status/{targetId}")
    public FriendDTO.StatusResponse getStatus(
            @PathVariable Long targetId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        FriendStatus status = friendService.getStatus(principal.getId(), targetId);
        return new FriendDTO.StatusResponse(status);
    }

    // 5. 친구 삭제
    @DeleteMapping("/{friendId}")
    public void deleteFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        friendService.deleteFriend(friendId, principal.getId());
    }

    // 내가 받은 친구 요청 목록
    @GetMapping("/requests/received")
    public List<FriendDTO.RequestResponse> getReceivedFriendRequests(
            @AuthenticationPrincipal CustomMemberDetails principal) {
        return friendService.getReceivedFriendRequests(principal.getId());
    }

    // 내가 보낸 친구 요청 목록
    @GetMapping("/requests/sent")
    public List<FriendDTO.RequestResponse> getSentFriendRequests(
            @AuthenticationPrincipal CustomMemberDetails principal) {
        return friendService.getSentFriendRequests(principal.getId());
    }

    @GetMapping("/online")
    public ResponseEntity<List<String>> getOnlineFriends(Principal principal) {
        if (principal == null) {
            System.out.println("❌ Principal is null");
            return ResponseEntity.ok(List.of());
        }

        String me = principal.getName();
        System.out.println("✅ Online Friends 요청자: " + me);

        List<String> onlineFriends = userStatusService.getOnlineFriendEmails(me);
        return ResponseEntity.ok(onlineFriends);
    }

}
