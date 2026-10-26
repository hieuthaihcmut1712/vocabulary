package dev.hieu.vocabulary.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình phát nhạc CD1 và CD2 trực tiếp từ thư mục gốc của project
        File cd1Dir = new File("CD1").getAbsoluteFile();
        if (!cd1Dir.exists()) {
            cd1Dir = new File("../CD1").getAbsoluteFile();
        }
        if (!cd1Dir.exists()) {
            cd1Dir = new File("C:/CODE/vocabulary/CD1").getAbsoluteFile();
        }

        File cd2Dir = new File("CD2").getAbsoluteFile();
        if (!cd2Dir.exists()) {
            cd2Dir = new File("../CD2").getAbsoluteFile();
        }
        if (!cd2Dir.exists()) {
            cd2Dir = new File("C:/CODE/vocabulary/CD2").getAbsoluteFile();
        }

        String cd1Uri = cd1Dir.toURI().toString();
        String cd2Uri = cd2Dir.toURI().toString();

        if (!cd1Uri.endsWith("/")) cd1Uri += "/";
        if (!cd2Uri.endsWith("/")) cd2Uri += "/";

        registry.addResourceHandler("/audio/cd1/**")
                .addResourceLocations(cd1Uri);

        registry.addResourceHandler("/audio/cd2/**")
                .addResourceLocations(cd2Uri);

        // Phục vụ hình ảnh bài tập / bài test
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/", "file:C:/CODE/vocabulary/frontend/public/images/");
    }
}
