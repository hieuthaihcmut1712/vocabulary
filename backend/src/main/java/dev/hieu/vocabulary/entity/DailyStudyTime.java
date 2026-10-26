package dev.hieu.vocabulary.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_study_time", indexes = {
    @Index(name = "idx_daily_study_date", columnList = "study_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyStudyTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "study_date", nullable = false, unique = true)
    private LocalDate studyDate;

    @Column(name = "total_duration_seconds", nullable = false)
    @Builder.Default
    private Long totalDurationSeconds = 0L;

    @Column(name = "session_count", nullable = false)
    @Builder.Default
    private Integer sessionCount = 0;

    // Thời gian học phân bổ theo từng kỹ năng
    @Column(name = "quiz_seconds")
    @Builder.Default
    private Long quizSeconds = 0L; // Quizziz & Phản xạ Anh -> Việt

    @Column(name = "reverse_seconds")
    @Builder.Default
    private Long reverseSeconds = 0L; // Quizziz & Phản xạ Việt -> Anh

    @Column(name = "listening_seconds")
    @Builder.Default
    private Long listeningSeconds = 0L; // Luyện nghe & chính tả

    @Column(name = "exercise_seconds")
    @Builder.Default
    private Long exerciseSeconds = 0L; // Bài tập ứng dụng ngữ cảnh TOEIC

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
