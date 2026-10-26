package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToeicDictationProgressDto {
    private Long id;
    private Integer lessonId;
    private String sentenceId;
    private Integer part;
    private Integer score;
    private Boolean isCompleted;
    private String userInput;
    private Integer hintsCount;
    private Integer listenCount;
    private Object wrongAttempts;
    private Object hintedWords;
    private LocalDateTime updatedAt;
}
