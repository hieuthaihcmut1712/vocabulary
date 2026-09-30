package dev.hieu.vocabulary.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.hieu.vocabulary.dto.ExerciseItemDto;
import dev.hieu.vocabulary.entity.Word;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
@Slf4j
public class GeminiExerciseService {

    @Value("${gemini.api-key:YOUR_GEMINI_API_KEY_HERE}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiExerciseService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Sinh bài tập ứng dụng theo cấp độ TOEIC từ Gemini AI
     * Fallback sang offline template nếu API key chưa thiết lập hoặc gặp lỗi mạng.
     */
    public ExerciseItemDto generateExercise(Long deckId, String deckName, String level, List<Word> words) {
        if (words == null || words.isEmpty()) {
            throw new IllegalArgumentException("Danh sách từ vựng rỗng!");
        }

        // Chọn ngẫu nhiên 6 từ trong deck làm ứng viên cho AI
        List<Word> shuffled = new ArrayList<>(words);
        Collections.shuffle(shuffled);
        List<Word> candidateWords = shuffled.subList(0, Math.min(8, shuffled.size()));

        // Kiểm tra xem API Key đã được cấu hình hay chưa
        boolean hasValidKey = apiKey != null && !apiKey.isBlank() && !apiKey.contains("YOUR_GEMINI_API_KEY");

        if (hasValidKey) {
            try {
                ExerciseItemDto aiResult = callGeminiApi(deckId, deckName, level, candidateWords);
                if (aiResult != null) {
                    return aiResult;
                }
            } catch (Exception e) {
                log.error("Lỗi gọi Gemini API (chuyển sang fallback template): {}", e.getMessage());
            }
        } else {
            log.info("Gemini API key chưa được cấu hình. Sử dụng sinh bài tập mẫu thông minh.");
        }

        // Fallback: Sinh bài tập chất lượng cao bằng template chuẩn TOEIC
        return generateFallbackExercise(deckId, deckName, level, candidateWords);
    }

    private ExerciseItemDto callGeminiApi(Long deckId, String deckName, String level, List<Word> candidateWords) throws Exception {
        StringBuilder wordListBuilder = new StringBuilder();
        for (Word w : candidateWords) {
            wordListBuilder.append("- ").append(w.getTerm()).append(" (Nghĩa: ").append(w.getMeaning()).append(")\n");
        }

        String levelRules = getLevelRules(level);

        String prompt = """
                Bạn là chuyên gia khảo thí biên soạn đề thi tiếng Anh TOEIC.
                Nhiệm vụ: Hãy tạo một bài tập ứng dụng điền từ vào chỗ trống cho người học theo đúng chuẩn cấp độ yêu cầu.
                
                Danh sách từ vựng/cụm từ mục tiêu của bộ thẻ:
                %s
                
                CẤP ĐỘ VÀ QUY TẮC BẮT BUỘC:
                %s
                
                ĐỊNH DẠNG JSON TRẢ VỀ (CHỈ TRẢ VỀ JSON KHÔNG KÈM BẤT KỲ VĂN BẢN NÀO KHÁC):
                {
                  "title": "Tiêu đề ngắn về ngữ cảnh (ví dụ: Thông báo an toàn nơi làm việc / Email gia hạn hợp đồng)",
                  "content": "Nội dung câu hoặc đoạn văn tiếng Anh, các từ cần điền BẮT BUỘC thay bằng [BLANK_1], [BLANK_2]...",
                  "audioScript": "Toàn bộ đoạn văn bản tiếng Anh hoàn chỉnh (đã điền đủ từ, không có [BLANK]) để hệ thống phát âm",
                  "translation": "Bản dịch toàn bộ câu hoặc đoạn văn sang tiếng Việt chuẩn xác và tự nhiên",
                  "targetAnswers": ["cụm từ 1", "cụm từ 2"],
                  "blankHints": ["Gợi ý nghĩa tiếng Việt cho ô 1", "Gợi ý nghĩa tiếng Việt cho ô 2"],
                  "explanation": "Lời giải thích chi tiết bằng tiếng Việt: phân tích cấu trúc ngữ pháp tại sao điền từ này (từ loại gì, vị trí nào trong câu), các dấu hiệu nhận biết (context clues) và lưu ý cách dùng."
                }
                """.formatted(wordListBuilder.toString(), levelRules);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> contentMap = Map.of("parts", List.of(part));
        Map<String, Object> generationConfig = Map.of(
                "temperature", 0.7,
                "responseMimeType", "application/json"
        );
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(contentMap),
                "generationConfig", generationConfig
        );

        String requestJson = objectMapper.writeValueAsString(requestBody);
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode textNode = rootNode.at("/candidates/0/content/parts/0/text");
            if (!textNode.isMissingNode()) {
                String responseText = textNode.asText().trim();
                if (responseText.startsWith("```json")) {
                    responseText = responseText.substring(7);
                } else if (responseText.startsWith("```")) {
                    responseText = responseText.substring(3);
                }
                if (responseText.endsWith("```")) {
                    responseText = responseText.substring(0, responseText.length() - 3);
                }
                responseText = responseText.trim();
                JsonNode parsedJson = objectMapper.readTree(responseText);

                String title = parsedJson.has("title") ? parsedJson.get("title").asText() : "Bài tập ứng dụng " + level;
                String content = parsedJson.get("content").asText();
                String audioScript = parsedJson.has("audioScript") ? parsedJson.get("audioScript").asText() : content;
                String translation = parsedJson.has("translation") ? parsedJson.get("translation").asText() : "";
                String explanation = parsedJson.has("explanation") ? parsedJson.get("explanation").asText() : "";

                List<String> targetAnswers = new ArrayList<>();
                if (parsedJson.has("targetAnswers")) {
                    for (JsonNode ans : parsedJson.get("targetAnswers")) {
                        targetAnswers.add(ans.asText().trim());
                    }
                }

                List<String> blankHints = new ArrayList<>();
                if (parsedJson.has("blankHints")) {
                    for (JsonNode hint : parsedJson.get("blankHints")) {
                        blankHints.add(hint.asText().trim());
                    }
                }

                return ExerciseItemDto.builder()
                        .deckId(deckId)
                        .deckName(deckName)
                        .level(level)
                        .title(title)
                        .content(content)
                        .audioScript(audioScript)
                        .translation(translation)
                        .targetAnswers(targetAnswers)
                        .blankHints(blankHints)
                        .explanation(explanation)
                        .build();
            }
        } else {
            log.warn("Gemini API trả về mã lỗi: {} - Nội dung: {}", response.statusCode(), response.body());
        }

