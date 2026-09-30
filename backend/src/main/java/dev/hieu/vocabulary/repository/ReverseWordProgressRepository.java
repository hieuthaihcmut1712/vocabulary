package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.ReverseWordProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReverseWordProgressRepository extends JpaRepository<ReverseWordProgress, Long> {

    List<ReverseWordProgress> findByDeckId(Long deckId);

    Optional<ReverseWordProgress> findByWordId(Long wordId);

    void deleteByDeckId(Long deckId);
}
