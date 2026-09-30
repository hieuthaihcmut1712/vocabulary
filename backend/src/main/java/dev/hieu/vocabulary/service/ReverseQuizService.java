package dev.hieu.vocabulary.service;

import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.entity.Deck;
import dev.hieu.vocabulary.entity.ReverseWordProgress;
import dev.hieu.vocabulary.entity.Word;
import dev.hieu.vocabulary.repository.DeckRepository;
import dev.hieu.vocabulary.repository.ReverseWordProgressRepository;
import dev.hieu.vocabulary.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReverseQuizService {

    private final DeckRepository deckRepository;
    private final WordRepository wordRepository;
    private final ReverseWordProgressRepository reverseWordProgressRepository;

    // Cooldown queue theo từng deck để tránh lặp lại từ vừa xuất hiện
    private final Map<Long, Queue<Long>> recentReverseWordHistory = new ConcurrentHashMap<>();

    /**
     * Bốc ngẫu nhiên câu hỏi Quizziz Việt -> Anh (Đề: Nghĩa tiếng Việt, Chọn: Từ tiếng Anh)
     * Kèm thanh tiến độ riêng của kỹ năng Việt -> Anh.
     */
    @Transactional
    public ReverseQuizQuestionDto getNextQuestion(Long deckId) {
        List<ReverseWordProgress> allProgress = reverseWordProgressRepository.findByDeckId(deckId);

        // Khởi tạo dự phòng nếu chưa có
        if (allProgress.isEmpty()) {
            List<Word> deckWords = wordRepository.findByDeckId(deckId);
            if (deckWords.isEmpty()) {
                throw new IllegalArgumentException("Không tìm thấy từ vựng nào trong bộ thẻ ID: " + deckId);
            }
            List<ReverseWordProgress> newProgressList = deckWords.stream()
                    .map(w -> ReverseWordProgress.builder()
                            .deckId(deckId)
                            .word(w)
                            .weight(10)
                            .correctCount(0)
                            .wrongCount(0)
                            .build())
                    .collect(Collectors.toList());
            allProgress = reverseWordProgressRepository.saveAll(newProgressList);
        }

        Deck deck = deckRepository.findById(deckId).orElse(null);
        String deckName = deck != null ? deck.getName() : "Bộ từ vựng";

        // Thống kê tiến độ Việt -> Anh của bộ thẻ
        int totalWords = allProgress.size();
        long mastered = allProgress.stream().filter(rp -> rp.getWeight() != null && rp.getWeight() == 1).count();
        long learning = allProgress.stream().filter(rp -> rp.getWeight() != null && rp.getWeight() > 1 && rp.getWeight() < 5).count();
        long unlearned = allProgress.stream().filter(rp -> rp.getWeight() == null || rp.getWeight() >= 5).count();
        double currentProgressPercent = calculateProgressPercent(totalWords, mastered, learning);

        // 1. Áp dụng Cooldown Buffer
        Queue<Long> recentQueue = recentReverseWordHistory.computeIfAbsent(deckId, k -> new LinkedList<>());
        int cooldownLimit = Math.min(10, Math.max(1, allProgress.size() / 3));

        List<ReverseWordProgress> eligible = allProgress.stream()
                .filter(rp -> !recentQueue.contains(rp.getWord().getId()))
                .collect(Collectors.toList());

        if (eligible.isEmpty()) {
            eligible = allProgress;
        }

        // 2. Cơ chế 80/20: Ưu tiên từ chưa thuộc (weight >= 5)
        List<ReverseWordProgress> unmasteredPool = eligible.stream()
                .filter(rp -> rp.getWeight() != null && rp.getWeight() >= 5)
                .collect(Collectors.toList());

        List<ReverseWordProgress> masteredPool = eligible.stream()
                .filter(rp -> rp.getWeight() != null && rp.getWeight() < 5)
                .collect(Collectors.toList());

        List<ReverseWordProgress> poolToPick = eligible;
        if (!unmasteredPool.isEmpty() && !masteredPool.isEmpty()) {
            boolean focusUnmastered = ThreadLocalRandom.current().nextInt(100) < 80;
            poolToPick = focusUnmastered ? unmasteredPool : masteredPool;
        }

        // 3. Bốc theo Roulette Wheel Selection trong pool đã chọn
        int totalWeightInPool = poolToPick.stream().mapToInt(rp -> Math.max(1, rp.getWeight())).sum();
        int randomValue = ThreadLocalRandom.current().nextInt(totalWeightInPool);
        int accumulatedWeight = 0;
        ReverseWordProgress selected = poolToPick.get(0);

        for (ReverseWordProgress rp : poolToPick) {
            accumulatedWeight += Math.max(1, rp.getWeight());
            if (randomValue < accumulatedWeight) {
                selected = rp;
                break;
            }
        }

        recentQueue.add(selected.getWord().getId());
        while (recentQueue.size() > cooldownLimit) {
            recentQueue.poll();
        }

        Word targetWord = selected.getWord();
        int totalAllWeight = allProgress.stream().mapToInt(rp -> Math.max(1, rp.getWeight())).sum();
        double probabilityPercent = ((double) selected.getWeight() / totalAllWeight) * 100.0;

        // Sinh 4 lựa chọn (chọn từ tiếng Anh): 1 đáp án đúng + 3 đáp án gây nhiễu
        List<String> otherTerms = allProgress.stream()
                .map(rp -> rp.getWord().getTerm().trim())
                .filter(term -> !term.equalsIgnoreCase(targetWord.getTerm().trim()))
                .distinct()
                .collect(Collectors.toList());

        Collections.shuffle(otherTerms);
        List<String> options = new ArrayList<>();
        options.add(targetWord.getTerm().trim());

        int distractorsCount = Math.min(3, otherTerms.size());
        for (int i = 0; i < distractorsCount; i++) {
            options.add(otherTerms.get(i));
        }

        // Trộn ngẫu nhiên 4 đáp án tiếng Anh
        Collections.shuffle(options);

        return ReverseQuizQuestionDto.builder()
                .wordId(targetWord.getId())
                .meaning(targetWord.getMeaning()) // Đề bài hiển thị: Nghĩa tiếng Việt
                .partOfSpeech(targetWord.getPartOfSpeech())
                .options(options)                 // 4 đáp án chọn: Từ tiếng Anh
                .currentWeight(selected.getWeight())
                .probabilityPercent(Math.round(probabilityPercent * 10.0) / 10.0)
                .deckProgressPercent(currentProgressPercent)
                .masteredWords(mastered)
                .learningWords(learning)
                .unlearnedWords(unlearned)
                .totalWords(totalWords)
                .deckId(deckId)
                .deckName(deckName)
                .build();
    }

    /**
     * Nộp câu trả lời Quizziz Việt -> Anh:
     * - Tính tốc độ phản xạ tương tự Quizziz Anh -> Việt:
     *   < 1.5s: -3 | < 3s: -2 | < 5s: -1 | >= 5s: 0 | Sai: +2
     */
    @Transactional
    public ReverseQuizResultDto submitAnswer(ReverseQuizSubmitRequest request) {
        Word word = wordRepository.findById(request.getWordId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy từ vựng ID: " + request.getWordId()));

        ReverseWordProgress progress = reverseWordProgressRepository.findByWordId(word.getId())
                .orElseGet(() -> {
                    ReverseWordProgress rwp = ReverseWordProgress.builder()
                            .deckId(word.getDeck().getId())
                            .word(word)
                            .weight(10)
                            .correctCount(0)
                            .wrongCount(0)
                            .build();
                    return reverseWordProgressRepository.save(rwp);
                });

        boolean isCorrect = word.getTerm().trim().equalsIgnoreCase(request.getSelectedTerm() != null ? request.getSelectedTerm().trim() : "");
        double responseTime = request.getResponseTimeSeconds() != null ? request.getResponseTimeSeconds() : 0.0;

        int oldWeight = progress.getWeight();
        int delta;
        String feedback;

        if (isCorrect) {
            progress.setCorrectCount(progress.getCorrectCount() + 1);
            if (responseTime < 1.5) {
                delta = -3;
                feedback = "⚡ Phản xạ siêu tốc (< 1.5s)!";
            } else if (responseTime < 3.0) {
                delta = -2;
                feedback = "🔥 Nhớ rất tốt (< 3s)!";
            } else if (responseTime < 5.0) {
                delta = -1;
                feedback = "👍 Đúng rồi (< 5s)!";
            } else {
                delta = 0;
                feedback = "👌 Đúng nhưng cần tăng tốc (≥ 5s)";
            }
        } else {
            progress.setWrongCount(progress.getWrongCount() + 1);
            delta = +2;
            feedback = "❌ Chưa chính xác! Trọng số tăng lên để ôn lại.";
        }

        int newWeight = Math.max(1, Math.min(30, oldWeight + delta));
        progress.setWeight(newWeight);
        progress.setLastResponseTimeSeconds(responseTime);
        progress.setLastReviewedAt(LocalDateTime.now());
        reverseWordProgressRepository.save(progress);

        // Tính toán lại tiến độ bộ thẻ
        List<ReverseWordProgress> allProgress = reverseWordProgressRepository.findByDeckId(progress.getDeckId());
        int totalWords = allProgress.size();
        long mastered = allProgress.stream().filter(rp -> rp.getWeight() != null && rp.getWeight() == 1).count();
        long learning = allProgress.stream().filter(rp -> rp.getWeight() != null && rp.getWeight() > 1 && rp.getWeight() < 5).count();
        long unlearned = allProgress.stream().filter(rp -> rp.getWeight() == null || rp.getWeight() >= 5).count();
        double updatedProgressPercent = calculateProgressPercent(totalWords, mastered, learning);

        if (updatedProgressPercent >= 100.0) {
            Deck deck = deckRepository.findById(progress.getDeckId()).orElse(null);
            if (deck != null && !Boolean.TRUE.equals(deck.getReversePracticeUnlocked())) {
                deck.setReversePracticeUnlocked(true);
                deckRepository.save(deck);
            }
        }

        return ReverseQuizResultDto.builder()
                .isCorrect(isCorrect)
                .correctTerm(word.getTerm())
                .meaning(word.getMeaning())
                .oldWeight(oldWeight)
                .newWeight(newWeight)
                .weightDelta(delta)
                .responseTimeSeconds(responseTime)
                .feedbackMessage(feedback)
                .deckProgressPercent(updatedProgressPercent)
                .masteredWords(mastered)
                .learningWords(learning)
                .unlearnedWords(unlearned)
                .build();
    }

    /**
     * Khởi tạo dữ liệu cho chế độ Luyện tập Việt -> Anh (mở khóa vĩnh viễn nếu đã từng đạt 100%)
     */
    @Transactional
    public ReversePracticeInitDto getPracticeInit(Long deckId) {
        Deck deck = deckRepository.findById(deckId).orElse(null);
        String deckName = deck != null ? deck.getName() : "Bộ từ vựng";

        List<ReverseWordProgress> allProgress = reverseWordProgressRepository.findByDeckId(deckId);
        int totalWords = allProgress.size();
        long mastered = allProgress.stream().filter(rp -> rp.getWeight() != null && rp.getWeight() == 1).count();
        long learning = allProgress.stream().filter(rp -> rp.getWeight() != null && rp.getWeight() > 1 && rp.getWeight() < 5).count();
        double progressPercent = calculateProgressPercent(totalWords, mastered, learning);

        boolean unlocked = (deck != null && Boolean.TRUE.equals(deck.getReversePracticeUnlocked())) || progressPercent >= 100.0;
        if (deck != null && progressPercent >= 100.0 && !Boolean.TRUE.equals(deck.getReversePracticeUnlocked())) {
            deck.setReversePracticeUnlocked(true);
            deckRepository.save(deck);
        }

        List<Word> words = wordRepository.findByDeckId(deckId);
        List<WordDto> wordDtos = words.stream()
                .map(w -> WordDto.builder()
                        .id(w.getId())
                        .term(w.getTerm())
                        .partOfSpeech(w.getPartOfSpeech())
                        .phonetic(w.getPhonetic())
                        .meaning(w.getMeaning())
                        .build())
                .collect(Collectors.toList());

        return ReversePracticeInitDto.builder()
                .deckId(deckId)
                .deckName(deckName)
                .reverseProgressPercent(progressPercent)
                .unlocked(unlocked)
                .words(wordDtos)
                .build();
    }

    public double calculateProgressPercent(int totalWords, long mastered, long learning) {
        if (totalWords <= 0) return 0.0;
        double totalScore = (mastered * 1.0) + (learning * 0.5);
        double percent = (totalScore / totalWords) * 100.0;
        return Math.round(percent * 10.0) / 10.0;
    }
}
