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
}
