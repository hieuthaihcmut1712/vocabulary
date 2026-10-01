package dev.hieu.vocabulary.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaWebController {

    /**
     * Chuyển tiếp các route của React Router về index.html
     * để khi người dùng refresh (F5) hoặc nhập trực tiếp URL trên cổng 8080 không bị lỗi 404 Whitelabel Error
     */
    @GetMapping(value = {
        "/deck/**",
        "/quiz/**",
        "/practice/**",
        "/exercises/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
