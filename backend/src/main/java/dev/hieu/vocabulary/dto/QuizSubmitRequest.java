package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmitRequest {
    private Long wordId;
    private String selectedMeaning;
    private Double responseTimeSeconds;
}
