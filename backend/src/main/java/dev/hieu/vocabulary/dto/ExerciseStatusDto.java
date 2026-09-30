package dev.hieu.vocabulary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseStatusDto {
    private Long deckId;
    private String deckName;
    private boolean isUnlocked; // True if quiz, reverse, listening all reached 100% or practice unlocked
    private double quizProgress;
    private double reverseProgress;
    private double listeningProgress;
    private int totalCompletedExercises;
}
