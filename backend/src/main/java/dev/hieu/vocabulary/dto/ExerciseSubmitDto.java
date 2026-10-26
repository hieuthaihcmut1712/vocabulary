package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class ExerciseSubmitDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Map<Integer, String> userAnswers; // key: index (1, 2, ...), value: từ người dùng điền
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Integer score;
        private Integer maxScore;
        private Double percentage;
        private List<BlankResult> results;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlankResult {
        private Integer index;
        private String userAnswer;
        private String correctAnswer;
        private Boolean isCorrect;
    }
}
