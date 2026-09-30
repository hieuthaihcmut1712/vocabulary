package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseItemDto {
    private Long deckId;
    private String deckName;
    private String level; // TOEIC_550, TOEIC_700_READING, TOEIC_700_LISTENING, TOEIC_850
    private String title;
    private String content; // Contains [BLANK_1], [BLANK_2]...
    private String translation;
    private List<String> targetAnswers;
    private List<String> blankHints;
    private String audioScript;
    private String explanation;
}
