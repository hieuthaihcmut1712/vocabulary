package dev.hieu.vocabulary.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "toeic_dictation_progress", uniqueConstraints = {
    @UniqueConstraint(name = "uk_lesson_sentence", columnNames = {"lesson_id", "sentence_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToeicDictationProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lesson_id", nullable = false)
    private Integer lessonId;

    @Column(name = "sentence_id", nullable = false, length = 64)
    private String sentenceId;

    @Column(name = "part")
    private Integer part;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted;

    @Column(name = "user_input", columnDefinition = "TEXT")
    private String userInput;

    @Column(name = "hints_count")
    private Integer hintsCount;

    @Column(name = "listen_count")
    private Integer listenCount;

    @Column(name = "wrong_attempts_json", columnDefinition = "TEXT")
    private String wrongAttemptsJson;

    @Column(name = "hinted_words_json", columnDefinition = "TEXT")
    private String hintedWordsJson;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
