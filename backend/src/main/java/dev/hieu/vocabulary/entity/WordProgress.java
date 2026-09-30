package dev.hieu.vocabulary.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "word_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WordProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false, unique = true)
    @JsonIgnore
    private Word word;

    @Column(name = "deck_id", nullable = false)
    private Long deckId;

    // Trọng số xuất hiện: ban đầu là 10, tối thiểu là 1, tối đa là 30
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

    @OneToMany(mappedBy = "wordProgress", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<ReviewLog> reviewLogs = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
