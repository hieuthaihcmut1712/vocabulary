package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlankEvaluationDto {
    private int blankIndex;
    private String targetAnswer;
    private String userAnswer;
    private boolean isCorrect;
}
