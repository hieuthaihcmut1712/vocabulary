package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionDto {
    private Long wordId;
    private String term;
    private String partOfSpeech;
    private String phonetic;
    private List<String> options; // 4 đáp án (1 đúng + 3 ngẫu nhiên)
    private Integer currentWeight;
    private Double probabilityPercent; // Tỉ lệ xuất hiện của từ này
    private Integer totalWords;

    // Thông tin tiến độ của bộ thẻ
    private Long deckId;
    private String deckName;
    private Double deckProgressPercent;
    private Long masteredWords;
    private Long learningWords;
    private Long unlearnedWords;
}
