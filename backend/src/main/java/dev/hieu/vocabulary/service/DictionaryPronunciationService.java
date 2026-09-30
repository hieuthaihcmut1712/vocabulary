package dev.hieu.vocabulary.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import dev.hieu.vocabulary.dto.PronunciationDetail;
import dev.hieu.vocabulary.dto.WordPronunciationResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

/**
 * Service gọi Free Dictionary API và tự động phân loại phát âm
 * cho các từ dị âm (heteronyms) theo từ loại: Danh từ/Tính từ (Noun/Adj) và Động từ (Verb).
 */
@Service
public class DictionaryPronunciationService {

    private static final String API_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(15);

    // Ký tự trọng âm chính trong phiên âm quốc tế IPA (Primary Stress: \u02C8) và nháy đơn chuẩn
    private static final char PRIMARY_STRESS_IPA = 'ˈ'; // \u02C8
    private static final char PRIMARY_STRESS_ASCII = '\'';

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public DictionaryPronunciationService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(REQUEST_TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        this.objectMapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .enable(SerializationFeature.INDENT_OUTPUT);
    }

    /**
     * Tra cứu và phân loại phát âm của một từ tiếng Anh
     *
     * @param word Từ tiếng Anh cần tra cứu (ví dụ: "present", "record", "object")
     * @return WordPronunciationResponse chứa phát âm Noun/Adj, Verb và Unclassified
     */
    public WordPronunciationResponse getPronunciations(String word) {
        if (word == null || word.trim().isEmpty()) {
            throw new IllegalArgumentException("Từ cần tra cứu không được để trống!");
        }

        String sanitizedWord = word.trim().toLowerCase();
        String url = API_BASE_URL + URLEncoder.encode(sanitizedWord, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(REQUEST_TIMEOUT)
                .header("Accept", "application/json")
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Vocabulary-Heteronym-Classifier/1.0")
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            int statusCode = response.statusCode();
            if (statusCode == 404) {
                System.err.println("❌ Không tìm thấy từ '" + sanitizedWord + "' trong Free Dictionary API (404 Not Found).");
                return new WordPronunciationResponse(sanitizedWord, null, null, Collections.emptyList());
            }

            if (statusCode != 200) {
                throw new RuntimeException("Lỗi khi gọi Free Dictionary API: HTTP status " + statusCode + ", body: " + response.body());
            }

            return parseAndClassifyResponse(sanitizedWord, response.body());

        } catch (HttpTimeoutException e) {
            throw new RuntimeException("Hết thời gian chờ kết nối tới Free Dictionary API (" + REQUEST_TIMEOUT.toSeconds() + "s): " + e.getMessage(), e);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi I/O mạng hoặc parse JSON khi gọi API: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Tiến trình gọi API bị gián đoạn: " + e.getMessage(), e);
        }
    }

    /**
     * Phân tích JSON và áp dụng các quy tắc Heuristics để phân loại phát âm
     */
    public WordPronunciationResponse parseAndClassifyResponse(String word, String jsonResponse) throws IOException {
        JsonNode rootArray = objectMapper.readTree(jsonResponse);
        if (!rootArray.isArray() || rootArray.isEmpty()) {
            return new WordPronunciationResponse(word, null, null, Collections.emptyList());
        }

        PronunciationDetail nounAdj = null;
        PronunciationDetail verb = null;
        List<PronunciationDetail> unclassified = new ArrayList<>();
        Set<String> seenAudios = new HashSet<>();

        // Duyệt qua tất cả các entries trả về từ API
        for (JsonNode entryNode : rootArray) {
            // Lấy phonetic mặc định của entry nếu trong mảng phonetics bị thiếu text
            String entryLevelPhonetic = entryNode.path("phonetic").asText(null);

            JsonNode phoneticsArray = entryNode.path("phonetics");
            if (phoneticsArray.isArray()) {
                for (JsonNode phoneticNode : phoneticsArray) {
                    String audio = phoneticNode.path("audio").asText(null);

                    // Quy tắc: Lọc bỏ các phần tử mà trường audio bị rỗng (null hoặc empty)
                    if (audio == null || audio.trim().isEmpty()) {
                        continue;
                    }

                    audio = audio.trim();
                    if (audio.startsWith("//")) {
                        audio = "https:" + audio;
                    }

                    // Tránh xử lý trùng lặp link audio
                    if (seenAudios.contains(audio)) {
                        continue;
                    }
                    seenAudios.add(audio);

                    String text = phoneticNode.path("text").asText(null);
                    if (text == null || text.trim().isEmpty()) {
                        text = entryLevelPhonetic;
                    }

                    PronunciationDetail detail = new PronunciationDetail(text, audio);
                    ClassificationResult category = classifyPronunciation(text, audio);

                    switch (category) {
                        case NOUN_ADJ -> {
                            if (nounAdj == null) {
                                nounAdj = detail;
                            } else {
                                unclassified.add(detail);
                            }
                        }
                        case VERB -> {
                            if (verb == null) {
                                verb = detail;
                            } else {
                                unclassified.add(detail);
                            }
                        }
                        case UNCLASSIFIED -> unclassified.add(detail);
                    }
                }
            }
        }

        return new WordPronunciationResponse(word, nounAdj, verb, unclassified);
    }

