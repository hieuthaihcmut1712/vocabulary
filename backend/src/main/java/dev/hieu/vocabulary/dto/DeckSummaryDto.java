package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeckSummaryDto {
    private Long id;
    private String name;
    private String description;
    private Integer totalWords;

    // 1. Tiến độ Quizziz Drill (Anh -> Việt: Đọc từ tiếng Anh, chọn nghĩa tiếng Việt)
    private Long masteredWords;   // Trọng số = 1 (Full 1.0 điểm)
    private Long learningWords;   // Trọng số < 5 và > 1 (Nửa 0.5 điểm)
    private Long unlearnedWords;  // Trọng số >= 5 (0 điểm)
    private Double progressPercent; // Điểm phần trăm tiến độ Quizziz Anh -> Việt (0 - 100%)
    private Boolean quizPracticeUnlocked; // Đã từng đạt 100% -> mở khóa vĩnh viễn

    // 2. Tiến độ Quizziz Việt -> Anh (Đọc nghĩa tiếng Việt, chọn từ tiếng Anh)
    private Long reverseMasteredWords;   // Trọng số = 1 (Full 1.0 điểm)
    private Long reverseLearningWords;   // Trọng số < 5 và > 1 (Nửa 0.5 điểm)
    private Long reverseUnlearnedWords;  // Trọng số >= 5 (0 điểm)
    private Double reverseProgressPercent; // Điểm phần trăm tiến độ Quizziz Việt -> Anh (0 - 100%)
    private Boolean reversePracticeUnlocked; // Đã từng đạt 100% -> mở khóa vĩnh viễn

    // 3. Tiến độ Luyện nghe chính tả (Listening / Dictation)
    private Long listeningMasteredWords;   // Trọng số = 1 (Full 1.0 điểm)
    private Long listeningLearningWords;   // Trọng số < 3 và > 1 (Nửa 0.5 điểm)
    private Long listeningUnlearnedWords;  // Trọng số >= 3 (0 điểm)
    private Double listeningProgressPercent; // Điểm phần trăm tiến độ Nghe (0 - 100%)
    private Boolean listeningPracticeUnlocked; // Đã từng đạt 100% -> mở khóa vĩnh viễn
}
