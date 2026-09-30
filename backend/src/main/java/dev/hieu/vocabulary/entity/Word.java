package dev.hieu.vocabulary.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "words")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    @JsonIgnore
    private Deck deck;

    @Column(nullable = false, length = 100)
    private String term; // Từ tiếng Anh

    @Column(length = 100)
    private String phonetic; // Phiên âm IPA (ví dụ: /rɪˈzɪl.jənt/)

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech; // noun, verb, adj...

    @Column(columnDefinition = "TEXT", nullable = false)
    private String meaning; // Nghĩa tiếng Việt

    @Column(columnDefinition = "TEXT")
    private String example; // Ví dụ minh họa

    @OneToOne(mappedBy = "word", cascade = CascadeType.ALL, orphanRemoval = true)
    private WordProgress progress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
