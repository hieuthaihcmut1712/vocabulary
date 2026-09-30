package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.WordProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WordProgressRepository extends JpaRepository<WordProgress, Long> {
    Optional<WordProgress> findByWordId(Long wordId);
    List<WordProgress> findByDeckId(Long deckId);
    List<WordProgress> findByWeight(Integer weight);
}
