package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListeningQuestionDto {
    private Long wordId;
    private String term;
    private String meaning;
    private String partOfSpeech;
    private String phonetic;
    private String example;

    // Trọng số và xác suất
    private Integer currentWeight;
    private Double probabilityPercent;

    // Thống kê tiến độ nghe của bộ thẻ (thanh tiến độ riêng)
    private Double deckProgressPercent;
    private Long masteredWords;   // weight == 1 (1.0 điểm)
    private Long learningWords;   // weight < 3 và > 1 (0.5 điểm)
    private Long unlearnedWords;  // weight >= 3 (0 điểm)
    private Integer totalWords;

    private Long deckId;
    private String deckName;
}
