package dev.hieu.vocabulary.service;

import dev.hieu.vocabulary.config.ProfileContextHolder;
import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.entity.Deck;
import dev.hieu.vocabulary.entity.ListeningProgress;
import dev.hieu.vocabulary.entity.ReverseWordProgress;
import dev.hieu.vocabulary.entity.ReviewLog;
import dev.hieu.vocabulary.entity.Word;
import dev.hieu.vocabulary.entity.WordProgress;
import dev.hieu.vocabulary.repository.*;
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
public class QuizService {

    private final DeckRepository deckRepository;
    private final WordRepository wordRepository;
    private final WordProgressRepository wordProgressRepository;
    private final ReverseWordProgressRepository reverseWordProgressRepository;
    private final ListeningProgressRepository listeningProgressRepository;
    private final ReviewLogRepository reviewLogRepository;

    // Cooldown queue theo từng deck và profile để tránh lặp lại từ vừa xuất hiện
    private final Map<String, Queue<Long>> recentWordHistory = new ConcurrentHashMap<>();

    /**
     * Lấy danh sách các bộ thẻ kèm thống kê tiến độ chi tiết của cả 3 kỹ năng
     */
    @Transactional
    public List<DeckSummaryDto> getDecksWithProgress() {
        String profile = ProfileContextHolder.getProfile();
        boolean isDTan = "dtan".equalsIgnoreCase(profile);
        List<Deck> decks = deckRepository.findAllByOrderByIdAsc();
        if (isDTan) {
            decks = decks.stream()
                    .filter(d -> (d.getId() >= 19 && d.getId() <= 28) || (d.getName() != null && d.getName().contains("600 TOEIC")))
                    .sorted(Comparator.comparing(Deck::getId))
                    .collect(Collectors.toList());
        }
        List<DeckSummaryDto> summaries = new ArrayList<>();

        for (Deck deck : decks) {
            Long deckId = deck.getId();
            List<Word> words = wordRepository.findByDeckId(deckId);
            int totalWords = words.size();
            if (totalWords == 0) continue;

            // 1. Quizziz Anh -> Việt (WordProgress)
            List<WordProgress> quizProgressList = wordProgressRepository.findByDeckIdAndUserProfile(deckId, profile);
            long mastered = quizProgressList.stream().filter(p -> p.getWeight() != null && p.getWeight() == 1).count();
            long learning = quizProgressList.stream().filter(p -> p.getWeight() != null && p.getWeight() > 1 && p.getWeight() < 5).count();
            long unlearned = Math.max(0, totalWords - mastered - learning);
            double progressPercent = calculateProgressPercent(totalWords, mastered, learning);
            boolean quizUnlocked = isDTan 
                    ? progressPercent >= 100.0 
                    : (Boolean.TRUE.equals(deck.getQuizPracticeUnlocked()) || progressPercent >= 100.0);
            if (!isDTan && progressPercent >= 100.0 && !Boolean.TRUE.equals(deck.getQuizPracticeUnlocked())) {
                deck.setQuizPracticeUnlocked(true);
                deckRepository.save(deck);
            }

            // 2. Quizziz Việt -> Anh (ReverseWordProgress)
            List<ReverseWordProgress> reverseList = reverseWordProgressRepository.findByDeckIdAndUserProfile(deckId, profile);
            long revMastered = reverseList.stream().filter(p -> p.getWeight() != null && p.getWeight() == 1).count();
            long revLearning = reverseList.stream().filter(p -> p.getWeight() != null && p.getWeight() > 1 && p.getWeight() < 5).count();
            long revUnlearned = Math.max(0, totalWords - revMastered - revLearning);
            double revProgressPercent = calculateProgressPercent(totalWords, revMastered, revLearning);
            boolean revUnlocked = isDTan 
                    ? revProgressPercent >= 100.0 
                    : (Boolean.TRUE.equals(deck.getReversePracticeUnlocked()) || revProgressPercent >= 100.0);
            if (!isDTan && revProgressPercent >= 100.0 && !Boolean.TRUE.equals(deck.getReversePracticeUnlocked())) {
                deck.setReversePracticeUnlocked(true);
                deckRepository.save(deck);
            }

            // 3. Luyện nghe (ListeningProgress)
            List<ListeningProgress> listeningList = listeningProgressRepository.findByDeckIdAndUserProfile(deckId, profile);
            long listMastered = listeningList.stream().filter(p -> p.getWeight() != null && p.getWeight() == 1).count();
            long listLearning = listeningList.stream().filter(p -> p.getWeight() != null && p.getWeight() > 1 && p.getWeight() < 3).count();
            long listUnlearned = Math.max(0, totalWords - listMastered - listLearning);
            double listProgressPercent = calculateProgressPercent(totalWords, listMastered, listLearning);
            boolean listUnlocked = Boolean.TRUE.equals(deck.getListeningPracticeUnlocked()) || listProgressPercent >= 100.0;
            if (!isDTan && listProgressPercent >= 100.0 && !Boolean.TRUE.equals(deck.getListeningPracticeUnlocked())) {
                deck.setListeningPracticeUnlocked(true);
                deckRepository.save(deck);
            }

            summaries.add(DeckSummaryDto.builder()
                    .id(deckId)
                    .name(deck.getName())
                    .description(deck.getDescription())
                    .totalWords(totalWords)
                    .masteredWords(mastered)
                    .learningWords(learning)
                    .unlearnedWords(unlearned)
                    .progressPercent(progressPercent)
                    .quizPracticeUnlocked(quizUnlocked)
                    .reverseMasteredWords(revMastered)
                    .reverseLearningWords(revLearning)
                    .reverseUnlearnedWords(revUnlearned)
                    .reverseProgressPercent(revProgressPercent)
                    .reversePracticeUnlocked(revUnlocked)
                    .listeningMasteredWords(listMastered)
                    .listeningLearningWords(listLearning)
                    .listeningUnlearnedWords(listUnlearned)
                    .listeningProgressPercent(listProgressPercent)
                    .listeningPracticeUnlocked(listUnlocked)
                    .build());
        }

        return summaries;
    }

