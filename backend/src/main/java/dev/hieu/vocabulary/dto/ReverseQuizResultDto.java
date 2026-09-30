package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReverseQuizResultDto {
    private Boolean isCorrect;
    private String correctTerm;
    private String meaning;
    private Integer oldWeight;
    private Integer newWeight;
    private Integer weightDelta;
    private Double responseTimeSeconds;
    private String feedbackMessage;

    // Cập nhật tiến độ bộ thẻ ngay lập tức
    private Double deckProgressPercent;
    private Long masteredWords;
    private Long learningWords;
    private Long unlearnedWords;
}
