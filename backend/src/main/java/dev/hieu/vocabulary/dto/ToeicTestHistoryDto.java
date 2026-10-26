package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToeicTestHistoryDto {
    private Long id;
    private Integer lessonId;
    private String lessonTitle;
    private Integer score;
    private Integer totalQuestions;
    private Double percentage;
    private Integer listeningScore;
    private Integer listeningTotal;
    private Integer readingScore;
    private Integer readingTotal;
    private LocalDateTime createdAt;
    private Map<Integer, String> userAnswers;
    private List<TestSubmitDto.QuestionResult> results;
}
