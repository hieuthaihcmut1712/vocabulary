package dev.hieu.vocabulary.service;

import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.entity.Deck;
import dev.hieu.vocabulary.entity.ListeningProgress;
import dev.hieu.vocabulary.entity.Word;
import dev.hieu.vocabulary.repository.DeckRepository;
import dev.hieu.vocabulary.repository.ListeningProgressRepository;
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
public class ListeningQuizService {

    private final DeckRepository deckRepository;
    private final WordRepository wordRepository;
    private final ListeningProgressRepository listeningProgressRepository;

    // Cooldown queue theo từng deck để tránh lặp lại từ vừa nghe
    private final Map<Long, Queue<Long>> recentListeningWordHistory = new ConcurrentHashMap<>();

    /**
     * Bốc ngẫu nhiên từ để luyện nghe chính tả theo Roulette Wheel Selection.
     * Có thanh tiến độ nghe riêng (DeckProgressPercent).
     */
    @Transactional
    public ListeningQuestionDto getNextQuestion(Long deckId) {
        List<ListeningProgress> allProgress = listeningProgressRepository.findByDeckId(deckId);
        
        // Nếu chưa có trong bảng listening_progress (dự phòng), tự động khởi tạo với weight = 5
        if (allProgress.isEmpty()) {
            List<Word> deckWords = wordRepository.findByDeckId(deckId);
            if (deckWords.isEmpty()) {
                throw new IllegalArgumentException("Không tìm thấy từ vựng nào trong bộ thẻ ID: " + deckId);
            }
            List<ListeningProgress> newProgressList = deckWords.stream()
                    .map(w -> ListeningProgress.builder()
                            .deckId(deckId)
                            .word(w)
                            .weight(5)
                            .correctCount(0)
                            .wrongCount(0)
                            .build())
                    .collect(Collectors.toList());
            allProgress = listeningProgressRepository.saveAll(newProgressList);
        }

        Deck deck = deckRepository.findById(deckId).orElse(null);
        String deckName = deck != null ? deck.getName() : "Bộ từ vựng";

        // Thống kê tiến độ kỹ năng nghe:
        // Trọng số ban đầu là 5.
        // weight == 1: Mastered (1.0 điểm)
        // weight < 3 và > 1 (tức là 2): Learning (0.5 điểm)
        // weight >= 3: Unlearned (0 điểm)
        int totalWords = allProgress.size();
        long mastered = allProgress.stream().filter(lp -> lp.getWeight() != null && lp.getWeight() == 1).count();
        long learning = allProgress.stream().filter(lp -> lp.getWeight() != null && lp.getWeight() > 1 && lp.getWeight() < 3).count();
        long unlearned = allProgress.stream().filter(lp -> lp.getWeight() == null || lp.getWeight() >= 3).count();
        double currentProgressPercent = calculateListeningProgressPercent(totalWords, mastered, learning);

        // 1. Áp dụng Cooldown Buffer
        Queue<Long> recentQueue = recentListeningWordHistory.computeIfAbsent(deckId, k -> new LinkedList<>());
        int cooldownLimit = Math.min(10, Math.max(1, allProgress.size() / 3));

        List<ListeningProgress> eligible = allProgress.stream()
                .filter(lp -> !recentQueue.contains(lp.getWord().getId()))
                .collect(Collectors.toList());

        if (eligible.isEmpty()) {
            eligible = allProgress;
        }

        // 2. Cơ chế 80/20: Ưu tiên từ chưa thuộc (weight >= 3)
        List<ListeningProgress> unmasteredPool = eligible.stream()
                .filter(lp -> lp.getWeight() != null && lp.getWeight() >= 3)
                .collect(Collectors.toList());

        List<ListeningProgress> masteredPool = eligible.stream()
                .filter(lp -> lp.getWeight() != null && lp.getWeight() < 3)
                .collect(Collectors.toList());

        List<ListeningProgress> poolToPick = eligible;
        if (!unmasteredPool.isEmpty() && !masteredPool.isEmpty()) {
            boolean focusUnmastered = ThreadLocalRandom.current().nextInt(100) < 80;
            poolToPick = focusUnmastered ? unmasteredPool : masteredPool;
        }

        // 3. Bốc theo Roulette Wheel Selection trong pool đã chọn
        int totalWeightInPool = poolToPick.stream().mapToInt(lp -> Math.max(1, lp.getWeight())).sum();
        int randomValue = ThreadLocalRandom.current().nextInt(totalWeightInPool);
        int accumulatedWeight = 0;
        ListeningProgress selected = poolToPick.get(0);

        for (ListeningProgress lp : poolToPick) {
            accumulatedWeight += Math.max(1, lp.getWeight());
            if (randomValue < accumulatedWeight) {
                selected = lp;
                break;
            }
        }

        // Cập nhật Cooldown Queue
        recentQueue.add(selected.getWord().getId());
        while (recentQueue.size() > cooldownLimit) {
            recentQueue.poll();
        }

        Word word = selected.getWord();
        int totalAllWeight = allProgress.stream().mapToInt(lp -> Math.max(1, lp.getWeight())).sum();
        double probabilityPercent = ((double) selected.getWeight() / totalAllWeight) * 100.0;

        return ListeningQuestionDto.builder()
                .wordId(word.getId())
                .term(word.getTerm())
                .meaning(word.getMeaning())
                .partOfSpeech(word.getPartOfSpeech())
                .phonetic(word.getPhonetic())
                .example(word.getExample())
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
     * Nộp bài kiểm tra nghe chính tả:
     * - Đúng ngay lần nghe 1: -2 trọng số
     * - Đúng ở lần nghe 2 - 3: -1 trọng số
     * - Đúng khi nghe > 3 lần: 0 (không giảm)
     * - Sai: +1 trọng số
     * - Min weight = 1, Max weight = 10
     */
    @Transactional
    public ListeningResultDto submitAnswer(ListeningSubmitRequest request) {
        Word word = wordRepository.findById(request.getWordId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy từ vựng ID: " + request.getWordId()));

        ListeningProgress progress = listeningProgressRepository.findByWordId(word.getId())
                .orElseGet(() -> {
                    ListeningProgress lp = ListeningProgress.builder()
                            .deckId(word.getDeck().getId())
                            .word(word)
                            .weight(5)
                            .correctCount(0)
                            .wrongCount(0)
                            .build();
                    return listeningProgressRepository.save(lp);
                });

        int listenCount = request.getListenCount() != null ? Math.max(1, request.getListenCount()) : 1;
        String rawInput = request.getTypedText() != null ? request.getTypedText().trim() : "";

        // Chuẩn hóa so sánh không phân biệt hoa thường và khoảng trắng dư thừa
        String normalizedInput = rawInput.toLowerCase().replaceAll("\\s+", " ");
        String normalizedTarget = word.getTerm().trim().toLowerCase().replaceAll("\\s+", " ");

        boolean isCorrect = normalizedInput.equals(normalizedTarget);
        int oldWeight = progress.getWeight();
        int delta;
        String feedback;

        if (isCorrect) {
            progress.setCorrectCount(progress.getCorrectCount() + 1);
            if (listenCount == 1) {
                delta = -2;
                feedback = "🎯 Xuất sắc! Nghe 1 lần đúng ngay (-2 trọng số)";
            } else if (listenCount <= 3) {
                delta = -1;
                feedback = "👍 Tốt lắm! Gõ đúng sau " + listenCount + " lần nghe (-1 trọng số)";
            } else {
                delta = 0;
                feedback = "👌 Đúng chính tả! Cố gắng giảm số lần nghe để tăng điểm (0 trọng số)";
            }
        } else {
            progress.setWrongCount(progress.getWrongCount() + 1);
            delta = +1;
            feedback = "❌ Chưa chính xác (+1 trọng số để luyện lại)";
        }

        int newWeight = Math.max(1, Math.min(10, oldWeight + delta));
        progress.setWeight(newWeight);
        progress.setLastListenCount(listenCount);
        progress.setLastResponseTimeSeconds(request.getResponseTimeSeconds());
        progress.setLastReviewedAt(LocalDateTime.now());
        listeningProgressRepository.save(progress);

        // Tính lại tiến độ bộ thẻ ngay lập tức
        List<ListeningProgress> allProgress = listeningProgressRepository.findByDeckId(progress.getDeckId());
        int totalWords = allProgress.size();
        long mastered = allProgress.stream().filter(lp -> lp.getWeight() != null && lp.getWeight() == 1).count();
        long learning = allProgress.stream().filter(lp -> lp.getWeight() != null && lp.getWeight() > 1 && lp.getWeight() < 3).count();
        long unlearned = allProgress.stream().filter(lp -> lp.getWeight() == null || lp.getWeight() >= 3).count();
        double updatedProgressPercent = calculateListeningProgressPercent(totalWords, mastered, learning);

        if (updatedProgressPercent >= 100.0) {
            Deck deck = deckRepository.findById(progress.getDeckId()).orElse(null);
            if (deck != null && !Boolean.TRUE.equals(deck.getListeningPracticeUnlocked())) {
                deck.setListeningPracticeUnlocked(true);
                deckRepository.save(deck);
            }
        }

        return ListeningResultDto.builder()
                .isCorrect(isCorrect)
                .correctTerm(word.getTerm())
                .meaning(word.getMeaning())
                .oldWeight(oldWeight)
                .newWeight(newWeight)
                .weightDelta(delta)
                .listenCount(listenCount)
                .feedbackMessage(feedback)
                .deckProgressPercent(updatedProgressPercent)
                .masteredWords(mastered)
                .learningWords(learning)
                .unlearnedWords(unlearned)
                .build();
    }

    /**
     * Khởi tạo dữ liệu cho chế độ Luyện tập nghe chính tả (Listening Practice Mode).
     * Mở khóa vĩnh viễn nếu đã từng đạt 100%.
     * Trả về danh sách từ vựng để frontend tự quản lý trọng số in-memory (reset về 5 mỗi lần luyện tập).
     */
    @Transactional
    public ListeningPracticeInitDto getPracticeInit(Long deckId) {
        Deck deck = deckRepository.findById(deckId).orElse(null);
        String deckName = deck != null ? deck.getName() : "Bộ từ vựng";

        List<ListeningProgress> allProgress = listeningProgressRepository.findByDeckId(deckId);
        int totalWords = allProgress.size();
        long mastered = allProgress.stream().filter(lp -> lp.getWeight() != null && lp.getWeight() == 1).count();
        long learning = allProgress.stream().filter(lp -> lp.getWeight() != null && lp.getWeight() > 1 && lp.getWeight() < 3).count();
        double progressPercent = calculateListeningProgressPercent(totalWords, mastered, learning);

        boolean unlocked = (deck != null && Boolean.TRUE.equals(deck.getListeningPracticeUnlocked())) || progressPercent >= 100.0;
        if (deck != null && progressPercent >= 100.0 && !Boolean.TRUE.equals(deck.getListeningPracticeUnlocked())) {
            deck.setListeningPracticeUnlocked(true);
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

        return ListeningPracticeInitDto.builder()
                .deckId(deckId)
                .deckName(deckName)
                .listeningProgressPercent(progressPercent)
                .unlocked(unlocked)
                .words(wordDtos)
                .build();
    }

    public double calculateListeningProgressPercent(int totalWords, long mastered, long learning) {
        if (totalWords <= 0) return 0.0;
        double totalScore = (mastered * 1.0) + (learning * 0.5);
        double percent = (totalScore / totalWords) * 100.0;
        return Math.round(percent * 10.0) / 10.0;
    }
}
