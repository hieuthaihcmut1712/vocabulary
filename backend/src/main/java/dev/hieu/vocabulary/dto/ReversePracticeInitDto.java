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
public class ReversePracticeInitDto {
    private Long deckId;
    private String deckName;
    private Double reverseProgressPercent;
    private Boolean unlocked; // Mở khi reverseProgressPercent >= 100.0%
    private List<WordDto> words;
}
