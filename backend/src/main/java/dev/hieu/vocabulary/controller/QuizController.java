package dev.hieu.vocabulary.controller;

import dev.hieu.vocabulary.dto.DeckSummaryDto;
import dev.hieu.vocabulary.dto.PracticeInitDto;
import dev.hieu.vocabulary.dto.QuizQuestionDto;
import dev.hieu.vocabulary.dto.QuizResultDto;
import dev.hieu.vocabulary.dto.QuizSubmitRequest;
import dev.hieu.vocabulary.dto.WordDto;
import dev.hieu.vocabulary.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/decks")
    public ResponseEntity<List<DeckSummaryDto>> getAllDecks() {
        return ResponseEntity.ok(quizService.getDecksWithProgress());
    }

    @GetMapping("/next")
    public ResponseEntity<QuizQuestionDto> getNextQuestion(
            @RequestParam(name = "deckId", defaultValue = "2") Long deckId) {
        return ResponseEntity.ok(quizService.getNextQuestion(deckId));
    }

    @PostMapping("/submit")
    public ResponseEntity<QuizResultDto> submitAnswer(@RequestBody QuizSubmitRequest request) {
        return ResponseEntity.ok(quizService.submitAnswer(request));
    }

    @GetMapping("/practice-init")
    public ResponseEntity<PracticeInitDto> getPracticeInit(
            @RequestParam(name = "deckId", defaultValue = "2") Long deckId) {
        return ResponseEntity.ok(quizService.getPracticeInit(deckId));
    }

    @GetMapping("/deck-words")
    public ResponseEntity<List<WordDto>> getDeckWords(
            @RequestParam(name = "deckId", defaultValue = "2") Long deckId) {
        return ResponseEntity.ok(quizService.getWordsByDeck(deckId));
    }
}
