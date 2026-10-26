package dev.hieu.vocabulary.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "toeic_test_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToeicTestHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lesson_id", nullable = false)
    private Integer lessonId;

    @Column(name = "lesson_title", length = 255)
    private String lessonTitle;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "percentage", nullable = false)
    private Double percentage;

    @Column(name = "listening_score")
    private Integer listeningScore;

    @Column(name = "listening_total")
    private Integer listeningTotal;

    @Column(name = "reading_score")
    private Integer readingScore;

    @Column(name = "reading_total")
    private Integer readingTotal;

    @Column(name = "results_json", columnDefinition = "TEXT")
    private String resultsJson;

    @Column(name = "user_answers_json", columnDefinition = "TEXT")
    private String userAnswersJson;

    @Column(name = "user_profile", length = 50)
    @Builder.Default
    private String userProfile = "hieu";

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
