package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class TestSubmitDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Map<Integer, String> answers; // key: questionNumber (1..23), value: "A", "B", "C", "D"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long historyId;
        private java.time.LocalDateTime createdAt;
        private Integer score;
        private Integer totalQuestions;
        private Double percentage;
        private Integer listeningScore;
        private Integer listeningTotal;
        private Integer readingScore;
        private Integer readingTotal;
        private List<QuestionResult> results;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResult {
        private Integer questionNumber;
        private String part;
        private String questionText;
        private Object options;
        private String passage;
        private String imageUrl;
        private String userAnswer;
        private String correctAnswer;
        private Boolean isCorrect;
        private String explanation;
        private String translation;
        private String transcript;
    }
}