    /**
     * Bốc ngẫu nhiên một từ theo tỉ lệ trọng số (Roulette Wheel Selection)
     * và sinh 4 đáp án (1 đúng + 3 ngẫu nhiên).
     */
    @Transactional
    public QuizQuestionDto getNextQuestion(Long deckId) {
        String profile = ProfileContextHolder.getProfile();
        List<WordProgress> progressList = wordProgressRepository.findByDeckIdAndUserProfile(deckId, profile);
        if (progressList.isEmpty()) {
            List<Word> allDeckWords = wordRepository.findByDeckId(deckId);
            if (allDeckWords.isEmpty()) {
                throw new IllegalArgumentException("Không tìm thấy từ vựng nào trong bộ thẻ ID: " + deckId);
            }
            List<WordProgress> newProg = allDeckWords.stream()
                    .map(w -> WordProgress.builder()
                            .deckId(deckId)
                            .word(w)
                            .weight(10)
                            .correctCount(0)
                            .wrongCount(0)
                            .userProfile(profile)
                            .build())
                    .collect(Collectors.toList());
            progressList = wordProgressRepository.saveAll(newProg);
        }

        String historyKey = deckId + ":" + profile;
        Queue<Long> history = recentWordHistory.computeIfAbsent(historyKey, k -> new LinkedList<>());
        int cooldownLimit = Math.max(1, progressList.size() / 3);

        // Lọc bớt các từ vừa hỏi trong 1/3 số từ gần nhất
        List<WordProgress> candidateList = progressList;
        List<WordProgress> filtered = progressList.stream()
                .filter(wp -> !history.contains(wp.getWord().getId()))
                .collect(Collectors.toList());
        if (!filtered.isEmpty()) {
            candidateList = filtered;
        }

        // Tính tổng trọng số hữu hiệu (nếu từ về 1 thì tỉ lệ xuất hiện là 0.5)
        double totalWeight = candidateList.stream()
                .mapToDouble(wp -> getEffectiveWeight(wp.getWeight()))
                .sum();

        // Bốc ngẫu nhiên theo trọng số
        double randomValue = ThreadLocalRandom.current().nextDouble(totalWeight);
        double accumulatedWeight = 0.0;
        WordProgress selectedProgress = candidateList.get(0);

        for (WordProgress wp : candidateList) {
            accumulatedWeight += getEffectiveWeight(wp.getWeight());
            if (randomValue < accumulatedWeight) {
                selectedProgress = wp;
                break;
            }
        }

        Word targetWord = selectedProgress.getWord();
        double effectiveWeight = getEffectiveWeight(selectedProgress.getWeight());
        double probabilityPercent = (effectiveWeight / totalWeight) * 100.0;

        // Cập nhật cooldown history (giữ 1/3 số từ gần nhất)
        history.offer(targetWord.getId());
        while (history.size() > cooldownLimit) {
            history.poll();
        }

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

        // Thông tin thống kê bộ thẻ hiện tại
        Deck deck = deckRepository.findById(deckId).orElse(null);
        String deckName = deck != null ? deck.getName() : "Bộ từ vựng";

        long mastered = progressList.stream().filter(p -> p.getWeight() != null && p.getWeight() == 1).count();
        long learning = progressList.stream().filter(p -> p.getWeight() != null && p.getWeight() > 1 && p.getWeight() < 5).count();
        long unlearned = Math.max(0, progressList.size() - mastered - learning);
        double deckProgressPercent = calculateProgressPercent(progressList.size(), mastered, learning);

        return QuizQuestionDto.builder()
                .wordId(targetWord.getId())
                .term(targetWord.getTerm())
                .partOfSpeech(targetWord.getPartOfSpeech())
                .phonetic(targetWord.getPhonetic())
                .options(options)
                .currentWeight(effectiveWeight)
                .probabilityPercent(Math.round(probabilityPercent * 10.0) / 10.0)
                .totalWords(progressList.size())
                .deckId(deckId)
                .deckName(deckName)
                .deckProgressPercent(deckProgressPercent)
                .masteredWords(mastered)
                .learningWords(learning)
                .unlearnedWords(unlearned)
                .build();
    }

