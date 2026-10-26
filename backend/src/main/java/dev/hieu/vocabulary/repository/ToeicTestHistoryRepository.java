package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.ToeicTestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToeicTestHistoryRepository extends JpaRepository<ToeicTestHistory, Long> {
    List<ToeicTestHistory> findByLessonIdOrderByCreatedAtDesc(Integer lessonId);
    List<ToeicTestHistory> findAllByOrderByCreatedAtDesc();

    List<ToeicTestHistory> findByLessonIdAndUserProfileOrderByCreatedAtDesc(Integer lessonId, String userProfile);
    List<ToeicTestHistory> findAllByUserProfileOrderByCreatedAtDesc(String userProfile);
    java.util.Optional<ToeicTestHistory> findByIdAndUserProfile(Long id, String userProfile);
}
