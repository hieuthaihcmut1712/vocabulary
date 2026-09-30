package dev.hieu.vocabulary.controller;

import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.service.ListeningQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/listening")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ListeningQuizController {

    private final ListeningQuizService listeningQuizService;

    /**
     * Bốc từ tiếp theo cho bài Học nghe chính tả (kèm thanh tiến độ nghe)
     */
    @GetMapping("/next")
    public ResponseEntity<ListeningQuestionDto> getNextQuestion(@RequestParam Long deckId) {
        return ResponseEntity.ok(listeningQuizService.getNextQuestion(deckId));
    }

    /**
     * Nộp bài nghe chính tả (tính điểm, cập nhật trọng số và tiến độ nghe vào Database)
     */
    @PostMapping("/submit")
    public ResponseEntity<ListeningResultDto> submitAnswer(@RequestBody ListeningSubmitRequest request) {
        return ResponseEntity.ok(listeningQuizService.submitAnswer(request));
    }

    /**
     * Khởi tạo dữ liệu cho Chế độ Luyện tập nghe chính tả (chỉ mở khi tiến độ nghe đạt 100%)
     */
    @GetMapping("/practice-init")
    public ResponseEntity<ListeningPracticeInitDto> getPracticeInit(@RequestParam Long deckId) {
        return ResponseEntity.ok(listeningQuizService.getPracticeInit(deckId));
    }
}
