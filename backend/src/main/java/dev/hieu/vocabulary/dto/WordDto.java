package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WordDto {
    private Long id;
    private String term;
    private String partOfSpeech;
    private String phonetic;
    private String meaning;
}
