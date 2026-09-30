package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeInitDto {
    private Long deckId;
    private String deckName;
    private double quizProgressPercent;
    private boolean unlocked;
    private List<WordDto> words;
}
