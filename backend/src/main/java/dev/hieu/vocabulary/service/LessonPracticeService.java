package dev.hieu.vocabulary.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.hieu.vocabulary.dto.*;
import dev.hieu.vocabulary.entity.ToeicDictationProgress;
import dev.hieu.vocabulary.entity.ToeicTestHistory;
import dev.hieu.vocabulary.repository.ToeicDictationProgressRepository;
import dev.hieu.vocabulary.repository.ToeicTestHistoryRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonPracticeService {

    private final ObjectMapper objectMapper;
    private final ToeicTestHistoryRepository toeicTestHistoryRepository;
    private final ToeicDictationProgressRepository toeicDictationProgressRepository;
    private final Map<Integer, LessonExerciseDto> exerciseMap = new HashMap<>();
    private final Map<Integer, LessonTestDto> testMap = new HashMap<>();

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("lessons_practice_data.json");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    JsonNode rootNode = objectMapper.readTree(is);
                    Iterator<String> fieldNames = rootNode.fieldNames();
                    while (fieldNames.hasNext()) {
                        String key = fieldNames.next();
                        int lessonId = Integer.parseInt(key);
                        JsonNode lessonNode = rootNode.get(key);

                        if (lessonNode.has("exercise")) {
                            LessonExerciseDto exercise = objectMapper.treeToValue(lessonNode.get("exercise"), LessonExerciseDto.class);
                            exerciseMap.put(lessonId, exercise);
                        }

                        if (lessonNode.has("test")) {
                            LessonTestDto test = objectMapper.treeToValue(lessonNode.get("test"), LessonTestDto.class);
                            testMap.put(lessonId, test);
                        }
                    }
                    log.info("Loaded {} lesson exercises and {} tests from lessons_practice_data.json",
                            exerciseMap.size(), testMap.size());
                }
            } else {
                log.warn("lessons_practice_data.json does not exist in classpath");
            }
        } catch (Exception e) {
            log.error("Failed to load lessons_practice_data.json", e);
        }
    }

    /**
     * Lấy bài tập điền từ (Words in Context) theo Lesson
     */
    public LessonExerciseDto getExercise(Integer lessonId) {
        LessonExerciseDto dto = exerciseMap.get(lessonId);
        if (dto == null) {
            throw new IllegalArgumentException("Không tìm thấy bài tập cho Lesson " + lessonId);
        }
        return dto;
    }

    /**
     * Chấm điểm bài tập điền từ (Words in Context)
     */
    public ExerciseSubmitDto.Response submitExercise(Integer lessonId, ExerciseSubmitDto.Request request) {
        LessonExerciseDto exercise = getExercise(lessonId);
        Map<Integer, String> userAnswers = request != null && request.getUserAnswers() != null 
                ? request.getUserAnswers() : Collections.emptyMap();

        int score = 0;
        List<ExerciseSubmitDto.BlankResult> results = new ArrayList<>();

        if (exercise.getBlanks() != null) {
            for (LessonExerciseDto.BlankInfo blank : exercise.getBlanks()) {
                int idx = blank.getIndex();
                String correct = blank.getAnswer() != null ? blank.getAnswer().trim().toLowerCase() : "";
                String user = userAnswers.get(idx);
                String userClean = user != null ? user.trim().toLowerCase() : "";

                boolean isCorrect = !correct.isEmpty() && normalize(userClean).equals(normalize(correct));
                if (lessonId != null && lessonId == 7 && (idx == 2 || idx == 3)) {
                    String normUser = normalize(userClean);
                    if ("durable".equals(normUser) || "affordable".equals(normUser)) {
                        isCorrect = true;
                    }
                }
                if (isCorrect) score++;

                results.add(ExerciseSubmitDto.BlankResult.builder()
                        .index(idx)
                        .userAnswer(user != null ? user.trim() : "")
                        .correctAnswer(blank.getAnswer())
                        .isCorrect(isCorrect)
                        .build());
            }
        }

        int maxScore = exercise.getBlanks() != null ? exercise.getBlanks().size() : 12;
        double percentage = maxScore > 0 ? Math.round((score * 100.0 / maxScore) * 10.0) / 10.0 : 0.0;

        return ExerciseSubmitDto.Response.builder()
                .score(score)
                .maxScore(maxScore)
                .percentage(percentage)
                .results(results)
                .build();
    }

    /**
     * Lấy bài Practice Test theo Lesson (Listening + Reading)
     */
    public LessonTestDto getTest(Integer lessonId) {
        LessonTestDto dto = testMap.get(lessonId);
        if (dto == null) {
            throw new IllegalArgumentException("Không tìm thấy bài test cho Lesson " + lessonId);
        }
        return dto;
    }

    /**
     * Chấm điểm bài Practice Test
     */
    public TestSubmitDto.Response submitTest(Integer lessonId, TestSubmitDto.Request request) {
        LessonTestDto test = getTest(lessonId);
        Map<Integer, String> userAnswers = request != null && request.getAnswers() != null
                ? request.getAnswers() : Collections.emptyMap();

        int totalQuestions = 0;
        int score = 0;
        int listeningScore = 0;
        int listeningTotal = 0;
        int readingScore = 0;
        int readingTotal = 0;

        List<TestSubmitDto.QuestionResult> results = new ArrayList<>();

        // Part 1: Question 1
        if (test.getPart1() != null) {
            totalQuestions++;
            listeningTotal++;
            String correct = test.getPart1().getCorrectAnswer();
            String user = userAnswers.get(1);
            boolean isOk = correct != null && correct.equalsIgnoreCase(user);
            if (isOk) { score++; listeningScore++; }
            
            StringBuilder p1Trans = new StringBuilder();
            if (test.getPart1().getTranscript() != null) {
                test.getPart1().getTranscript().forEach((k, v) -> {
                    p1Trans.append("(").append(k).append(") ").append(v).append("\n");
                });
            }
            String transText = p1Trans.toString().trim();
            String correctTrans = test.getPart1().getTranscript() != null ? test.getPart1().getTranscript().get(correct) : "";

            results.add(TestSubmitDto.QuestionResult.builder()
                    .questionNumber(1)
                    .part("Part 1: Photographs")
                    .imageUrl(test.getPart1().getImageUrl())
                    .questionText(test.getPart1().getInstruction() != null ? test.getPart1().getInstruction() : "Look at the picture and choose the best statement.")
                    .options(test.getPart1().getOptions())
                    .userAnswer(user)
                    .correctAnswer(correct)
                    .isCorrect(isOk)
                    .explanation("Đáp án đúng là " + correct + ": \"" + correctTrans + "\"")
                    .transcript(transText.isEmpty() ? correctTrans : transText)
                    .build());
        }

        // Part 2: Questions 2 & 3
        if (test.getPart2() != null) {
            for (LessonTestDto.Part2Question q : test.getPart2()) {
                totalQuestions++;
                listeningTotal++;
                int qNum = q.getQuestionNumber();
                String correct = q.getCorrectAnswer();
                String user = userAnswers.get(qNum);
                boolean isOk = correct != null && correct.equalsIgnoreCase(user);
                if (isOk) { score++; listeningScore++; }

                StringBuilder p2Trans = new StringBuilder("Câu hỏi: \"").append(q.getSpokenQuestion()).append("\"\n");
                if (q.getTranscript() != null) {
                    q.getTranscript().forEach((k, v) -> {
                        p2Trans.append("(").append(k).append(") ").append(v).append("\n");
                    });
                }
                String transText = p2Trans.toString().trim();
                String correctTrans = q.getTranscript() != null ? q.getTranscript().get(correct) : "";

                results.add(TestSubmitDto.QuestionResult.builder()
                        .questionNumber(qNum)
                        .part("Part 2: Question-Response")
                        .questionText(q.getSpokenQuestion())
                        .options(q.getOptions())
                        .userAnswer(user)
                        .correctAnswer(correct)
                        .isCorrect(isOk)
                        .explanation("Câu hỏi: \"" + q.getSpokenQuestion() + "\". Đáp án " + correct + ": \"" + correctTrans + "\"")
                        .transcript(transText)
                        .build());
            }
        }

        // Part 3: Questions 4, 5, 6
        if (test.getPart3() != null) {
            for (LessonTestDto.MultipleChoiceQuestion q : test.getPart3()) {
                totalQuestions++;
                listeningTotal++;
                int qNum = q.getQuestionNumber();
                String correct = q.getCorrectAnswer();
                String user = userAnswers.get(qNum);
                boolean isOk = correct != null && correct.equalsIgnoreCase(user);
                if (isOk) { score++; listeningScore++; }
                String exp = q.getExplanation() != null ? q.getExplanation() : ("Đáp án đúng: " + correct);
                results.add(TestSubmitDto.QuestionResult.builder()
                        .questionNumber(qNum)
                        .part("Part 3: Short Conversations")
                        .questionText(q.getQuestion())
                        .options(q.getOptions())
                        .userAnswer(user)
                        .correctAnswer(correct)
                        .isCorrect(isOk)
                        .explanation(exp)
                        .translation(q.getTranslation())
                        .transcript(q.getTranscript())
                        .build());
            }
        }

        // Part 4: Questions 7, 8, 9
        if (test.getPart4() != null) {
            for (LessonTestDto.MultipleChoiceQuestion q : test.getPart4()) {
                totalQuestions++;
                listeningTotal++;
                int qNum = q.getQuestionNumber();
                String correct = q.getCorrectAnswer();
                String user = userAnswers.get(qNum);
                boolean isOk = correct != null && correct.equalsIgnoreCase(user);
                if (isOk) { score++; listeningScore++; }
                String exp = q.getExplanation() != null ? q.getExplanation() : ("Đáp án đúng: " + correct);
                results.add(TestSubmitDto.QuestionResult.builder()
                        .questionNumber(qNum)
                        .part("Part 4: Short Talks")
                        .questionText(q.getQuestion())
                        .options(q.getOptions())
                        .userAnswer(user)
                        .correctAnswer(correct)
                        .isCorrect(isOk)
                        .explanation(exp)
                        .translation(q.getTranslation())
                        .transcript(q.getTranscript())
                        .build());
            }
        }

        // Part 5: Questions 10 - 15
        if (test.getPart5() != null) {
            for (LessonTestDto.MultipleChoiceQuestion q : test.getPart5()) {
                totalQuestions++;
                readingTotal++;
                int qNum = q.getQuestionNumber();
                String correct = q.getCorrectAnswer();
                String user = userAnswers.get(qNum);
                boolean isOk = correct != null && correct.equalsIgnoreCase(user);
                if (isOk) { score++; readingScore++; }
                String exp = q.getExplanation() != null ? q.getExplanation() : ("Đáp án đúng: " + correct);
                results.add(TestSubmitDto.QuestionResult.builder()
                        .questionNumber(qNum)
                        .part("Part 5: Incomplete Sentences")
                        .questionText(q.getQuestion())
                        .options(q.getOptions())
                        .userAnswer(user)
                        .correctAnswer(correct)
                        .isCorrect(isOk)
                        .explanation(exp)
                        .translation(q.getTranslation())
                        .build());
            }
        }

        // Part 6
        if (test.getPart6() != null && test.getPart6().getQuestions() != null) {
            String p6Passage = test.getPart6().getPassage();
            for (LessonTestDto.MultipleChoiceQuestion q : test.getPart6().getQuestions()) {
                totalQuestions++;
                readingTotal++;
                int qNum = q.getQuestionNumber();
                String correct = q.getCorrectAnswer();
                String user = userAnswers.get(qNum);
                boolean isOk = correct != null && correct.equalsIgnoreCase(user);
                if (isOk) { score++; readingScore++; }
                String exp = q.getExplanation() != null ? q.getExplanation() : ("Đáp án đúng: " + correct);
                results.add(TestSubmitDto.QuestionResult.builder()
                        .questionNumber(qNum)
                        .part("Part 6: Text Completion")
                        .passage(p6Passage)
                        .questionText(q.getQuestion() != null ? q.getQuestion() : ("Điền từ vào vị trí [" + qNum + "]"))
                        .options(q.getOptions())
                        .userAnswer(user)
                        .correctAnswer(correct)
                        .isCorrect(isOk)
                        .explanation(exp)
                        .translation(q.getTranslation())
                        .build());
            }
        }

        // Part 7
        if (test.getPart7() != null && test.getPart7().getQuestions() != null) {
            String p7Passage = test.getPart7().getPassage();
            for (LessonTestDto.MultipleChoiceQuestion q : test.getPart7().getQuestions()) {
                totalQuestions++;
                readingTotal++;
                int qNum = q.getQuestionNumber();
                String correct = q.getCorrectAnswer();
                String user = userAnswers.get(qNum);
                boolean isOk = correct != null && correct.equalsIgnoreCase(user);
                if (isOk) { score++; readingScore++; }
                String exp = q.getExplanation() != null ? q.getExplanation() : ("Đáp án đúng: " + correct);
                results.add(TestSubmitDto.QuestionResult.builder()
                        .questionNumber(qNum)
                        .part("Part 7: Reading Comprehension")
                        .passage(p7Passage)
                        .questionText(q.getQuestion())
                        .options(q.getOptions())
                        .userAnswer(user)
                        .correctAnswer(correct)
                        .isCorrect(isOk)
                        .explanation(exp)
                        .translation(q.getTranslation())
                        .build());
            }
        }

        double percentage = totalQuestions > 0 ? Math.round((score * 100.0 / totalQuestions) * 10.0) / 10.0 : 0.0;

        // Lưu lịch sử bài làm vào cơ sở dữ liệu
        Long historyId = null;
        java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
        try {
            String resultsJson = objectMapper.writeValueAsString(results);
            String userAnswersJson = objectMapper.writeValueAsString(userAnswers);
            ToeicTestHistory history = ToeicTestHistory.builder()
                    .lessonId(lessonId)
                    .lessonTitle(test.getTitle() != null ? test.getTitle() : "Lesson " + lessonId)
                    .score(score)
                    .totalQuestions(totalQuestions)
                    .percentage(percentage)
                    .listeningScore(listeningScore)
                    .listeningTotal(listeningTotal)
                    .readingScore(readingScore)
                    .readingTotal(readingTotal)
                    .resultsJson(resultsJson)
                    .userAnswersJson(userAnswersJson)
                    .userProfile(dev.hieu.vocabulary.config.ProfileContextHolder.getProfile())
                    .createdAt(createdAt)
                    .build();
            ToeicTestHistory saved = toeicTestHistoryRepository.save(history);
            historyId = saved.getId();
            createdAt = saved.getCreatedAt();
        } catch (Exception e) {
            log.error("Failed to save TOEIC test history for lesson {}", lessonId, e);
        }

        return TestSubmitDto.Response.builder()
                .historyId(historyId)
                .createdAt(createdAt)
                .score(score)
                .totalQuestions(totalQuestions)
                .percentage(percentage)
                .listeningScore(listeningScore)
                .listeningTotal(listeningTotal)
                .readingScore(readingScore)
                .readingTotal(readingTotal)
                .results(results)
                .build();
    }

    /**
     * Lấy danh sách lịch sử làm bài kiểm tra TOEIC (có thể lọc theo lessonId)
     */
    public List<ToeicTestHistoryDto> getTestHistory(Integer lessonId) {
        String profile = dev.hieu.vocabulary.config.ProfileContextHolder.getProfile();
        List<ToeicTestHistory> list = (lessonId != null && lessonId > 0)
                ? toeicTestHistoryRepository.findByLessonIdAndUserProfileOrderByCreatedAtDesc(lessonId, profile)
                : toeicTestHistoryRepository.findAllByUserProfileOrderByCreatedAtDesc(profile);

        return list.stream().map(h -> ToeicTestHistoryDto.builder()
                .id(h.getId())
                .lessonId(h.getLessonId())
                .lessonTitle(h.getLessonTitle())
                .score(h.getScore())
                .totalQuestions(h.getTotalQuestions())
                .percentage(h.getPercentage())
                .listeningScore(h.getListeningScore())
                .listeningTotal(h.getListeningTotal())
                .readingScore(h.getReadingScore())
                .readingTotal(h.getReadingTotal())
                .createdAt(h.getCreatedAt())
                .build()
        ).toList();
    }

    /**
     * Lấy chi tiết một bài kiểm tra TOEIC trong lịch sử (kèm toàn bộ danh sách câu hỏi và đáp án)
     */
    public ToeicTestHistoryDto getTestHistoryDetail(Long historyId) {
        String profile = dev.hieu.vocabulary.config.ProfileContextHolder.getProfile();
        ToeicTestHistory h = toeicTestHistoryRepository.findByIdAndUserProfile(historyId, profile)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch sử bài test với ID " + historyId));

        Map<Integer, String> userAnswers = Collections.emptyMap();
        List<TestSubmitDto.QuestionResult> results = Collections.emptyList();

        try {
            if (h.getUserAnswersJson() != null && !h.getUserAnswersJson().isBlank()) {
                userAnswers = objectMapper.readValue(h.getUserAnswersJson(), new TypeReference<Map<Integer, String>>() {});
            }
            if (h.getResultsJson() != null && !h.getResultsJson().isBlank()) {
                results = objectMapper.readValue(h.getResultsJson(), new TypeReference<List<TestSubmitDto.QuestionResult>>() {});
            }
        } catch (Exception e) {
            log.error("Failed to parse resultsJson or userAnswersJson for historyId {}", historyId, e);
        }

        return ToeicTestHistoryDto.builder()
                .id(h.getId())
                .lessonId(h.getLessonId())
                .lessonTitle(h.getLessonTitle())
                .score(h.getScore())
                .totalQuestions(h.getTotalQuestions())
                .percentage(h.getPercentage())
                .listeningScore(h.getListeningScore())
                .listeningTotal(h.getListeningTotal())
                .readingScore(h.getReadingScore())
                .readingTotal(h.getReadingTotal())
                .createdAt(h.getCreatedAt())
                .userAnswers(userAnswers)
                .results(results)
                .build();
    }

    /**
     * Xóa một bài kiểm tra trong lịch sử
     */
    public void deleteTestHistory(Long historyId) {
        String profile = dev.hieu.vocabulary.config.ProfileContextHolder.getProfile();
        toeicTestHistoryRepository.findByIdAndUserProfile(historyId, profile)
                .ifPresent(toeicTestHistoryRepository::delete);
    }

    /**
     * Lấy danh sách tiến độ nghe chép chính tả cho một Lesson
     */
    public List<ToeicDictationProgressDto> getDictationProgress(Integer lessonId) {
        List<ToeicDictationProgress> list = toeicDictationProgressRepository.findByLessonIdOrderByUpdatedAtAsc(lessonId);
        List<ToeicDictationProgressDto> dtoList = new ArrayList<>();
        for (ToeicDictationProgress p : list) {
            Object wrongAttempts = null;
            Object hintedWords = null;
            try {
                if (p.getWrongAttemptsJson() != null && !p.getWrongAttemptsJson().isBlank()) {
                    wrongAttempts = objectMapper.readValue(p.getWrongAttemptsJson(), Object.class);
                }
                if (p.getHintedWordsJson() != null && !p.getHintedWordsJson().isBlank()) {
                    hintedWords = objectMapper.readValue(p.getHintedWordsJson(), Object.class);
                }
            } catch (Exception ignored) {}

            dtoList.add(ToeicDictationProgressDto.builder()
                    .id(p.getId())
                    .lessonId(p.getLessonId())
                    .sentenceId(p.getSentenceId())
                    .part(p.getPart())
                    .score(p.getScore())
                    .isCompleted(p.getIsCompleted())
                    .userInput(p.getUserInput())
                    .hintsCount(p.getHintsCount())
                    .listenCount(p.getListenCount())
                    .wrongAttempts(wrongAttempts)
                    .hintedWords(hintedWords)
                    .updatedAt(p.getUpdatedAt())
                    .build());
        }
        return dtoList;
    }

    /**
     * Lưu hoặc cập nhật kết quả nghe chép chính tả của một câu
     */
    public ToeicDictationProgressDto saveDictationSentence(Integer lessonId, ToeicDictationProgressDto dto) {
        ToeicDictationProgress progress = toeicDictationProgressRepository
                .findByLessonIdAndSentenceId(lessonId, dto.getSentenceId())
                .orElse(ToeicDictationProgress.builder()
                        .lessonId(lessonId)
                        .sentenceId(dto.getSentenceId())
                        .build());

        progress.setPart(dto.getPart());
        progress.setScore(dto.getScore() != null ? dto.getScore() : 0);
        progress.setIsCompleted(dto.getIsCompleted() != null ? dto.getIsCompleted() : false);
        progress.setUserInput(dto.getUserInput());
        progress.setHintsCount(dto.getHintsCount() != null ? dto.getHintsCount() : 0);
        progress.setListenCount(dto.getListenCount() != null ? dto.getListenCount() : 0);

        try {
            if (dto.getWrongAttempts() != null) {
                progress.setWrongAttemptsJson(objectMapper.writeValueAsString(dto.getWrongAttempts()));
            } else {
                progress.setWrongAttemptsJson(null);
            }
            if (dto.getHintedWords() != null) {
                progress.setHintedWordsJson(objectMapper.writeValueAsString(dto.getHintedWords()));
            } else {
                progress.setHintedWordsJson(null);
            }
        } catch (Exception e) {
            log.error("Failed to serialize wrongAttempts or hintedWords for sentence {}", dto.getSentenceId(), e);
        }

        ToeicDictationProgress saved = toeicDictationProgressRepository.save(progress);
        dto.setId(saved.getId());
        dto.setLessonId(saved.getLessonId());
        dto.setUpdatedAt(saved.getUpdatedAt());
        return dto;
    }

    /**
     * Xóa/đặt lại tiến độ nghe chép chính tả của một Lesson
     */
    @org.springframework.transaction.annotation.Transactional
    public void resetDictationProgress(Integer lessonId) {
        toeicDictationProgressRepository.deleteByLessonId(lessonId);
    }

    private String normalize(String s) {
        if (s == null) return "";
        return s.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
    }
}
