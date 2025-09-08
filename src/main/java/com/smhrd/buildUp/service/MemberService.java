package com.smhrd.buildUp.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smhrd.buildUp.dto.Member;
import com.smhrd.buildUp.dto.SignupRequest;
import com.smhrd.buildUp.mapper.MemberMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberMapper memberMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public Member register(SignupRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        // Check duplicate
        Member existing = memberMapper.findByEmail(req.getEmail());
        if (existing != null) {
            throw new IllegalStateException("Email already registered");
        }

        Member m = new Member();
        m.setEmail(req.getEmail());
        m.setName(req.getName());
        m.setPasswordHash(passwordEncoder.encode(req.getPassword()));

        memberMapper.insert(m);
        return m;
    }
}

