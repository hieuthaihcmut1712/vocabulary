package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResultDto {
    private Boolean isCorrect;
    private String correctMeaning;
    private Integer oldWeight;
    private Integer newWeight;
    private Integer weightDelta; // ví dụ: -3, -2, -1, 0, +2
    private Double responseTimeSeconds;
    private String feedbackMessage;

    // Tiến độ bộ thẻ cập nhật tức thì
    private Double deckProgressPercent;
    private Long masteredWords;
    private Long learningWords;
}
