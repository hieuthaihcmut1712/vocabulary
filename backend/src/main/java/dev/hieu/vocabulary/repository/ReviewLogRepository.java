package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.ReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewLogRepository extends JpaRepository<ReviewLog, Long> {
    List<ReviewLog> findByWordProgressIdOrderByCreatedAtDesc(Long wordProgressId);
}
