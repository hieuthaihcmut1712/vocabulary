package dev.hieu.vocabulary.controller;

import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.service.ReverseQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reverse-quiz")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReverseQuizController {

    private final ReverseQuizService reverseQuizService;

    /**
     * Bốc câu hỏi Quizziz Việt -> Anh tiếp theo
     */
    @GetMapping("/next")
    public ResponseEntity<ReverseQuizQuestionDto> getNextQuestion(@RequestParam Long deckId) {
        return ResponseEntity.ok(reverseQuizService.getNextQuestion(deckId));
    }

    /**
     * Nộp đáp án Quizziz Việt -> Anh
     */
    @PostMapping("/submit")
    public ResponseEntity<ReverseQuizResultDto> submitAnswer(@RequestBody ReverseQuizSubmitRequest request) {
        return ResponseEntity.ok(reverseQuizService.submitAnswer(request));
    }

    /**
     * Khởi tạo dữ liệu cho Chế độ Luyện tập Việt -> Anh (chỉ mở khi đạt 100%)
     */
    @GetMapping("/practice-init")
    public ResponseEntity<ReversePracticeInitDto> getPracticeInit(@RequestParam Long deckId) {
        return ResponseEntity.ok(reverseQuizService.getPracticeInit(deckId));
    }
}
