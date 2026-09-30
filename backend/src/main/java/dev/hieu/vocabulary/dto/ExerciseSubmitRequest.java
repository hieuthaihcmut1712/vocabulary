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
public class ExerciseSubmitRequest {
    private Long deckId;
    private String level;
    private String title;
    private String content;
    private String translation;
    private List<String> targetAnswers;
    private List<String> userAnswers;
    private String explanation;
    private String audioScript;
}
