package dev.hieu.vocabulary.service;

import dev.hieu.vocabulary.config.ProfileContextHolder;
import dev.hieu.vocabulary.dto.DailyStudyDto;
import dev.hieu.vocabulary.dto.StudyLogRequest;
import dev.hieu.vocabulary.dto.StudyStatsResponse;
import dev.hieu.vocabulary.entity.DailyStudyTime;
import dev.hieu.vocabulary.entity.StudySession;
import dev.hieu.vocabulary.repository.DailyStudyTimeRepository;
import dev.hieu.vocabulary.repository.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudyTrackerService {

    private final DailyStudyTimeRepository dailyStudyTimeRepository;
    private final StudySessionRepository studySessionRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DISPLAY_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    /**
     * Ghi nhận thời gian học tích lũy từ client
     */
    @Transactional
    public StudyStatsResponse logStudyTime(StudyLogRequest request) {
        if ("dtan".equalsIgnoreCase(ProfileContextHolder.getProfile())) {
            return getStudyStats(7);
        }
        if (request == null || request.getDurationSeconds() == null || request.getDurationSeconds() <= 0) {
            return getStudyStats(7);
        }

        // Giới hạn an toàn: tối đa 3600 giây (1 tiếng) cho một lần gửi batch
        int duration = Math.min(3600, request.getDurationSeconds());
        String mode = request.getMode() != null ? request.getMode().toUpperCase() : "QUIZ";
        LocalDate today = LocalDate.now();

        // 1. Lưu bản ghi session chi tiết
        StudySession session = StudySession.builder()
                .deckId(request.getDeckId())
                .skillMode(mode)
                .durationSeconds(duration)
                .studyDate(today)
                .build();
        studySessionRepository.save(session);

        // 2. Cập nhật hoặc tạo mới bản ghi tổng kết ngày hôm nay
        DailyStudyTime daily = dailyStudyTimeRepository.findByStudyDate(today)
                .orElseGet(() -> DailyStudyTime.builder()
                        .studyDate(today)
                        .totalDurationSeconds(0L)
                        .sessionCount(0)
                        .quizSeconds(0L)
                        .reverseSeconds(0L)
                        .listeningSeconds(0L)
                        .exerciseSeconds(0L)
                        .build());

        daily.setTotalDurationSeconds(daily.getTotalDurationSeconds() + duration);
        daily.setSessionCount(daily.getSessionCount() + 1);

        // Phân bổ thời gian theo kỹ năng
        if (mode.contains("REVERSE")) {
            daily.setReverseSeconds((daily.getReverseSeconds() != null ? daily.getReverseSeconds() : 0L) + duration);
        } else if (mode.contains("LISTEN")) {
            daily.setListeningSeconds((daily.getListeningSeconds() != null ? daily.getListeningSeconds() : 0L) + duration);
        } else if (mode.contains("EXERCISE") || mode.contains("APPLIED")) {
            daily.setExerciseSeconds((daily.getExerciseSeconds() != null ? daily.getExerciseSeconds() : 0L) + duration);
        } else {
            daily.setQuizSeconds((daily.getQuizSeconds() != null ? daily.getQuizSeconds() : 0L) + duration);
        }

        dailyStudyTimeRepository.save(daily);

        return getStudyStats(7);
    }

    /**
     * Lấy dữ liệu thống kê biểu đồ thời gian học (mặc định 7 ngày gần nhất)
     */
    @Transactional(readOnly = true)
    public StudyStatsResponse getStudyStats(int days) {
        if ("dtan".equalsIgnoreCase(ProfileContextHolder.getProfile())) {
            return StudyStatsResponse.builder()
                    .todaySeconds(0L)
                    .todayMinutes(0.0)
                    .todayFormatted("0 phút")
                    .weeklyTotalSeconds(0L)
                    .weeklyTotalMinutes(0.0)
                    .weeklyFormatted("0 phút")
                    .dailyAverageMinutes(0.0)
                    .streakDays(0)
                    .dailyStats(Collections.emptyList())
                    .build();
        }
        int rangeDays = Math.max(7, Math.min(30, days));
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(rangeDays - 1);

        List<DailyStudyTime> records = dailyStudyTimeRepository.findByStudyDateBetweenOrderByStudyDateAsc(startDate, today);
        Map<LocalDate, DailyStudyTime> recordMap = records.stream()
                .collect(Collectors.toMap(DailyStudyTime::getStudyDate, Function.identity()));

        List<DailyStudyDto> dailyStats = new ArrayList<>();
        long weeklyTotalSeconds = 0L;
        long todaySeconds = 0L;

        for (int i = 0; i < rangeDays; i++) {
            LocalDate date = startDate.plusDays(i);
            DailyStudyTime record = recordMap.get(date);

            long durationSeconds = record != null ? record.getTotalDurationSeconds() : 0L;
            double durationMinutes = Math.round((durationSeconds / 60.0) * 10.0) / 10.0;
            boolean isToday = date.equals(today);

            if (isToday) {
                todaySeconds = durationSeconds;
            }
            // Chỉ cộng dồn cho 7 ngày gần nhất
            if (i >= rangeDays - 7) {
                weeklyTotalSeconds += durationSeconds;
            }

            dailyStats.add(DailyStudyDto.builder()
                    .date(date.format(DATE_FORMATTER))
                    .displayDate(date.format(DISPLAY_FORMATTER))
                    .dayOfWeek(formatDayOfWeek(date.getDayOfWeek()))
                    .durationSeconds(durationSeconds)
                    .durationMinutes(durationMinutes)
                    .formattedDuration(formatDurationFriendly(durationSeconds))
                    .isToday(isToday)
                    .sessionCount(record != null ? record.getSessionCount() : 0)
                    .quizSeconds(record != null && record.getQuizSeconds() != null ? record.getQuizSeconds() : 0L)
                    .reverseSeconds(record != null && record.getReverseSeconds() != null ? record.getReverseSeconds() : 0L)
                    .listeningSeconds(record != null && record.getListeningSeconds() != null ? record.getListeningSeconds() : 0L)
                    .exerciseSeconds(record != null && record.getExerciseSeconds() != null ? record.getExerciseSeconds() : 0L)
                    .build());
        }

        // Tính chuỗi ngày học liên tục (Streak)
        int streakDays = calculateStreakDays(today);

        double weeklyTotalMinutes = Math.round((weeklyTotalSeconds / 60.0) * 10.0) / 10.0;
        double dailyAverageMinutes = Math.round((weeklyTotalSeconds / 7.0 / 60.0) * 10.0) / 10.0;

        return StudyStatsResponse.builder()
                .todaySeconds(todaySeconds)
                .todayMinutes(Math.round((todaySeconds / 60.0) * 10.0) / 10.0)
                .todayFormatted(formatDurationDetailed(todaySeconds))
                .weeklyTotalSeconds(weeklyTotalSeconds)
                .weeklyTotalMinutes(weeklyTotalMinutes)
                .weeklyFormatted(formatDurationDetailed(weeklyTotalSeconds))
                .dailyAverageMinutes(dailyAverageMinutes)
                .streakDays(streakDays)
                .dailyStats(dailyStats)
                .build();
    }

    /**
     * Tính toán số ngày học liên tiếp (Streak)
     */
    private int calculateStreakDays(LocalDate today) {
        int streak = 0;
        LocalDate checkDate = today;

        // Nếu hôm nay chưa học, kiểm tra từ hôm qua để giữ streak
        Optional<DailyStudyTime> todayRecord = dailyStudyTimeRepository.findByStudyDate(today);
        if (todayRecord.isEmpty() || todayRecord.get().getTotalDurationSeconds() <= 0) {
            checkDate = today.minusDays(1);
        }

        while (true) {
            Optional<DailyStudyTime> record = dailyStudyTimeRepository.findByStudyDate(checkDate);
            if (record.isPresent() && record.get().getTotalDurationSeconds() > 0) {
                streak++;
                checkDate = checkDate.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    /**
     * Chuyển đổi DayOfWeek sang tiếng Việt ngắn gọn: T2 -> CN
     */
    private String formatDayOfWeek(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }

    /**
     * Định dạng thời gian ngắn gọn (ví dụ: "45p", "1h 15p", "30s")
     */
    private String formatDurationFriendly(long totalSeconds) {
        if (totalSeconds <= 0) return "0p";
        if (totalSeconds < 60) return totalSeconds + "s";
        long minutes = totalSeconds / 60;
        long hours = minutes / 60;
        long remMinutes = minutes % 60;
        if (hours > 0) {
            return hours + "h " + (remMinutes > 0 ? remMinutes + "p" : "");
        }
        return remMinutes + "p";
    }

    /**
     * Định dạng thời gian chi tiết (ví dụ: "45 phút 20 giây", "1 giờ 15 phút")
     */
    private String formatDurationDetailed(long totalSeconds) {
        if (totalSeconds <= 0) return "0 phút";
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        StringBuilder sb = new StringBuilder();
        if (hours > 0) {
            sb.append(hours).append(" giờ ");
        }
        if (minutes > 0) {
            sb.append(minutes).append(" phút ");
        }
        if (hours == 0 && seconds > 0) {
            sb.append(seconds).append(" giây");
        }
        return sb.toString().trim();
    }
}
