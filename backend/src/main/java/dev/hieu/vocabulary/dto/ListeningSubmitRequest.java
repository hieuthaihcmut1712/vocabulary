package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListeningSubmitRequest {
    private Long wordId;
    private String typedText;
    private Integer listenCount;
    private Double responseTimeSeconds;
}
