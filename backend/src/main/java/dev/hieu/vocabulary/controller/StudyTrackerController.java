package dev.hieu.vocabulary.controller;

import dev.hieu.vocabulary.dto.StudyLogRequest;
import dev.hieu.vocabulary.dto.StudyStatsResponse;
import dev.hieu.vocabulary.service.StudyTrackerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/study")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StudyTrackerController {

    private final StudyTrackerService studyTrackerService;

    /**
     * Ghi nhận thời gian học (client gửi định kỳ mỗi 15-30s khi đang làm bài)
     */
    @PostMapping("/log")
    public ResponseEntity<StudyStatsResponse> logStudyTime(@RequestBody StudyLogRequest request) {
        return ResponseEntity.ok(studyTrackerService.logStudyTime(request));
    }

    /**
     * Lấy dữ liệu thống kê biểu đồ thời gian học (mặc định 7 ngày gần nhất)
     */
    @GetMapping("/stats")
    public ResponseEntity<StudyStatsResponse> getStudyStats(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(studyTrackerService.getStudyStats(days));
    }
}
