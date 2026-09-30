package dev.hieu.vocabulary.service;

import dev.hieu.vocabulary.dto.QuizQuestionDto;
import dev.hieu.vocabulary.dto.QuizResultDto;
import dev.hieu.vocabulary.dto.QuizSubmitRequest;
import dev.hieu.vocabulary.entity.ReviewLog;
import dev.hieu.vocabulary.entity.Word;
import dev.hieu.vocabulary.entity.WordProgress;
import dev.hieu.vocabulary.repository.ReviewLogRepository;
import dev.hieu.vocabulary.repository.WordProgressRepository;
import dev.hieu.vocabulary.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final WordRepository wordRepository;
    private final WordProgressRepository wordProgressRepository;
    private final ReviewLogRepository reviewLogRepository;

    /**
     * Bốc ngẫu nhiên một từ theo tỉ lệ trọng số (Roulette Wheel Selection)
     * và sinh 4 đáp án (1 đúng + 3 ngẫu nhiên).
     */
    @Transactional(readOnly = true)
    public QuizQuestionDto getNextQuestion(Long deckId) {
        List<WordProgress> progressList = wordProgressRepository.findByDeckId(deckId);
        if (progressList.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy từ vựng nào trong bộ thẻ ID: " + deckId);
        }

        // Tính tổng trọng số
        int totalWeight = progressList.stream().mapToInt(WordProgress::getWeight).sum();

        // Bốc ngẫu nhiên theo trọng số
        int randomValue = ThreadLocalRandom.current().nextInt(totalWeight);
        int accumulatedWeight = 0;
        WordProgress selectedProgress = progressList.get(0);

        for (WordProgress wp : progressList) {
            accumulatedWeight += wp.getWeight();
            if (randomValue < accumulatedWeight) {
                selectedProgress = wp;
                break;
            }
        }

        Word targetWord = selectedProgress.getWord();
        double probabilityPercent = ((double) selectedProgress.getWeight() / totalWeight) * 100.0;

        // Lấy 3 đáp án nhiễu ngẫu nhiên từ các từ khác trong bộ thẻ
        List<Word> allWords = wordRepository.findByDeckId(deckId);
        List<String> distractorMeanings = allWords.stream()
                .filter(w -> !w.getId().equals(targetWord.getId()))
                .map(Word::getMeaning)
                .distinct()
                .collect(Collectors.toList());

        Collections.shuffle(distractorMeanings);
        List<String> options = new ArrayList<>();
        options.add(targetWord.getMeaning()); // Đáp án đúng

        int distractorsToTake = Math.min(3, distractorMeanings.size());
        for (int i = 0; i < distractorsToTake; i++) {
            options.add(distractorMeanings.get(i));
        }

        // Trộn ngẫu nhiên vị trí của 4 đáp án
        Collections.shuffle(options);

        return QuizQuestionDto.builder()
                .wordId(targetWord.getId())
                .term(targetWord.getTerm())
                .partOfSpeech(targetWord.getPartOfSpeech())
                .phonetic(targetWord.getPhonetic())
                .options(options)
                .currentWeight(selectedProgress.getWeight())
                .probabilityPercent(Math.round(probabilityPercent * 10.0) / 10.0)
                .totalWords(progressList.size())
                .build();
    }

    /**
     * Chấm điểm câu trả lời, tính toán lại trọng số theo thời gian phản xạ và lưu
     * lịch sử.
     */
    @Transactional
    public QuizResultDto submitAnswer(QuizSubmitRequest request) {
        Word word = wordRepository.findById(request.getWordId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy từ vựng ID: " + request.getWordId()));

        WordProgress progress = wordProgressRepository.findByWordId(word.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tiến độ của từ ID: " + word.getId()));

        boolean isCorrect = word.getMeaning().trim().equalsIgnoreCase(request.getSelectedMeaning().trim());
        double responseTime = request.getResponseTimeSeconds() != null ? request.getResponseTimeSeconds() : 0.0;

        int oldWeight = progress.getWeight();
        int delta;
        String feedback;

        if (isCorrect) {
            progress.setCorrectCount(progress.getCorrectCount() + 1);
            if (responseTime < 1.5) {
                delta = -3;
                feedback = "⚡ Phản xạ siêu tốc!";
            } else if (responseTime < 3.0) {
                delta = -2;
                feedback = "🔥 Nhớ rất tốt!";
            } else if (responseTime < 5.0) {
                delta = -1;
                feedback = "👍 Đúng rồi!";
            } else {
                delta = 0;
                feedback = "👌 Đúng nhưng cần tăng tốc";
            }
        } else {
            progress.setWrongCount(progress.getWrongCount() + 1);
            delta = +2;
            feedback = "❌ Chưa chính xác! Trọng số tăng lên để ôn lại.";
        }

        // Đảm bảo min là 1, max là 30
        int newWeight = Math.max(1, Math.min(30, oldWeight + delta));
        progress.setWeight(newWeight);
        progress.setLastResponseTimeSeconds(responseTime);
        progress.setLastReviewedAt(LocalDateTime.now());
        wordProgressRepository.save(progress);

        // Lưu lịch sử ôn tập ReviewLog
        ReviewLog log = ReviewLog.builder()
                .wordProgress(progress)
                .isCorrect(isCorrect)
                .responseTimeSeconds(responseTime)
                .oldWeight(oldWeight)
                .newWeight(newWeight)
                .build();
        reviewLogRepository.save(log);

        return QuizResultDto.builder()
                .isCorrect(isCorrect)
                .correctMeaning(word.getMeaning())
                .oldWeight(oldWeight)
                .newWeight(newWeight)
                .weightDelta(delta)
                .responseTimeSeconds(responseTime)
                .feedbackMessage(feedback)
                .build();
    }
}
