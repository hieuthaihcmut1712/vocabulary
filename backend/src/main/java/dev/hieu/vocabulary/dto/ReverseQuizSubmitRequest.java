package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReverseQuizSubmitRequest {
    private Long wordId;
    private String selectedTerm;
    private Double responseTimeSeconds;
}
