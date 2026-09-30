package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.ListeningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListeningProgressRepository extends JpaRepository<ListeningProgress, Long> {

    List<ListeningProgress> findByDeckId(Long deckId);

    Optional<ListeningProgress> findByWordId(Long wordId);

    void deleteByDeckId(Long deckId);
}
