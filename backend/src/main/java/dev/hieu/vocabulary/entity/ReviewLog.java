package dev.hieu.vocabulary.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_progress_id", nullable = false)
    @JsonIgnore
    private WordProgress wordProgress;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(name = "response_time_seconds", nullable = false)
    private Double responseTimeSeconds;

    @Column(name = "old_weight", nullable = false)
    private Integer oldWeight;

    @Column(name = "new_weight", nullable = false)
    private Integer newWeight;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
