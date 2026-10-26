package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.DailyStudyTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyStudyTimeRepository extends JpaRepository<DailyStudyTime, Long> {

    Optional<DailyStudyTime> findByStudyDate(LocalDate studyDate);

    List<DailyStudyTime> findByStudyDateBetweenOrderByStudyDateAsc(LocalDate startDate, LocalDate endDate);

    List<DailyStudyTime> findAllByOrderByStudyDateDesc();
}
