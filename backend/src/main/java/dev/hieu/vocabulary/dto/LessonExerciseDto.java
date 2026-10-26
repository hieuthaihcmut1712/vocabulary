package dev.hieu.vocabulary.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LessonExerciseDto {
    private Integer lessonId;
    private String title;
    private String subtitle;
    private List<String> wordBank; // Danh sách từ tiếng Anh để điền (CHỈ TIẾNG ANH, không có tiếng Việt)
    
    @JsonProperty("passage")
    @JsonAlias({"passage", "passageTemplate"})
    private String passage;

    @JsonProperty("passageTemplate")
    public String getPassageTemplate() {
        return passage;
    }

    public void setPassageTemplate(String passageTemplate) {
        if (this.passage == null) {
            this.passage = passageTemplate;
        }
    }

    private List<BlankInfo> blanks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BlankInfo {
        private Integer index;
        private String answer; // Đáp án đúng
    }
}
