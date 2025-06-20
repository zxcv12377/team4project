package com.example.server.websoket;

import java.security.Principal;

public class StompPrincipal implements Principal {
    private final String email;
    private final String sessionId;

    public StompPrincipal(String email, String sessionId) {
        this.email = email;
        this.sessionId = sessionId;
    }

    @Override
    public String getName() {
        return email; // 🔥 여기서 username만 반환
    }

    public String getSessionId() {
        return sessionId;
    }
}