        return null;
    }

    private String getLevelRules(String level) {
        return switch (level) {
            case "TOEIC_550" -> """
                    - Cấp độ: TOEIC 550 (Format Part 5).
                    - Cấu trúc: 1 CÂU ĐƠN LẺ DUY NHẤT. Ngữ pháp cơ bản (S + V + O, thì đơn giản, bị động đơn).
                    - Số lượng chỗ trống: ĐÚNG 1 CHỖ TRỐNG [BLANK_1] rơi vào 1 từ/cụm từ trong danh sách trên.
                    - Câu văn rõ ràng, có ngữ cảnh thực tế dễ hiểu.
                    """;
            case "TOEIC_700_READING" -> """
                    - Cấp độ: TOEIC 700 (Đọc đoạn văn - KHÔNG NGHE - Format Part 6).
                    - Cấu trúc: 1 ĐOẠN VĂN NGẮN (3 đến 4 câu) dạng Email công sở, Thông báo nội bộ hoặc Thư thông báo.
                    - Ngữ pháp: Trung cấp TOEIC (sử dụng liên từ furthermore, however, in order to, mệnh đề quan hệ, phân từ).
                    - Số lượng chỗ trống: ĐÚNG 2 hoặc 3 CHỖ TRỐNG ([BLANK_1], [BLANK_2], có thể [BLANK_3]) rơi vào các từ trong danh sách.
                    - Câu hỏi kiểm tra khả năng đọc hiểu ngữ cảnh văn bản và chọn đúng từ ngữ liên kết.
                    """;
            case "TOEIC_700_LISTENING" -> """
                    - Cấp độ: TOEIC 700 (Nghe đoạn văn - CÓ AUDIO - Format Part 4).
                    - Cấu trúc: 1 ĐOẠN NÓI NGẮN (3 đến 4 câu) dạng Lời nhắn thoại, Thông báo qua loa tại sân bay/văn phòng.
                    - Số lượng chỗ trống: ĐÚNG 2 hoặc 3 CHỖ TRỐNG ([BLANK_1], [BLANK_2]) rơi vào các từ trong danh sách.
                    - audioScript phải là toàn bộ đoạn nói tự nhiên, câu cú liền mạch, sinh động để đọc thành tiếng.
                    """;
            case "TOEIC_850" -> """
                    - Cấp độ: TOEIC 850 (Gõ câu hoàn chỉnh nâng cao).
                    - Cấu trúc: 1 câu phức hợp dài hoặc 2 câu liên kết chặt chẽ về hợp đồng, tài chính, đàm phán cấp cao.
                    - Ngữ pháp: Nâng cao (đảo ngữ, câu điều kiện hỗn hợp, rút gọn mệnh đề phân từ, thể giả định, cấu trúc song hành).
                    - Số lượng chỗ trống: 1 hoặc 2 chỗ trống mang tính then chốt quyết định nghĩa của câu.
                    """;
            default -> "Đoạn văn ngắn chuẩn TOEIC có 1-2 chỗ trống.";
        };
    }

    /**
     * Fallback Generator chất lượng cao khi chưa có API Key
     */
    private ExerciseItemDto generateFallbackExercise(Long deckId, String deckName, String level, List<Word> words) {
        Word w1 = words.get(0);
        Word w2 = words.size() > 1 ? words.get(1) : w1;

        String title;
        String content;
        String audioScript;
        String translation;
        List<String> targetAnswers = new ArrayList<>();
        List<String> blankHints = new ArrayList<>();
        String explanation;

        if ("TOEIC_550".equals(level)) {
            title = "Thông báo tuân thủ quy định nội bộ";
            content = "All staff members are strictly required to [BLANK_1] to avoid unexpected penalties.";
            audioScript = "All staff members are strictly required to " + w1.getTerm() + " to avoid unexpected penalties.";
            translation = "Tất cả các thành viên nhân viên được yêu cầu nghiêm ngặt phải " + w1.getMeaning() + " để tránh các hình phạt không mong muốn.";
            targetAnswers.add(w1.getTerm());
            blankHints.add(w1.getMeaning());
            explanation = "### Phân tích ngữ pháp (TOEIC 550):\n" +
                    "- **Cấu trúc**: `be required to + V (nguyên thể)`. Sau giới từ 'to' cần một động từ/cụm động từ nguyên mẫu.\n" +
                    "- **Đáp án**: `" + w1.getTerm() + "` (" + w1.getMeaning() + ") hoàn toàn phù hợp với cấu trúc ngữ pháp và ngữ cảnh nội quy công ty.";

        } else if ("TOEIC_700_READING".equals(level)) {
            title = "Email cập nhật tiến độ công việc (TOEIC Part 6)";
            content = "Dear Department Heads, please ensure that your teams [BLANK_1] during the upcoming audit. " +
                    "Furthermore, if any issue arises, managers must promptly [BLANK_2] to prevent any operational disruption.";
            audioScript = "Dear Department Heads, please ensure that your teams " + w1.getTerm() + " during the upcoming audit. " +
                    "Furthermore, if any issue arises, managers must promptly " + w2.getTerm() + " to prevent any operational disruption.";
            translation = "Kính gửi các Trưởng phòng, vui lòng đảm bảo rằng đội ngũ của bạn " + w1.getMeaning() + " trong đợt kiểm toán sắp tới. " +
                    "Hơn nữa, nếu có bất kỳ vấn đề nào phát sinh, các quản lý phải nhanh chóng " + w2.getMeaning() + " nhằm ngăn chặn mọi sự gián đoạn vận hành.";
            targetAnswers.add(w1.getTerm());
            targetAnswers.add(w2.getTerm());
            blankHints.add(w1.getMeaning());
            blankHints.add(w2.getMeaning());
            explanation = "### Phân tích ngữ cảnh & Ngữ pháp (TOEIC 700 - Reading):\n" +
                    "- **Chỗ trống 1**: Sau mệnh đề `ensure that your teams [V]`, cần một vị ngữ chỉ hành động tuân thủ: `" + w1.getTerm() + "` (" + w1.getMeaning() + ").\n" +
                    "- **Chỗ trống 2**: Sau trợ động từ `must promptly [V]`, điền `" + w2.getTerm() + "` (" + w2.getMeaning() + ") để hoàn thành ngữ cảnh xử lý tình huống phát sinh.";

        } else if ("TOEIC_700_LISTENING".equals(level)) {
            title = "Thông báo cuộc họp ban giám đốc (TOEIC Part 4 Talk)";
            content = "Good morning everyone. Due to urgent circumstances, we have to [BLANK_1] until further notice. " +
                    "In the meantime, the project committee will meet at 2 PM to [BLANK_2]. Thank you for your cooperation.";
            audioScript = "Good morning everyone. Due to urgent circumstances, we have to " + w1.getTerm() + " until further notice. " +
                    "In the meantime, the project committee will meet at 2 PM to " + w2.getTerm() + ". Thank you for your cooperation.";
            translation = "Chào buổi sáng mọi người. Do hoàn cảnh khẩn cấp, chúng ta phải " + w1.getMeaning() + " cho đến khi có thông báo mới. " +
                    "Trong thời gian này, ủy ban dự án sẽ họp lúc 2 giờ chiều để " + w2.getMeaning() + ". Cảm ơn sự hợp tác của các bạn.";
            targetAnswers.add(w1.getTerm());
            targetAnswers.add(w2.getTerm());
            blankHints.add(w1.getMeaning());
            blankHints.add(w2.getMeaning());
            explanation = "### Phân tích bài nghe (TOEIC 700 - Listening):\n" +
                    "- **Chỗ trống 1**: Đi sau cấu trúc `have to + V`, người nói thông báo hành động `" + w1.getTerm() + "`.\n" +
                    "- **Chỗ trống 2**: Sau `in order to / to + V`, mục tiêu của buổi họp là `" + w2.getTerm() + "` (" + w2.getMeaning() + ").";

        } else {
            // TOEIC_850
            title = "Điều khoản hợp đồng thương mại chiến lược";
            content = "Should either party commit a severe [BLANK_1], the non-breaching entity shall reserve the unilateral right to [BLANK_2] with immediate effect.";
            audioScript = "Should either party commit a severe " + w1.getTerm() + ", the non-breaching entity shall reserve the unilateral right to " + w2.getTerm() + " with immediate effect.";
            translation = "Nếu bất kỳ bên nào phạm phải " + w1.getMeaning() + " nghiêm trọng, bên không vi phạm sẽ bảo lưu quyền đơn phương " + w2.getMeaning() + " có hiệu lực ngay lập tức.";
            targetAnswers.add(w1.getTerm());
            targetAnswers.add(w2.getTerm());
            blankHints.add(w1.getMeaning());
            blankHints.add(w2.getMeaning());
            explanation = "### Phân tích ngữ pháp nâng cao (TOEIC 850):\n" +
                    "- **Cấu trúc Đảo ngữ điều kiện loại 1**: `Should + S + V (nguyên thể)...` thay thế cho `If either party commits...`.\n" +
                    "- **Chỗ trống 1**: Sau tính từ `severe` cần một danh từ/cụm danh từ: `" + w1.getTerm() + "` (" + w1.getMeaning() + ").\n" +
                    "- **Chỗ trống 2**: Cấu trúc `right to + V` (quyền làm gì đó): `" + w2.getTerm() + "` (" + w2.getMeaning() + ").";
        }

        return ExerciseItemDto.builder()
                .deckId(deckId)
                .deckName(deckName)
                .level(level)
                .title(title)
                .content(content)
                .audioScript(audioScript)
                .translation(translation)
                .targetAnswers(targetAnswers)
                .blankHints(blankHints)
                .explanation(explanation)
                .build();
    }
}
