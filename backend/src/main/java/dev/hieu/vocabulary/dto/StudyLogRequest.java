package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyLogRequest {
    private Long deckId;
    private String mode; // QUIZ, PRACTICE, REVERSE_QUIZ, REVERSE_PRACTICE, LISTENING_DRILL, LISTENING_PRACTICE, APPLIED_EXERCISE
    private Integer durationSeconds;
}
