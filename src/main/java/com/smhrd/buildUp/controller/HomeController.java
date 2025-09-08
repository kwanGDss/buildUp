package com.smhrd.buildUp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping({"/", "/index"})
    public String index() {
        return "index"; // resolves to /WEB-INF/views/index.jsp
    }
}

