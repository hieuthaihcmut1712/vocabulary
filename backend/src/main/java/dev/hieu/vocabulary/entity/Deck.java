package dev.hieu.vocabulary.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "decks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Trạng thái mở khóa vĩnh viễn chế độ Luyện tập (đã từng đạt 100%)
    @Builder.Default
    @Column(name = "quiz_practice_unlocked", nullable = false)
    private Boolean quizPracticeUnlocked = false;

    @Builder.Default
    @Column(name = "reverse_practice_unlocked", nullable = false)
    private Boolean reversePracticeUnlocked = false;

    @Builder.Default
    @Column(name = "listening_practice_unlocked", nullable = false)
    private Boolean listeningPracticeUnlocked = false;

    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Word> words = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
