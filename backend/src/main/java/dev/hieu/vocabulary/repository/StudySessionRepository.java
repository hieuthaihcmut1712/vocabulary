package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    List<StudySession> findByStudyDate(LocalDate studyDate);

    List<StudySession> findByStudyDateBetweenOrderByCreatedAtDesc(LocalDate startDate, LocalDate endDate);
}
