package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseHistoryDetailDto {
    private Long id;
    private Long deckId;
    private String deckName;
    private String level;
    private String title;
    private String content;
    private String translation;
    private List<String> targetAnswers;
    private List<String> userAnswers;
    private Double scorePercent;
    private Boolean isPassed;
    private String explanation;
    private String audioScript;
    private LocalDateTime createdAt;
}
