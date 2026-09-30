package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListeningResultDto {
    private Boolean isCorrect;
    private String correctTerm;
    private String meaning;
    private Integer oldWeight;
    private Integer newWeight;
    private Integer weightDelta;
    private Integer listenCount;
    private String feedbackMessage;

    // Cập nhật tiến độ nghe của bộ thẻ ngay lập tức
    private Double deckProgressPercent;
    private Long masteredWords;
    private Long learningWords;
    private Long unlearnedWords;
}
