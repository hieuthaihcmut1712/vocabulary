package dev.hieu.vocabulary.dto;

import java.util.List;

public record WordPronunciationResponse(
        String word,
        PronunciationDetail nounAdj,
        PronunciationDetail verb,
        List<PronunciationDetail> unclassified
) {
}
