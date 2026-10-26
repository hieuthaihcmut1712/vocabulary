package dev.hieu.vocabulary.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reverse_word_progress", uniqueConstraints = {
    @UniqueConstraint(name = "uk_reverse_word_profile", columnNames = {"word_id", "user_profile"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReverseWordProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    @JsonIgnore
    private Word word;

    @Column(name = "user_profile", length = 50)
    @Builder.Default
    private String userProfile = "hieu";

    @Column(name = "deck_id", nullable = false)
    private Long deckId;

    // Trọng số xuất hiện: ban đầu là 10, tối thiểu 1, tối đa 30
    @Builder.Default
    @Column(nullable = false)
    private Integer weight = 10;

    @Builder.Default
    @Column(name = "correct_count", nullable = false)
    private Integer correctCount = 0;

    @Builder.Default
    @Column(name = "wrong_count", nullable = false)
    private Integer wrongCount = 0;

    @Column(name = "last_response_time_seconds")
    private Double lastResponseTimeSeconds;

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
