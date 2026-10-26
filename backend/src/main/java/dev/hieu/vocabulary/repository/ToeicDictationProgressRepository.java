package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.ToeicDictationProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ToeicDictationProgressRepository extends JpaRepository<ToeicDictationProgress, Long> {

    List<ToeicDictationProgress> findByLessonIdOrderByUpdatedAtAsc(Integer lessonId);

    Optional<ToeicDictationProgress> findByLessonIdAndSentenceId(Integer lessonId, String sentenceId);

    void deleteByLessonId(Integer lessonId);
}
