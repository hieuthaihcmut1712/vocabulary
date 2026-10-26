package dev.hieu.vocabulary.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filter chặn mọi request để đọc Header 'X-User-Profile' (hoặc query param 'profile')
 * và thiết lập vào ProfileContextHolder.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ProfileFilter implements Filter {

    public static final String HEADER_PROFILE = "X-User-Profile";
    public static final String PARAM_PROFILE = "profile";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest) {
            String profile = httpRequest.getHeader(HEADER_PROFILE);
            if (profile == null || profile.trim().isEmpty()) {
                profile = httpRequest.getParameter(PARAM_PROFILE);
            }
            ProfileContextHolder.setProfile(profile);
        }

        try {
            chain.doFilter(request, response);
        } finally {
            ProfileContextHolder.clear();
        }
    }
}
