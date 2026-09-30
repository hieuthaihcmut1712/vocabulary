package dev.hieu.vocabulary.controller;

import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.service.AppliedExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppliedExerciseController {

    private final AppliedExerciseService appliedExerciseService;

    /**
     * Sinh bài tập mới theo cấp độ TOEIC từ AI
     */
    @PostMapping("/generate")
    public ResponseEntity<ExerciseItemDto> generateExercise(@RequestBody ExerciseGenerateRequest request) {
        return ResponseEntity.ok(appliedExerciseService.generateExercise(request));
    }

    /**
     * Nộp bài làm, chấm điểm và lưu vào lịch sử
     */
    @PostMapping("/submit")
    public ResponseEntity<ExerciseResultDto> submitExercise(@RequestBody ExerciseSubmitRequest request) {
        return ResponseEntity.ok(appliedExerciseService.submitExercise(request));
    }

    /**
     * Lấy danh sách lịch sử bài tập của một bộ thẻ
     */
    @GetMapping("/history")
    public ResponseEntity<List<ExerciseHistoryDetailDto>> getHistory(@RequestParam(defaultValue = "2") Long deckId) {
        return ResponseEntity.ok(appliedExerciseService.getHistoryByDeck(deckId));
    }

    /**
     * Xem chi tiết một bài tập cũ kèm lời giải thích
     */
    @GetMapping("/history/{id}")
    public ResponseEntity<ExerciseHistoryDetailDto> getHistoryDetail(@PathVariable Long id) {
        return ResponseEntity.ok(appliedExerciseService.getHistoryDetail(id));
    }

    /**
     * Kiểm tra trạng thái mở khóa bài tập ứng dụng cho bộ thẻ
     */
    @GetMapping("/status")
    public ResponseEntity<ExerciseStatusDto> getStatus(@RequestParam(defaultValue = "2") Long deckId) {
        return ResponseEntity.ok(appliedExerciseService.getExerciseStatus(deckId));
    }
}
