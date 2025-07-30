package com.example.server.dto.event;

public class DmRestoreEvent {

    private final String Email;
    private final Long roomId;

    public DmRestoreEvent(String Email, Long roomId) {
        this.Email = Email;
        this.roomId = roomId;
    }

    public String getEmail() {
        return Email;
    }

    public Long getRoomId() {
        return roomId;
    }
}
