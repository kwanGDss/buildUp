package com.smhrd.buildUp.dto;

import lombok.Data;

@Data
public class Member {
    private Long id;
    private String email;
    private String passwordHash;
    private String name;
    private java.time.LocalDateTime createdAt;
}

