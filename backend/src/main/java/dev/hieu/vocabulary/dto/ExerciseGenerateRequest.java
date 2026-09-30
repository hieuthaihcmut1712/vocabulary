package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseGenerateRequest {
    private Long deckId;
    private String level; // TOEIC_550, TOEIC_700_READING, TOEIC_700_LISTENING, TOEIC_850
}
