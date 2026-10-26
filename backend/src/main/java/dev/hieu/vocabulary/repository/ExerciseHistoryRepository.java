package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.ExerciseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseHistoryRepository extends JpaRepository<ExerciseHistory, Long> {
    List<ExerciseHistory> findByDeckIdOrderByCreatedAtDesc(Long deckId);
    List<ExerciseHistory> findByDeckIdAndLevelOrderByCreatedAtDesc(Long deckId, String level);
    List<ExerciseHistory> findByDeckIsNullOrderByCreatedAtDesc();

    List<ExerciseHistory> findByDeckIdAndUserProfileOrderByCreatedAtDesc(Long deckId, String userProfile);
    List<ExerciseHistory> findByDeckIdAndLevelAndUserProfileOrderByCreatedAtDesc(Long deckId, String level, String userProfile);
    List<ExerciseHistory> findByDeckIsNullAndUserProfileOrderByCreatedAtDesc(String userProfile);
    java.util.Optional<ExerciseHistory> findByIdAndUserProfile(Long id, String userProfile);
}