    /**
     * Áp dụng 2 quy tắc Heuristics để phân loại phát âm:
     * 1. Ưu tiên: Vị trí dấu trọng âm chính 'ˈ' trong chuỗi IPA đã chuẩn hóa.
     * 2. Dự phòng: Tên file audio (chứa -1- hoặc -2-, hoặc nhãn noun/adjective/verb).
     */
    private ClassificationResult classifyPronunciation(String ipaText, String audioUrl) {
        // Quy tắc 1: Phân loại theo dấu trọng âm chính IPA
        if (ipaText != null && !ipaText.trim().isEmpty()) {
            // Chuẩn hóa chuỗi IPA: loại bỏ dấu gạch chéo /, ngoặc vuông [ ], và khoảng trắng
            String cleanIpa = ipaText.replaceAll("[/\\[\\]]", "").trim();

            int stressIndex = cleanIpa.indexOf(PRIMARY_STRESS_IPA);
            if (stressIndex == -1) {
                stressIndex = cleanIpa.indexOf(PRIMARY_STRESS_ASCII);
            }

            if (stressIndex != -1) {
                // Nếu 'ˈ' nằm ngay đầu chuỗi (index 0) hoặc ở âm tiết thứ nhất (index 1) -> Danh từ/Tính từ
                if (stressIndex <= 1) {
                    return ClassificationResult.NOUN_ADJ;
                } else {
                    // Nếu 'ˈ' nằm ở giữa hoặc các âm tiết phía sau -> Động từ
                    return ClassificationResult.VERB;
                }
            }
        }

        // Quy tắc 2: Dự phòng theo tên file audio (nếu IPA thiếu hoặc không có dấu 'ˈ')
        if (audioUrl != null && !audioUrl.trim().isEmpty()) {
            String lowerUrl = audioUrl.toLowerCase();

            // Wiktionary convention: "-1-" thường là Danh từ / Tính từ; "-2-" là Động từ
            // Ngoài ra kiểm tra thêm từ khóa semantic nếu có trên link CDN
            if (lowerUrl.contains("-1-") || lowerUrl.contains("adjective-noun") || lowerUrl.contains("-noun") || lowerUrl.contains("-adj")) {
                return ClassificationResult.NOUN_ADJ;
            }

            if (lowerUrl.contains("-2-") || lowerUrl.contains("-verb")) {
                return ClassificationResult.VERB;
            }
        }

        return ClassificationResult.UNCLASSIFIED;
    }

    private enum ClassificationResult {
        NOUN_ADJ,
        VERB,
        UNCLASSIFIED
    }

    // =========================================================================
    // HÀM MAIN KIỂM THỬ THỰC TẾ
    // =========================================================================
    public static void main(String[] args) {
        DictionaryPronunciationService service = new DictionaryPronunciationService();

        System.out.println("======================================================================");
        System.out.println("🚀 KIỂM THỬ PHÂN LOẠI PHÁT ÂM TỪ DỊ ÂM (HETERONYMS) VỚI FREE DICTIONARY API");
        System.out.println("======================================================================\n");

        String testWord = "present";
        try {
            System.out.println("🔍 Đang gọi Free Dictionary API cho từ: '" + testWord + "'...");
            WordPronunciationResponse response = service.getPronunciations(testWord);
            if (response.nounAdj() != null || response.verb() != null) {
                printResult(service, response);
            } else {
                throw new RuntimeException("API không trả về âm thanh khả dụng.");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Thông báo: " + e.getMessage());
            System.out.println("🔄 Kiểm thử phân loại với dữ liệu JSON thực tế từ Free Dictionary API cho từ 'present':\n");

            String sampleJsonPresent = """
                [
                  {
                    "word": "present",
                    "phonetic": "/pɹəˈzɛnt/",
                    "phonetics": [
                      {
                        "text": "/pɹəˈzɛnt/",
                        "audio": ""
                      },
                      {
                        "text": "/ˈpɹɛzənt/",
                        "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/present-us-adjective-noun.mp3"
                      },
                      {
                        "text": "/pɹɪˈzɛnt/",
                        "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/present-us-verb.mp3"
                      }
                    ]
                  }
                ]
                """;

            try {
                WordPronunciationResponse response = service.parseAndClassifyResponse("present", sampleJsonPresent);
                printResult(service, response);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    private static void printResult(DictionaryPronunciationService service, WordPronunciationResponse response) throws Exception {
        System.out.println("📋 KẾT QUẢ PHÂN LOẠI THÀNH CÔNG:");
        System.out.println("  • Từ vựng              : " + response.word());
        System.out.println("  • Danh từ / Tính từ (N): " + (response.nounAdj() != null 
                ? response.nounAdj().ipa() + " -> " + response.nounAdj().audioUrl() 
                : "Không tìm thấy"));
        System.out.println("  • Động từ (Verb - V)   : " + (response.verb() != null 
                ? response.verb().ipa() + " -> " + response.verb().audioUrl() 
                : "Không tìm thấy"));
        System.out.println("  • Chưa phân loại       : " + response.unclassified().size() + " items");

        System.out.println("\n📄 JSON Response (DTO WordPronunciationResponse):");
        System.out.println(service.objectMapper.writeValueAsString(response));
        System.out.println("======================================================================\n");
    }
}