    /**
     * Chấm điểm câu trả lời, tính toán lại trọng số theo thời gian phản xạ và lưu lịch sử.
     */
    @Transactional
    public QuizResultDto submitAnswer(QuizSubmitRequest request) {
        String profile = ProfileContextHolder.getProfile();
        Word word = wordRepository.findById(request.getWordId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy từ vựng ID: " + request.getWordId()));

        WordProgress progress = wordProgressRepository.findByWordIdAndUserProfile(word.getId(), profile)
                .orElseGet(() -> {
                    WordProgress wp = WordProgress.builder()
                            .deckId(word.getDeck().getId())
                            .word(word)
                            .weight(10)
                            .correctCount(0)
                            .wrongCount(0)
                            .userProfile(profile)
                            .build();
                    return wordProgressRepository.save(wp);
                });

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

        // Thống kê tiến độ mới nhất của bộ thẻ sau khi cập nhật
        Long targetDeckId = progress.getDeckId();
        List<WordProgress> allProgress = wordProgressRepository.findByDeckIdAndUserProfile(targetDeckId, profile);
        int totalWords = allProgress.size();
        long updatedMastered = allProgress.stream().filter(p -> p.getWeight() != null && p.getWeight() == 1).count();
        long updatedLearning = allProgress.stream().filter(p -> p.getWeight() != null && p.getWeight() > 1 && p.getWeight() < 5).count();
        double updatedProgressPercent = calculateProgressPercent(totalWords, updatedMastered, updatedLearning);

        return QuizResultDto.builder()
                .isCorrect(isCorrect)
                .correctMeaning(word.getMeaning())
                .oldWeight(oldWeight)
                .newWeight(newWeight)
                .weightDelta(delta)
                .responseTimeSeconds(responseTime)
                .feedbackMessage(feedback)
                .deckProgressPercent(updatedProgressPercent)
                .masteredWords(updatedMastered)
                .learningWords(updatedLearning)
                .build();
    }

    /**
     * Khởi tạo dữ liệu cho chế độ Luyện tập Anh -> Việt
     */
    @Transactional
    public PracticeInitDto getPracticeInit(Long deckId) {
        String profile = ProfileContextHolder.getProfile();
        boolean isDTan = "dtan".equalsIgnoreCase(profile);
        Deck deck = deckRepository.findById(deckId).orElse(null);
        String deckName = deck != null ? deck.getName() : "Bộ từ vựng";

        List<WordProgress> allProgress = wordProgressRepository.findByDeckIdAndUserProfile(deckId, profile);
        int totalWords = allProgress.size();
        long mastered = allProgress.stream().filter(wp -> wp.getWeight() != null && wp.getWeight() == 1).count();
        long learning = allProgress.stream().filter(wp -> wp.getWeight() != null && wp.getWeight() > 1 && wp.getWeight() < 5).count();
        double progressPercent = calculateProgressPercent(totalWords, mastered, learning);

        boolean unlocked = isDTan 
                ? progressPercent >= 100.0 
                : ((deck != null && Boolean.TRUE.equals(deck.getQuizPracticeUnlocked())) || progressPercent >= 100.0);
        if (!isDTan && deck != null && progressPercent >= 100.0 && !Boolean.TRUE.equals(deck.getQuizPracticeUnlocked())) {
            deck.setQuizPracticeUnlocked(true);
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

        return PracticeInitDto.builder()
                .deckId(deckId)
                .deckName(deckName)
                .quizProgressPercent(progressPercent)
                .unlocked(unlocked)
                .words(wordDtos)
                .build();
    }

    /**
     * Lấy danh sách toàn bộ từ vựng trong bộ thẻ
     */
    @Transactional(readOnly = true)
    public List<WordDto> getWordsByDeck(Long deckId) {
        List<Word> words = wordRepository.findByDeckId(deckId);
        return words.stream()
                .map(w -> WordDto.builder()
                        .id(w.getId())
                        .term(w.getTerm())
                        .partOfSpeech(w.getPartOfSpeech())
                        .phonetic(w.getPhonetic())
                        .meaning(w.getMeaning())
                        .build())
                .collect(Collectors.toList());
    }

    private double getEffectiveWeight(Integer weight) {
        if (weight == null) {
            return 10.0;
        }
        return weight <= 1 ? 0.5 : (double) weight;
    }

    private double calculateProgressPercent(int totalWords, long mastered, long learning) {
        if (totalWords <= 0) return 0.0;
        double totalScore = (mastered * 1.0) + (learning * 0.5);
        double percent = (totalScore / totalWords) * 100.0;
        return Math.round(percent * 10.0) / 10.0;
    }
}
