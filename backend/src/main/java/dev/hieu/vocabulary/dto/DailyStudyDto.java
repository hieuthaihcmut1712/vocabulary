package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyStudyDto {
    private String date; // "2026-10-05"
    private String displayDate; // "05/10"
    private String dayOfWeek; // "T2", "T3", "T4", "T5", "T6", "T7", "CN"
    private Long durationSeconds;
    private Double durationMinutes;
    private String formattedDuration; // "25 phút", "1h 10p", "45s"
    private Boolean isToday;
    private Integer sessionCount;

    // Chi tiết theo kỹ năng
    private Long quizSeconds;
    private Long reverseSeconds;
    private Long listeningSeconds;
    private Long exerciseSeconds;
}
