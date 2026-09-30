package dev.hieu.vocabulary.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exercise_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = true)
    private Deck deck;

    @Column(nullable = false, length = 50)
    private String level; // TOEIC_550, TOEIC_700_READING, TOEIC_700_LISTENING, TOEIC_850

    @Column(length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String translation;

    @Column(name = "target_answers", nullable = false, columnDefinition = "TEXT")
    private String targetAnswers; // JSON array of string answers

    @Column(name = "user_answers", columnDefinition = "TEXT")
    private String userAnswers; // JSON array of string answers user typed

    @Column(name = "score_percent")
    private Double scorePercent;

    @Column(name = "is_passed")
    private Boolean isPassed;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "audio_script", columnDefinition = "TEXT")
    private String audioScript;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
