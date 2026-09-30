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
public class ExerciseResultDto {
    private Long historyId;
    private double scorePercent;
    private boolean isPassed;
    private List<BlankEvaluationDto> evaluations;
    private String explanation;
    private String translation;
}
