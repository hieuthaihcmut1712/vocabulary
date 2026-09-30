package dev.hieu.vocabulary.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.entity.Deck;
import dev.hieu.vocabulary.entity.ExerciseHistory;
import dev.hieu.vocabulary.entity.Word;
import dev.hieu.vocabulary.repository.DeckRepository;
import dev.hieu.vocabulary.repository.ExerciseHistoryRepository;
import dev.hieu.vocabulary.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppliedExerciseService {

    private final DeckRepository deckRepository;
    private final WordRepository wordRepository;
    private final ExerciseHistoryRepository exerciseHistoryRepository;
    private final dev.hieu.vocabulary.repository.WordProgressRepository wordProgressRepository;
    private final GeminiExerciseService geminiExerciseService;
    private final QuizService quizService;
    private final ObjectMapper objectMapper;

    /**
     * Sinh bài tập ứng dụng mới theo cấp độ TOEIC từ AI
     * Hỗ trợ cả từng Deck riêng lẻ và Chế độ Tổng hợp kho từ đã thuộc (deckId = 0)
     */
    @Transactional(readOnly = true)
    public ExerciseItemDto generateExercise(ExerciseGenerateRequest request) {
        Long deckId = request.getDeckId() != null ? request.getDeckId() : 0L;
        String level = request.getLevel() != null ? request.getLevel() : "TOEIC_550";

        if (deckId <= 0L) {
            // Chế độ Luyện tập Tổng hợp: Lấy toàn bộ từ có trọng số 1 (mastered)
            List<dev.hieu.vocabulary.entity.WordProgress> masteredProgress = wordProgressRepository.findByWeight(1);
            List<Word> words = masteredProgress.stream()
                    .map(dev.hieu.vocabulary.entity.WordProgress::getWord)
                    .filter(java.util.Objects::nonNull)
                    .toList();

            if (words.isEmpty()) {
                throw new IllegalArgumentException("Bạn chưa có từ vựng nào đạt mức học thuộc (trọng số 1) để làm bài tổng hợp!");
            }
            return geminiExerciseService.generateExercise(0L, "Luyện tập Tổng hợp (Từ đã thuộc)", level, words);
        }

        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bộ thẻ với ID: " + deckId));

        List<Word> words = wordRepository.findByDeckId(deckId);
        if (words.isEmpty()) {
            throw new IllegalArgumentException("Bộ thẻ này chưa có từ vựng nào!");
        }

        return geminiExerciseService.generateExercise(deckId, deck.getName(), level, words);
    }

    /**
     * Chấm điểm bài làm, lưu lại toàn bộ câu hỏi + câu trả lời + giải thích vào Database
     */
    @Transactional
    public ExerciseResultDto submitExercise(ExerciseSubmitRequest request) {
        Deck deck = null;
        if (request.getDeckId() != null && request.getDeckId() > 0) {
            deck = deckRepository.findById(request.getDeckId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bộ thẻ với ID: " + request.getDeckId()));
        }

        List<String> targetAnswers = request.getTargetAnswers() != null ? request.getTargetAnswers() : List.of();
        List<String> userAnswers = request.getUserAnswers() != null ? request.getUserAnswers() : List.of();

        List<BlankEvaluationDto> evaluations = new ArrayList<>();
        int correctCount = 0;
        int totalBlanks = targetAnswers.size();

        for (int i = 0; i < totalBlanks; i++) {
            String target = targetAnswers.get(i).trim();
            String user = (i < userAnswers.size() && userAnswers.get(i) != null) ? userAnswers.get(i).trim() : "";

            // So sánh không phân biệt hoa thường và bỏ khoảng trắng thừa
            boolean isCorrect = normalizeString(target).equalsIgnoreCase(normalizeString(user));
            if (isCorrect) {
                correctCount++;
            }

            evaluations.add(BlankEvaluationDto.builder()
                    .blankIndex(i + 1)
                    .targetAnswer(target)
                    .userAnswer(user)
                    .isCorrect(isCorrect)
                    .build());
        }

        double scorePercent = totalBlanks > 0 ? Math.round(((double) correctCount / totalBlanks) * 1000.0) / 10.0 : 0.0;
        boolean isPassed = scorePercent >= 70.0;

        // Lưu vào bảng exercise_history
        String targetAnswersJson = "";
        String userAnswersJson = "";
        try {
            targetAnswersJson = objectMapper.writeValueAsString(targetAnswers);
            userAnswersJson = objectMapper.writeValueAsString(userAnswers);
        } catch (Exception e) {
            log.error("Lỗi serialize JSON đáp án: {}", e.getMessage());
        }

        ExerciseHistory history = ExerciseHistory.builder()
                .deck(deck)
                .level(request.getLevel())
                .title(request.getTitle())
                .content(request.getContent())
                .translation(request.getTranslation())
                .targetAnswers(targetAnswersJson)
                .userAnswers(userAnswersJson)
                .scorePercent(scorePercent)
                .isPassed(isPassed)
                .explanation(request.getExplanation())
                .audioScript(request.getAudioScript())
                .build();

        ExerciseHistory saved = exerciseHistoryRepository.save(history);

        return ExerciseResultDto.builder()
                .historyId(saved.getId())
                .scorePercent(scorePercent)
                .isPassed(isPassed)
                .evaluations(evaluations)
                .explanation(request.getExplanation())
                .translation(request.getTranslation())
                .build();
    }

    /**
     * Lấy danh sách lịch sử bài tập đã làm theo Deck (hoặc deckId = 0 cho Tổng hợp)
     */
    @Transactional(readOnly = true)
    public List<ExerciseHistoryDetailDto> getHistoryByDeck(Long deckId) {
        List<ExerciseHistory> list;
        if (deckId == null || deckId <= 0L) {
            list = exerciseHistoryRepository.findByDeckIsNullOrderByCreatedAtDesc();
        } else {
            list = exerciseHistoryRepository.findByDeckIdOrderByCreatedAtDesc(deckId);
        }
        List<ExerciseHistoryDetailDto> dtos = new ArrayList<>();

        for (ExerciseHistory h : list) {
            dtos.add(mapToDetailDto(h));
        }
        return dtos;
    }

    /**
     * Xem chi tiết 1 bài tập cũ kèm lời giải thích
     */
    @Transactional(readOnly = true)
    public ExerciseHistoryDetailDto getHistoryDetail(Long id) {
        ExerciseHistory h = exerciseHistoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài tập lịch sử ID: " + id));
        return mapToDetailDto(h);
    }

    /**
     * Kiểm tra trạng thái mở khóa của bài tập ứng dụng cho 1 Deck (hoặc Tổng hợp nếu deckId = 0)
     */
    @Transactional(readOnly = true)
    public ExerciseStatusDto getExerciseStatus(Long deckId) {
        if (deckId == null || deckId <= 0L) {
            List<dev.hieu.vocabulary.entity.WordProgress> masteredProgress = wordProgressRepository.findByWeight(1);
            int masteredCount = masteredProgress.size();
            int totalExercises = exerciseHistoryRepository.findByDeckIsNullOrderByCreatedAtDesc().size();
            return ExerciseStatusDto.builder()
                    .deckId(0L)
                    .deckName("Luyện tập Tổng hợp (Kho từ đã thuộc)")
                    .isUnlocked(masteredCount >= 5)
                    .quizProgress((double) masteredCount)
                    .reverseProgress(100.0)
                    .listeningProgress(100.0)
                    .totalCompletedExercises(totalExercises)
                    .build();
        }

        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bộ thẻ với ID: " + deckId));

        List<DeckSummaryDto> deckSummaries = quizService.getDecksWithProgress();
        DeckSummaryDto currentSummary = deckSummaries.stream()
                .filter(d -> d.getId().equals(deckId))
                .findFirst()
                .orElse(null);

        double quizProg = currentSummary != null ? currentSummary.getProgressPercent() : 0.0;
        double revProg = currentSummary != null ? currentSummary.getReverseProgressPercent() : 0.0;
        double listProg = currentSummary != null ? currentSummary.getListeningProgressPercent() : 0.0;

        boolean quizUnlocked = Boolean.TRUE.equals(deck.getQuizPracticeUnlocked()) || quizProg >= 100.0;
        boolean revUnlocked = Boolean.TRUE.equals(deck.getReversePracticeUnlocked()) || revProg >= 100.0;
        boolean listUnlocked = Boolean.TRUE.equals(deck.getListeningPracticeUnlocked()) || listProg >= 100.0;

        boolean isUnlocked = quizUnlocked && revUnlocked && listUnlocked;

        int totalExercises = exerciseHistoryRepository.findByDeckIdOrderByCreatedAtDesc(deckId).size();

        return ExerciseStatusDto.builder()
                .deckId(deckId)
                .deckName(deck.getName())
                .isUnlocked(isUnlocked)
                .quizProgress(quizProg)
                .reverseProgress(revProg)
                .listeningProgress(listProg)
                .totalCompletedExercises(totalExercises)
                .build();
    }

    private String normalizeString(String input) {
        if (input == null) return "";
        return input.trim().replaceAll("\\s+", " ").replaceAll("[.,!?;:]", "");
    }

    private ExerciseHistoryDetailDto mapToDetailDto(ExerciseHistory h) {
        List<String> targetAnswers = List.of();
        List<String> userAnswers = List.of();
        try {
            if (h.getTargetAnswers() != null && !h.getTargetAnswers().isBlank()) {
                targetAnswers = objectMapper.readValue(h.getTargetAnswers(), new TypeReference<List<String>>() {});
            }
            if (h.getUserAnswers() != null && !h.getUserAnswers().isBlank()) {
                userAnswers = objectMapper.readValue(h.getUserAnswers(), new TypeReference<List<String>>() {});
            }
        } catch (Exception e) {
            log.error("Lỗi parse JSON lịch sử: {}", e.getMessage());
        }

        Long deckId = h.getDeck() != null ? h.getDeck().getId() : 0L;
        String deckName = h.getDeck() != null ? h.getDeck().getName() : "Luyện tập Tổng hợp";

        return ExerciseHistoryDetailDto.builder()
                .id(h.getId())
                .deckId(deckId)
                .deckName(deckName)
                .level(h.getLevel())
                .title(h.getTitle())
                .content(h.getContent())
                .translation(h.getTranslation())
                .targetAnswers(targetAnswers)
                .userAnswers(userAnswers)
                .scorePercent(h.getScorePercent())
                .isPassed(h.getIsPassed())
                .explanation(h.getExplanation())
                .audioScript(h.getAudioScript())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
