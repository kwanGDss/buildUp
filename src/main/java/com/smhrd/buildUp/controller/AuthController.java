package com.smhrd.buildUp.controller;

import com.smhrd.buildUp.dto.SignupRequest;
import com.smhrd.buildUp.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class AuthController {
    private final MemberService memberService;

    @GetMapping("/signup")
    public String signupForm() {
        return "signup"; // /WEB-INF/views/signup.jsp
    }

    @PostMapping("/signup")
    public String signup(SignupRequest req, Model model) {
        try {
            var member = memberService.register(req);
            model.addAttribute("member", member);
            return "signup_success"; // /WEB-INF/views/signup_success.jsp
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("email", req.getEmail());
            model.addAttribute("name", req.getName());
            return "signup";
        }
    }
}

