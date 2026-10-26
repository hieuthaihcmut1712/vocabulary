package dev.hieu.vocabulary.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_sessions", indexes = {
    @Index(name = "idx_study_session_date", columnList = "study_date"),
    @Index(name = "idx_study_session_deck", columnList = "deck_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deck_id")
    private Long deckId;

    @Column(name = "skill_mode", nullable = false, length = 50)
    private String skillMode; // QUIZ, PRACTICE, REVERSE_QUIZ, REVERSE_PRACTICE, LISTENING_DRILL, LISTENING_PRACTICE, APPLIED_EXERCISE

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(name = "study_date", nullable = false)
    private LocalDate studyDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
