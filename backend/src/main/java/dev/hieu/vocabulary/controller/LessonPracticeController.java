package dev.hieu.vocabulary.controller;

import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.service.LessonPracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lesson-practice")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LessonPracticeController {

    private final LessonPracticeService lessonPracticeService;

    /**
     * Lấy bài tập điền từ (Words in Context) theo Lesson (chứa Word bank chỉ tiếng Anh)
     */
    @GetMapping("/exercise/{lessonId}")
    public ResponseEntity<LessonExerciseDto> getExercise(@PathVariable Integer lessonId) {
        return ResponseEntity.ok(lessonPracticeService.getExercise(lessonId));
    }

    /**
     * Chấm điểm bài tập điền từ
     */
    @PostMapping("/exercise/{lessonId}/submit")
    public ResponseEntity<ExerciseSubmitDto.Response> submitExercise(
            @PathVariable Integer lessonId,
            @RequestBody ExerciseSubmitDto.Request request) {
        return ResponseEntity.ok(lessonPracticeService.submitExercise(lessonId, request));
    }

    /**
     * Lấy bài kiểm tra Practice Test (Listening & Reading) theo Lesson
     */
    @GetMapping("/test/{lessonId}")
    public ResponseEntity<LessonTestDto> getTest(@PathVariable Integer lessonId) {
        return ResponseEntity.ok(lessonPracticeService.getTest(lessonId));
    }

    /**
     * Chấm điểm bài kiểm tra Practice Test
     */
    @PostMapping("/test/{lessonId}/submit")
    public ResponseEntity<TestSubmitDto.Response> submitTest(
            @PathVariable Integer lessonId,
            @RequestBody TestSubmitDto.Request request) {
        return ResponseEntity.ok(lessonPracticeService.submitTest(lessonId, request));
    }

    /**
     * Lấy danh sách lịch sử làm bài kiểm tra TOEIC (tất cả hoặc theo lessonId)
     */
    @GetMapping("/test/history")
    public ResponseEntity<java.util.List<ToeicTestHistoryDto>> getAllTestHistory(
            @RequestParam(required = false) Integer lessonId) {
        return ResponseEntity.ok(lessonPracticeService.getTestHistory(lessonId));
    }

    /**
     * Lấy lịch sử làm bài kiểm tra TOEIC của một Lesson
     */
    @GetMapping("/test/{lessonId}/history")
    public ResponseEntity<java.util.List<ToeicTestHistoryDto>> getTestHistoryByLesson(
            @PathVariable Integer lessonId) {
        return ResponseEntity.ok(lessonPracticeService.getTestHistory(lessonId));
    }

    /**
     * Lấy chi tiết một bài kiểm tra TOEIC trong lịch sử
     */
    @GetMapping("/test/history/{historyId}")
    public ResponseEntity<ToeicTestHistoryDto> getTestHistoryDetail(
            @PathVariable Long historyId) {
        return ResponseEntity.ok(lessonPracticeService.getTestHistoryDetail(historyId));
    }

    /**
     * Xóa một bài kiểm tra trong lịch sử
     */
    @DeleteMapping("/test/history/{historyId}")
    public ResponseEntity<Void> deleteTestHistory(@PathVariable Long historyId) {
        lessonPracticeService.deleteTestHistory(historyId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy danh sách tiến độ nghe chép chính tả của một Lesson
     */
    @GetMapping("/dictation/{lessonId}")
    public ResponseEntity<java.util.List<ToeicDictationProgressDto>> getDictationProgress(
            @PathVariable Integer lessonId) {
        return ResponseEntity.ok(lessonPracticeService.getDictationProgress(lessonId));
    }

    /**
     * Lưu hoặc cập nhật kết quả nghe chép chính tả của một câu
     */
    @PostMapping("/dictation/{lessonId}/save")
    public ResponseEntity<ToeicDictationProgressDto> saveDictationSentence(
            @PathVariable Integer lessonId,
            @RequestBody ToeicDictationProgressDto dto) {
        return ResponseEntity.ok(lessonPracticeService.saveDictationSentence(lessonId, dto));
    }

    /**
     * Xóa/đặt lại tiến độ nghe chép chính tả của một Lesson
     */
    @DeleteMapping("/dictation/{lessonId}/reset")
    public ResponseEntity<Void> resetDictationProgress(@PathVariable Integer lessonId) {
        lessonPracticeService.resetDictationProgress(lessonId);
        return ResponseEntity.noContent().build();
    }
}
