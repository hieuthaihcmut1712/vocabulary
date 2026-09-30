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
public class ReverseQuizQuestionDto {
    private Long wordId;
    private String meaning;        // Đề bài: Nghĩa tiếng Việt
    private String partOfSpeech;   // Loại từ (collocation, noun, verb...)
    private List<String> options;  // 4 lựa chọn là các từ / cụm từ tiếng Anh

    // Trọng số và xác suất
    private Integer currentWeight;
    private Double probabilityPercent;

    // Tiến độ bộ thẻ Việt -> Anh
    private Double deckProgressPercent;
    private Long masteredWords;   // Trọng số = 1 (1.0đ)
    private Long learningWords;   // Trọng số < 5 và > 1 (0.5đ)
    private Long unlearnedWords;  // Trọng số >= 5 (0đ)
    private Integer totalWords;

    private Long deckId;
    private String deckName;
}
