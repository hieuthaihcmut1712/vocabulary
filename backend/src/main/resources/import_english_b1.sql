-- Tạo bộ thẻ 'English B1' và chèn 50 từ vựng cùng tiến độ khởi tạo (weight = 10)
WITH new_deck AS (
    INSERT INTO decks (name, description, created_at, updated_at)
    VALUES ('English B1', 'Bộ 50 từ vựng tiếng Anh trình độ B1 thông dụng', NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, meaning) AS (
    VALUES
    ('Accommodate', 'v.', 'Cung cấp chỗ ở; đáp ứng nhu cầu'),
    ('Achieve', 'v.', 'Đạt được, hoàn thành'),
    ('Accurate', 'adj.', 'Chính xác, đúng đắn'),
    ('Advantage', 'n.', 'Lợi thế, ưu điểm'),
    ('Affect', 'v.', 'Tác động, ảnh hưởng'),
    ('Alternative', 'n. / adj.', 'Sự thay thế; có thể thay thế'),
    ('Analyze', 'v.', 'Phân tích'),
    ('Announce', 'v.', 'Thông báo'),
    ('Approach', 'n. / v.', 'Cách tiếp cận; tiến lại gần'),
    ('Appropriate', 'adj.', 'Thích hợp, phù hợp'),
    ('Available', 'adj.', 'Có sẵn, rảnh rỗi'),
    ('Benefit', 'n. / v.', 'Lợi ích; được hưởng lợi'),
    ('Candidate', 'n.', 'Ứng viên'),
    ('Circumstance', 'n.', 'Hoàn cảnh, trường hợp'),
    ('Colleague', 'n.', 'Đồng nghiệp'),
    ('Compete', 'v.', 'Cạnh tranh, thi đua'),
    ('Complicated', 'adj.', 'Phức tạp, rắc rối'),
    ('Consequence', 'n.', 'Hậu quả, kết quả'),
    ('Consider', 'v.', 'Cân nhắc, xem xét'),
    ('Convenient', 'adj.', 'Tiện lợi, thuận tiện'),
    ('Decrease', 'v. / n.', 'Giảm bớt; sự sụt giảm'),
    ('Delighted', 'adj.', 'Rất vui mừng, hài lòng'),
    ('Efficient', 'adj.', 'Hiệu quả, năng suất cao'),
    ('Embarrassed', 'adj.', 'Ngượng ngùng, xấu hổ'),
    ('Encourage', 'v.', 'Khuyến khích, động viên'),
    ('Essential', 'adj.', 'Cần thiết, thiết yếu'),
    ('Estimate', 'v. / n.', 'Ước lượng, ước tính'),
    ('Expect', 'v.', 'Trông đợi, kỳ vọng'),
    ('Frequent', 'adj.', 'Thường xuyên'),
    ('Generous', 'adj.', 'Hào phóng, rộng lượng'),
    ('Improve', 'v.', 'Cải thiện, nâng cao'),
    ('Individual', 'n. / adj.', 'Cá nhân; riêng lẻ'),
    ('Influence', 'n. / v.', 'Sự ảnh hưởng; tác động tới'),
    ('Interrupt', 'v.', 'Ngắt lời, làm gián đoạn'),
    ('Maintain', 'v.', 'Duy trì, bảo dưỡng'),
    ('Manage', 'v.', 'Quản lý; xoay xở làm được'),
    ('Noticeable', 'adj.', 'Đáng chú ý, dễ nhận thấy'),
    ('Opportunity', 'n.', 'Cơ hội'),
    ('Organize', 'v.', 'Tổ chức, sắp xếp'),
    ('Predict', 'v.', 'Dự đoán'),
    ('Recommend', 'v.', 'Gợi ý, khuyên bảo'),
    ('Reliable', 'adj.', 'Đáng tin cậy'),
    ('Requirement', 'n.', 'Yêu cầu'),
    ('Responsible', 'adj.', 'Có trách nhiệm'),
    ('Significant', 'adj.', 'Quan trọng, có ý nghĩa lớn'),
    ('Suitable', 'adj.', 'Phù hợp'),
    ('Temporary', 'adj.', 'Tạm thời'),
    ('Tend', 'v.', 'Có xu hướng'),
    ('Urgent', 'adj.', 'Khẩn cấp, gấp'),
    ('Valuable', 'adj.', 'Có giá trị, quý giá')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.meaning, NOW(), NOW()
    FROM raw_words rw, new_deck d
    RETURNING id, deck_id
)
INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
FROM inserted_words iw;
