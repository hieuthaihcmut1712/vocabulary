package dev.hieu.vocabulary.repository;

import dev.hieu.vocabulary.entity.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
    List<Word> findByDeckId(Long deckId);
}
