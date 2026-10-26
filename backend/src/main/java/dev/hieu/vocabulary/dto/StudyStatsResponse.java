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
public class StudyStatsResponse {
    private Long todaySeconds;
    private Double todayMinutes;
    private String todayFormatted;

    private Long weeklyTotalSeconds;
    private Double weeklyTotalMinutes;
    private String weeklyFormatted;

    private Double dailyAverageMinutes;
    private Integer streakDays; // Chuỗi ngày học liên tục

    private List<DailyStudyDto> dailyStats; // Danh sách 7 ngày (hoặc N ngày)
}
