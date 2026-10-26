package dev.hieu.vocabulary.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LessonTestDto {
    private Integer lessonId;
    private String title;
    private String audioUrl; // Ví dụ: /audio/cd1/TRACK%201.mp3

    // Part 1: Photo
    private Part1Question part1;

    // Part 2: Question - Response
    private List<Part2Question> part2;

    // Part 3: Conversation
    private List<MultipleChoiceQuestion> part3;

    // Part 4: Talk
    private List<MultipleChoiceQuestion> part4;

    // Part 5: Incomplete Sentences
    private List<MultipleChoiceQuestion> part5;

    // Part 6: Text Completion
    private TextCompletionSection part6;

    // Part 7: Reading Comprehension
    private ReadingSection part7;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Part1Question {
        private Integer questionNumber;
        private String instruction;
        private String imageUrl; // Hình ảnh màu sắc nét
        private String bwImageUrl; // Hình ảnh sách gốc nâng cao
        private List<String> options; // ["A", "B", "C", "D"]
        private String correctAnswer;
        private Map<String, String> transcript; // Lời thoại A, B, C, D
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Part2Question {
        private Integer questionNumber;
        private String spokenQuestion; // Câu hỏi đọc trong audio
        private List<String> options; // ["A", "B", "C"]
        private String correctAnswer;
        private Map<String, String> transcript;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MultipleChoiceQuestion {
        private Integer questionNumber;
        private String question;
        private List<OptionItem> options; // ["A", "B", "C", "D"] kèm nội dung
        private String correctAnswer;
        private String transcript; // Lời thoại audio
        private String explanation; // Giải thích chi tiết tại sao chọn đáp án này
        private String translation; // Dịch nghĩa câu hỏi / đoạn văn sang tiếng Việt
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OptionItem {
        private String key; // "A", "B", "C", "D"
        private String text;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TextCompletionSection {
        private String title;
        private String passage;
        private String passageImage;
        private List<MultipleChoiceQuestion> questions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ReadingSection {
        private String title;
        private String passage;
        private String passageImage;
        private String document1;
        private String document2;
        private List<MultipleChoiceQuestion> questions;
    }
}
