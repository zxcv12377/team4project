package com.example.server.controller;

import com.example.server.entity.Friend;
import com.example.server.entity.enums.FriendStatus;
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

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;
    private final UserStatusService userStatusService;

    @PostMapping
    public ResponseEntity<?> requestFriend(@RequestBody FriendDTO.Request dto,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        friendService.requestFriend(principal.getId(), dto.getTargetMemberId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{friendId}/accept")
    public ResponseEntity<?> acceptFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        friendService.acceptFriend(friendId, principal.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{friendId}/reject")
    public ResponseEntity<?> rejectFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        friendService.rejectFriend(friendId, principal.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getFriends(@AuthenticationPrincipal CustomMemberDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        List<FriendDTO.SimpleResponse> result = friendService.getFriends(principal.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status/{targetId}")
    public ResponseEntity<?> getStatus(@PathVariable Long targetId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        FriendStatus status = friendService.getStatus(principal.getId(), targetId);
        return ResponseEntity.ok(new FriendDTO.StatusResponse(status));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<?> deleteFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal CustomMemberDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        Long myId = principal.getId();
        Friend friend = friendService.getFriendOrThrow(friendId);

        if (friend.getStatus() == FriendStatus.REQUESTED &&
                friend.getMemberA().getId().equals(myId)) {
            friendService.cancelFriendRequest(friendId, myId);
        } else {
            friendService.deleteFriend(friendId, myId);
        }

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/requests/received")
    public ResponseEntity<?> getReceivedFriendRequests(@AuthenticationPrincipal CustomMemberDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        List<FriendDTO.RequestResponse> list = friendService.getReceivedFriendRequests(principal.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<?> getSentFriendRequests(@AuthenticationPrincipal CustomMemberDetails principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        List<FriendDTO.RequestResponse> list = friendService.getSentFriendRequests(principal.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/online")
    public ResponseEntity<?> getOnlineFriends(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();

        String me = principal.getName();
        List<String> onlineFriends = userStatusService.getOnlineFriendEmails(me);
        return ResponseEntity.ok(onlineFriends);
    }

}
