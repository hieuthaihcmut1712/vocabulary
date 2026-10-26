-- ================================================================
-- IMPORT 10 BỘ TỪ VỰNG 600 ESSENTIAL WORDS FOR THE TOEIC (50 LESSONS)
-- ================================================================

-- ----------------------------------------------------
-- DECK 1: 600 TOEIC: Bài 1 - 5 (Hợp đồng, Tiếp thị, Kế hoạch & Hội nghị) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 1 - 5 (Hợp đồng, Tiếp thị, Kế hoạch & Hội nghị)', 'Kinh doanh tổng quát: Hợp đồng (Contracts), Tiếp thị (Marketing), Bảo hành (Warranties), Kế hoạch kinh doanh (Business Planning), Hội nghị (Conferences)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Abide by', 'v.', '', 'Tuân thủ, tuân theo (luật, hợp đồng)'),
    ('Agreement', 'n.', '', 'Hợp đồng, sự thỏa thuận'),
    ('Assurance', 'n.', '', 'Sự bảo đảm, cam đoan'),
    ('Cancel', 'v.', '', 'Hủy bỏ'),
    ('Determine', 'v.', '', 'Xác định, quyết định'),
    ('Engage', 'v.', '', 'Thuê, cam kết, tham gia'),
    ('Establish', 'v.', '', 'Thiết lập, thành lập'),
    ('Obligate', 'v.', '', 'Bắt buộc, ràng buộc nghĩa vụ'),
    ('Party', 'n.', '', 'Bên tham gia (hợp đồng)'),
    ('Provision', 'n.', '', 'Điều khoản, sự cung cấp'),
    ('Resolve', 'v.', '', 'Giải quyết (vấn đề), kiên quyết'),
    ('Specify', 'v.', '', 'Chỉ rõ, định rõ chi tiết'),
    ('Attract', 'v.', '', 'Thu hút, lôi cuốn'),
    ('Compare', 'v.', '', 'So sánh, đối chiếu'),
    ('Compete', 'v.', '', 'Cạnh tranh, tranh đua'),
    ('Consume', 'v.', '', 'Tiêu thụ, tiêu dùng'),
    ('Convince', 'v.', '', 'Thuyết phục, làm cho tin'),
    ('Current', 'adj.', '', 'Đang thịnh hành, hiện tại'),
    ('Fad', 'n.', '', 'Mốt nhất thời, xu hướng ngắn'),
    ('Inspire', 'v.', '', 'Truyền cảm hứng'),
    ('Market', 'v./n.', '', 'Tiếp thị, quảng bá; thị trường'),
    ('Persuade', 'v.', '', 'Thuyết phục'),
    ('Productive', 'adj.', '', 'Năng suất, hiệu quả cao'),
    ('Satisfy', 'v.', '', 'Làm hài lòng, thỏa mãn'),
    ('Characteristic', 'adj.', '', 'Đặc trưng, nét tiêu biểu'),
    ('Consequence', 'n.', '', 'Hậu quả, kết quả'),
    ('Consider', 'v.', '', 'Cân nhắc, xem xét kỹ'),
    ('Cover', 'v.', '', 'Bao quát, chi trả, bảo hành'),
    ('Expire', 'v.', '', 'Hết hạn, hết hiệu lực'),
    ('Frequently', 'adv.', '', 'Thường xuyên, liên tục'),
    ('Imply', 'v.', '', 'Ngụ ý, hàm ý'),
    ('Promise', 'v./n.', '', 'Hứa hẹn; lời hứa'),
    ('Protect', 'v.', '', 'Bảo vệ, che chở'),
    ('Reputation', 'n.', '', 'Danh tiếng, uy tín'),
    ('Require', 'v.', '', 'Yêu cầu, đòi hỏi'),
    ('Vary', 'v.', '', 'Thay đổi, khác biệt'),
    ('Address', 'v.', '', 'Xử lý, giải quyết; gửi tới'),
    ('Avoid', 'v.', '', 'Tránh né, ngăn ngừa'),
    ('Demonstrate', 'v.', '', 'Chứng minh, thị phạm, biểu thị'),
    ('Develop', 'v.', '', 'Phát triển, mở rộng'),
    ('Evaluate', 'v.', '', 'Đánh giá, định giá'),
    ('Gather', 'v.', '', 'Tập hợp, thu thập, tụ họp'),
    ('Offer', 'v.', '', 'Đưa ra đề xuất, chào bán'),
    ('Primary', 'adj.', '', 'Quan trọng nhất, hàng đầu'),
    ('Risk', 'n.', '', 'Rủi ro, mối nguy cơ'),
    ('Strategy', 'n.', '', 'Chiến lược, phương lược'),
    ('Strong', 'adj.', '', 'Mạnh mẽ, vững chắc'),
    ('Substitute', 'v.', '', 'Thay thế; người/vật thay thế'),
    ('Accommodate', 'v.', '', 'Đáp ứng, cung cấp chỗ ở'),
    ('Arrangement', 'n.', '', 'Sự sắp xếp, thu xếp'),
    ('Association', 'n.', '', 'Hiệp hội, liên kết'),
    ('Attend', 'v.', '', 'Tham dự, có mặt'),
    ('Get in touch', 'v.', '', 'Liên lạc, giữ liên lạc'),
    ('Hold', 'v.', '', 'Tổ chức, tiến hành (sự kiện)'),
    ('Location', 'n.', '', 'Địa điểm, vị trí'),
    ('Overcrowded', 'adj.', '', 'Quá đông đúc, chật chội'),
    ('Register', 'v.', '', 'Gửi bảo đảm (thư); đăng ký'),
    ('Select', 'v.', '', 'Lựa chọn, tuyển chọn'),
    ('Session', 'n.', '', 'Phiên họp, buổi làm việc'),
    ('Take part in', 'v.', '', 'Tham gia, góp mặt')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 2: 600 TOEIC: Bài 6 - 10 (Văn phòng, Máy tính & Thư tín) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 6 - 10 (Văn phòng, Máy tính & Thư tín)', 'Công nghệ & Văn phòng: Máy tính (Computers), Công nghệ văn phòng (Office Tech), Thủ tục hành chính (Procedures), Thiết bị điện tử (Electronics), Thư tín thương mại (Correspondence)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Access', 'v./n.', '', 'Truy cập, tiếp cận; quyền truy cập'),
    ('Allocate', 'v.', '', 'Phân bổ, cấp phát'),
    ('Compatible', 'adj.', '', 'Tương thích, hợp nhau'),
    ('Delete', 'v.', '', 'Xóa bỏ, loại bỏ'),
    ('Display', 'n./v.', '', 'Hiển thị, trưng bày'),
    ('Duplicate', 'v./n.', '', 'Nhân bản, sao chép y hệt'),
    ('Fail', 'v.', '', 'Thất bại, hỏng'),
    ('Figure out', 'v.', '', 'Tìm ra, giải quyết được'),
    ('Ignore', 'v.', '', 'Bỏ qua, lờ đi'),
    ('Search', 'v./n.', '', 'Tìm kiếm, lục soát'),
    ('Shut down', 'v.', '', 'Tắt máy, đóng cửa ngừng hoạt động'),
    ('Warn', 'v.', '', 'Cảnh báo'),
    ('Affordable', 'adj.', '', 'Giá cả phải chăng, hợp túi tiền'),
    ('As needed', 'adv.', '', 'Khi cần thiết, theo nhu cầu'),
    ('Be in charge of', 'v.', '', 'Phụ trách, chịu trách nhiệm'),
    ('Capacity', 'n.', '', 'Sức chứa, công suất, năng lực'),
    ('Durable', 'adj.', '', 'Bền bỉ, lâu bền'),
    ('Initiative', 'n.', '', 'Sáng kiến, tính chủ động'),
    ('Physical', 'adj.', '', 'Vật chất, thuộc thể chất'),
    ('Provider', 'n.', '', 'Nhà cung cấp'),
    ('Recur', 'v.', '', 'Tái diễn, lặp lại'),
    ('Reduction', 'n.', '', 'Sự cắt giảm, giảm bớt'),
    ('Stay on top of', 'v.', '', 'Nắm bắt kịp thời, cập nhật'),
    ('Stock', 'n./v.', '', 'Kho hàng, dự trữ; tích trữ'),
    ('Appreciate', 'v.', '', 'Cảm kích, thông cảm, đánh giá cao'),
    ('Be exposed to', 'v.', '', 'Bị phơi bày, tiếp xúc với'),
    ('Bring in', 'v.', '', 'Tuyển dụng, mang lại (lợi nhuận)'),
    ('Casual', 'adj.', '', 'Tình cờ, ngẫu nhiên; không trang trọng'),
    ('Code', 'n.', '', 'Quy tắc, chuẩn mực, mã'),
    ('Glimpse', 'n.', '', 'Cái nhìn thoáng qua, lướt qua'),
    ('Made up of', 'v.', '', 'Bao gồm'),
    ('Out of', 'adj.', '', 'Hết, cạn kiệt'),
    ('Outdated', 'adj.', '', 'Lỗi thời, hết hạn'),
    ('Practice', 'n./v.', '', 'Thực hành, thông lệ, thói quen'),
    ('Reinforce', 'v.', '', 'Củng cố, tăng cường'),
    ('Verbal', 'adj.', '', 'Bằng lời nói'),
    ('Disk', 'n.', '', 'Đĩa lưu trữ dữ liệu'),
    ('Facilitate', 'v.', '', 'Tạo điều kiện thuận lợi'),
    ('Network', 'n.', '', 'Kết nối mạng; mạng lưới'),
    ('Popularity', 'n.', '', 'Tính phổ biến, sự ưa chuộng'),
    ('Process', 'n.', '', 'Quy trình, xử lý'),
    ('Replace', 'v.', '', 'Thay thế, đổi mới'),
    ('Revolution', 'n.', '', 'Cuộc cách mạng, sự đổi mới đột phá'),
    ('Sharp', 'adj.', '', 'Sắc bén, đột ngột, rõ rệt'),
    ('Skills', 'n.', '', 'Kỹ năng, kỹ xảo'),
    ('Software', 'n.', '', 'Phần mềm máy tính'),
    ('Storage', 'n.', '', 'Sự lưu trữ'),
    ('Technical', 'adj.', '', 'Chuyên môn, kỹ thuật'),
    ('Assemble', 'v.', '', 'Lắp ráp, thu thập, tụ họp'),
    ('Beforehand', 'adv.', '', 'Trước, sẵn từ trước'),
    ('Complicated', 'adj.', '', 'Phức tạp'),
    ('Courier', 'n.', '', 'Người chuyển phát nhanh'),
    ('Express', 'adj.', '', 'Hỏa tốc, nhanh chóng; bày tỏ'),
    ('Fold', 'v.', '', 'Gấp lại, gập lại'),
    ('Layout', 'n.', '', 'Bố cục, cách trình bày'),
    ('Mention', 'v./n.', '', 'Đề cập đến, nhắc tới'),
    ('Petition', 'n./v.', '', 'Đơn kiến nghị, thỉnh cầu'),
    ('Proof', 'v.', '', 'Bằng chứng, bản in thử'),
    ('Registered', 'adj.', '', 'Đã đăng ký'),
    ('Revise', 'v.', '', 'Sửa đổi, hiệu đính')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 3: 600 TOEIC: Bài 11 - 15 (Nhân sự, Tuyển dụng & Lương thưởng) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 11 - 15 (Nhân sự, Tuyển dụng & Lương thưởng)', 'Quản trị nhân sự: Đăng tin tuyển dụng (Job Ads), Nộp đơn & Phỏng vấn (Interviewing), Tuyển dụng & Đào tạo (Training), Tiền lương & Phúc lợi (Salaries & Benefits), Thăng tiến & Khen thưởng (Promotions)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Abundant', 'adj./n.', '', 'Nhiều, dồi dào'),
    ('Accomplishment', 'n.', '', 'Sự hoàn thành, đạt được'),
    ('Bring together', 'v.', '', 'Nhóm lại, họp lại'),
    ('Candidate', 'n.', '', 'Ứng cử viên'),
    ('Come up with', 'v.', '', 'Nghĩ ra, đưa ra'),
    ('Commensurate', 'adj.', '', 'Bằng, tương xứng với'),
    ('Match', 'n.', '', 'Sự phù hợp'),
    ('Profile', 'n.', '', 'Hồ sơ, đặc điểm'),
    ('Qualifications', 'n.', '', 'Bằng cấp, năng lực'),
    ('Recruit', 'v.', '', 'Tuyển dụng'),
    ('Submit', 'v.', '', 'Đệ trình, nộp'),
    ('Time-consuming', 'adj.', '', 'Tốn nhiều thời gian'),
    ('Ability', 'n.', '', 'Khả năng'),
    ('Apply', 'v.', '', 'Xin việc, đăng ký'),
    ('Background', 'n.', '', 'Kinh nghiệm, quá trình'),
    ('Be ready for', 'v.', '', 'Sẵn sàng cho'),
    ('Call in', 'v.', '', 'Gọi đến, yêu cầu'),
    ('Confidence', 'n.', '', 'Sự tự tin'),
    ('Constantly', 'adv.', '', 'Luôn luôn, không đổi'),
    ('Expert', 'n.', '', 'Chuyên gia; thành thạo, tinh thông'),
    ('Follow up', 'v.', '', 'Tiếp tục, theo dõi thêm'),
    ('Hesitate', 'v.', '', 'Do dự, lưỡng lự'),
    ('Present', 'v.', '', 'Đưa ra, bày tỏ, giới thiệu'),
    ('Weakness', 'n.', '', 'Nhược điểm, điểm yếu'),
    ('Conduct', 'v.', '', 'Tiến hành, cư xử'),
    ('Generate', 'v.', '', 'Tạo ra, sinh ra'),
    ('Hire', 'v./n.', '', 'Thuê, mướn'),
    ('Keep up with', 'v.', '', 'Theo kịp, ngang hàng với'),
    ('Look up to', 'v.', '', 'Khâm phục, ngưỡng mộ'),
    ('Mentor', 'n.', '', 'Người cố vấn'),
    ('On track', 'adj.', '', 'Theo đúng tiến độ'),
    ('Reject', 'v.', '', 'Từ chối, loại bỏ'),
    ('Set up', 'v./adj.', '', 'Thiết lập, định trước'),
    ('Success', 'n.', '', 'Sự thành công'),
    ('Training', 'n.', '', 'Đào tạo, huấn luyện'),
    ('Update', 'v./n.', '', 'Cập nhật'),
    ('Basis', 'n.', '', 'Nền tảng, cơ sở'),
    ('Be aware of', 'v.', '', 'Am hiểu về, nhận biết'),
    ('Benefits', 'n.', '', 'Tiền trợ cấp, phúc lợi'),
    ('Compensate', 'v.', '', 'Đền bù, bồi thường'),
    ('Delicate', 'adj.', '', 'Nhạy bén, khéo léo'),
    ('Eligible', 'adj.', '', 'Đủ tư cách, đủ điều kiện'),
    ('Flexible', 'adj.', '', 'Linh hoạt, dễ uốn nắn'),
    ('Negotiate', 'v.', '', 'Đàm phán, thương lượng'),
    ('Raise', 'n.', '', 'Sự tăng lương'),
    ('Retire', 'v.', '', 'Nghỉ hưu'),
    ('Vested', 'adj.', '', 'Được quyền, được phép'),
    ('Wage', 'n.', '', 'Tiền công'),
    ('Achieve', 'v.', '', 'Đạt được, giành được'),
    ('Contribute', 'v.', '', 'Đóng góp, góp phần'),
    ('Dedication', 'n.', '', 'Sự cống hiến'),
    ('Look forward to', 'v.', '', 'Háo hức chờ mong'),
    ('Looked to', 'v.', '', 'Nhờ vào, trông cậy vào'),
    ('Loyal', 'adj.', '', 'Trung thành'),
    ('Merit', 'n.', '', 'Công lao, giá trị'),
    ('Obvious', 'adj.', '', 'Rõ ràng, rành mạch'),
    ('Productive', 'adj.', '', 'Năng suất, hiệu quả cao'),
    ('Promote', 'v.', '', 'Thăng chức, xúc tiến'),
    ('Recognition', 'n.', '', 'Sự công nhận, khen ngợi'),
    ('Value', 'n.', '', 'Giá trị')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 4: 600 TOEIC: Bài 16 - 20 (Mua sắm, Đặt hàng, Giao nhận & Kiểm kê) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 16 - 20 (Mua sắm, Đặt hàng, Giao nhận & Kiểm kê)', 'Mua hàng & Chuỗi cung ứng: Mua sắm (Shopping), Đặt văn phòng phẩm (Ordering Supplies), Vận chuyển hàng hóa (Shipping), Hóa đơn (Invoices), Kiểm kê kho bãi (Inventory)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Bargain', 'n.', '', 'Sự mặc cả, món hời'),
    ('Bear', 'v.', '', 'Chịu đựng, cam chịu'),
    ('Behavior', 'n.', '', 'Cách cư xử'),
    ('Checkout', 'n.', '', 'Sự thanh toán tiền'),
    ('Comfort', 'n.', '', 'Sự thoải mái, tiện nghi'),
    ('Expand', 'v.', '', 'Mở rộng'),
    ('Explore', 'v.', '', 'Thăm dò, khảo sát'),
    ('Item', 'n.', '', 'Mặt hàng, món đồ'),
    ('Mandatory', 'adj.', '', 'Bắt buộc, thiết yếu'),
    ('Merchandise', 'n.', '', 'Hàng hóa'),
    ('Strict', 'adj.', '', 'Nghiêm khắc, chính xác'),
    ('Trend', 'n.', '', 'Xu hướng'),
    ('Diverse', 'adj.', '', 'Đa dạng'),
    ('Enterprise', 'n.', '', 'Doanh nghiệp, công trình lớn'),
    ('Essential', 'adj.', '', 'Cần thiết, thiết yếu'),
    ('Everyday', 'adj.', '', 'Hàng ngày'),
    ('Function', 'v./n.', '', 'Hoạt động, chức năng'),
    ('Maintain', 'v.', '', 'Duy trì'),
    ('Obtain', 'v.', '', 'Đạt được, giành được'),
    ('Prerequisite', 'n.', '', 'Điều kiện tiên quyết, ưu tiên'),
    ('Quality', 'n.', '', 'Chất lượng'),
    ('Smooth', 'adj.', '', 'Êm thấm, suôn sẻ'),
    ('Source', 'n.', '', 'Nguồn, nguồn gốc'),
    ('Stationery', 'n.', '', 'Đồ dùng văn phòng'),
    ('Accurate', 'adj.', '', 'Đúng, chính xác'),
    ('Carrier', 'n.', '', 'Người hoặc vật chở hàng'),
    ('Catalog', 'n./v.', '', 'Sách danh mục chi tiết'),
    ('Fulfill', 'v.', '', 'Hoàn thành (nhiệm vụ)'),
    ('Integral', 'adj.', '', 'Cần thiết (để hoàn thành)'),
    ('Inventory', 'n.', '', 'Kiểm kê hàng hóa'),
    ('Minimize', 'v.', '', 'Giảm bớt, hạn chế'),
    ('On hand', 'adj.', '', 'Có sẵn'),
    ('Remember', 'v.', '', 'Nhớ, nhớ lại'),
    ('Ship', 'v.', '', 'Vận chuyển'),
    ('Sufficient', 'adj.', '', 'Đủ'),
    ('Supply', 'v.', '', 'Cung cấp'),
    ('Charge', 'n./v.', '', 'Phí tổn'),
    ('Compile', 'v.', '', 'Thu thập, tập hợp'),
    ('Customer', 'n.', '', 'Khách hàng'),
    ('Discount', 'n./v.', '', 'Phần tiền giảm giá'),
    ('Efficient', 'adj.', '', 'Có năng suất cao, hiệu quả'),
    ('Estimate', 'v.', '', 'Ước lượng, định giá'),
    ('Impose', 'v.', '', 'Bắt buộc, đánh thuế'),
    ('Mistake', 'n.', '', 'Lỗi'),
    ('Order', 'n./v.', '', 'Đơn đặt hàng'),
    ('Prompt', 'adj./n.', '', 'Ngay lập tức, không chậm trễ'),
    ('Rectify', 'v.', '', 'Sửa lại, hiệu chỉnh'),
    ('Terms', 'n.', '', 'Điều khoản'),
    ('Adjust', 'v.', '', 'Điều chỉnh, dàn xếp'),
    ('Automatic', 'adj.', '', 'Tự động'),
    ('Crucial', 'adj.', '', 'Cốt yếu, chủ yếu'),
    ('Discrepancy', 'n.', '', 'Sự bất đồng, bất hòa'),
    ('Disturb', 'v.', '', 'Làm rối loạn, gây cản trở'),
    ('Liability', 'n.', '', 'Nghĩa vụ, trách nhiệm'),
    ('Reflect', 'v.', '', 'Phản ánh, tương ứng với'),
    ('Run', 'v.', '', 'Chạy, hoạt động'),
    ('Scan', 'v.', '', 'Kiểm tra nhanh'),
    ('Subtract', 'v.', '', 'Trừ đi, khấu trừ'),
    ('Tedious', 'adj.', '', 'Chán ngắt, buồn tẻ'),
    ('Verify', 'v.', '', 'Xác minh, kiểm lại')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 5: 600 TOEIC: Bài 21 - 25 (Tài chính, Ngân hàng, Kế toán & Thuế) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 21 - 25 (Tài chính, Ngân hàng, Kế toán & Thuế)', 'Tài chính & Kế toán: Dịch vụ ngân hàng (Banking), Nghiệp vụ kế toán (Accounting), Đầu tư (Investments), Thuế doanh nghiệp (Taxes), Báo cáo tài chính (Financial Statements)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Accept', 'v.', '', 'Nhận, chấp nhận'),
    ('Balance', 'n./v.', '', 'Số dư (tài khoản)'),
    ('Borrow', 'v.', '', 'Vay, mượn'),
    ('Cautious', 'adj.', '', 'Thận trọng'),
    ('Deduct', 'v.', '', 'Trừ đi, khấu trừ'),
    ('Dividend', 'n.', '', 'Tiền lãi cổ phần'),
    ('Down payment', 'n.', '', 'Sự trả trước một phần khi mua hàng'),
    ('Mortgage', 'n./v.', '', 'Tiền thế chấp'),
    ('Restriction', 'n.', '', 'Hạn chế, giới hạn'),
    ('Signature', 'n.', '', 'Chữ ký'),
    ('Take out', 'v.', '', 'Rút (tiền)'),
    ('Transaction', 'n.', '', 'Giao dịch'),
    ('Accounting', 'n.', '', 'Kế toán'),
    ('Accumulate', 'v.', '', 'Tích lũy'),
    ('Asset', 'n.', '', 'Tài sản'),
    ('Audit', 'n./v.', '', 'Kiểm toán'),
    ('Budget', 'n./v.', '', 'Ngân sách, ngân quỹ'),
    ('Build up', 'v.', '', 'Sự tăng cường, tích lũy'),
    ('Client', 'n.', '', 'Khách hàng'),
    ('Debt', 'n.', '', 'Món nợ'),
    ('Outstanding', 'adj.', '', 'Chưa trả nợ, còn tồn đọng'),
    ('Profitable', 'adj.', '', 'Có sinh lợi'),
    ('Reconcile', 'v.', '', 'Đành chấp nhận, làm cho nhất quán'),
    ('Turnover', 'n.', '', 'Doanh số, doanh thu'),
    ('Aggressive', 'adj.', '', 'Có sức cạnh tranh, quyết liệt'),
    ('Attitude', 'n.', '', 'Thái độ'),
    ('Commitment', 'n.', '', 'Lời cam kết'),
    ('Conservative', 'adj.', '', 'Thận trọng, cẩn thận'),
    ('Fund', 'n./v.', '', 'Quỹ'),
    ('Invest', 'v.', '', 'Đầu tư'),
    ('Long-term', 'adj.', '', 'Dài hạn'),
    ('Portfolio', 'n.', '', 'Danh mục vốn đầu tư'),
    ('Pull out', 'v./n.', '', 'Sự rút lui'),
    ('Resource', 'n.', '', 'Tài sản, nguồn lực'),
    ('Return', 'n.', '', 'Tiền thu về, lợi nhuận'),
    ('Wise', 'adj.', '', 'Từng trải, hiểu biết nhiều'),
    ('Calculate', 'v.', '', 'Tính toán'),
    ('Deadline', 'n.', '', 'Đường giới hạn, hạn chót'),
    ('File', 'v./n.', '', 'Hồ sơ, tài liệu'),
    ('Fill out', 'v.', '', 'Điền đầy đủ, toàn bộ'),
    ('Give up', 'v.', '', 'Đầu hàng, từ bỏ'),
    ('Joint', 'adj.', '', 'Chung, liên kết'),
    ('Owe', 'v.', '', 'Nợ'),
    ('Penalty', 'n.', '', 'Sự trừng phạt, tiền phạt'),
    ('Prepare', 'v.', '', 'Chuẩn bị'),
    ('Refund', 'n./v.', '', 'Sự trả lại tiền'),
    ('Spouse', 'n.', '', 'Chồng, vợ'),
    ('Withhold', 'v.', '', 'Ngăn cản, giữ lại'),
    ('Desired', 'adj.', '', 'Mong muốn'),
    ('Detail', 'v.', '', 'Chi tiết hóa'),
    ('Forecast', 'n./v.', '', 'Dự đoán, dự báo'),
    ('Level', 'n.', '', 'Mức độ'),
    ('Overall', 'adj.', '', 'Toàn bộ, toàn diện'),
    ('Perspective', 'n.', '', 'Quan điểm, cách nhìn'),
    ('Projected', 'adj.', '', 'Có kế hoạch, dự kiến'),
    ('Realistic', 'adj.', '', 'Có óc thực tế'),
    ('Target', 'v./n.', '', 'Mục tiêu'),
    ('Translation', 'n.', '', 'Sự chuyển đổi, dịch'),
    ('Typical', 'adj.', '', 'Đặc thù, đặc trưng'),
    ('Yield', 'n./v.', '', 'Lợi nhuận, lợi tức')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 6: 600 TOEIC: Bài 26 - 30 (Vận hành, Bất động sản & Hợp đồng thuê) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 26 - 30 (Vận hành, Bất động sản & Hợp đồng thuê)', 'Vận hành & Tài sản: Bất động sản & Cơ sở vật chất (Property), Họp HĐQT & Ủy ban (Board Meetings), Kiểm định chất lượng (Quality Control), Phát triển sản phẩm (Product Dev), Thuê mướn mặt bằng (Leasing)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Adjacent', 'adj.', '', 'Kế liền, sát ngay'),
    ('Collaboration', 'n.', '', 'Sự cộng tác'),
    ('Concentrate', 'v.', '', 'Tập trung'),
    ('Conducive', 'adj.', '', 'Có ích, có lợi, góp phần'),
    ('Disrupt', 'v.', '', 'Quấy rối, phá vỡ'),
    ('Hamper', 'v.', '', 'Cản trở'),
    ('Inconsiderate', 'adj.', '', 'Thiếu quan tâm, bất lịch sự'),
    ('Lobby', 'n.', '', 'Phòng ngoài, hành lang'),
    ('Move up', 'v.', '', 'Tiến lên'),
    ('Open to', 'adj.', '', 'Cởi mở, dễ chấp nhận'),
    ('Opt', 'v.', '', 'Chọn lựa, chọn'),
    ('Scrutinize', 'v.', '', 'Nhìn kỹ, chăm chú'),
    ('Adhere to', 'v.', '', 'Tuân thủ'),
    ('Agenda', 'n.', '', 'Những vấn đề cần bàn trong cuộc họp'),
    ('Bring up', 'v.', '', 'Đưa ra (chủ đề)'),
    ('Conclude', 'v.', '', 'Kết thúc, chấm dứt'),
    ('Go ahead', 'v./n.', '', 'Cho phép, tiến hành'),
    ('Goal', 'n.', '', 'Mục tiêu, mục đích'),
    ('Lengthy', 'adj.', '', 'Dài dòng'),
    ('Matter', 'n.', '', 'Chủ đề, vấn đề'),
    ('Periodically', 'adv.', '', 'Một cách định kỳ'),
    ('Priority', 'n.', '', 'Quyền ưu tiên'),
    ('Progress', 'n./v.', '', 'Sự tiến tới, tiến bộ'),
    ('Waste', 'v./n.', '', 'Không giá trị, lãng phí'),
    ('Brand', 'n.', '', 'Nhãn hiệu (hàng hóa)'),
    ('Conform', 'v.', '', 'Làm cho phù hợp'),
    ('Defect', 'n.', '', 'Nhược điểm, khuyết điểm'),
    ('Enhance', 'v.', '', 'Làm tăng, nâng cao'),
    ('Garment', 'n.', '', 'Áo quần'),
    ('Inspect', 'v.', '', 'Xem xét kỹ, kiểm tra'),
    ('Perceive', 'v.', '', 'Nhận thấy, nhận biết'),
    ('Repel', 'v.', '', 'Đẩy đi xa, chống lại'),
    ('Take back', 'v.', '', 'Lấy lại'),
    ('Throw out', 'v.', '', 'Vứt bỏ'),
    ('Uniform', 'adj.', '', 'Không thay đổi về hình thức'),
    ('Wrinkle', 'n.', '', 'Vết nhăn, nếp nhăn'),
    ('Anxious', 'adj.', '', 'Lo âu, băn khoăn'),
    ('Ascertain', 'v.', '', 'Xác định'),
    ('Assume', 'v.', '', 'Cho rằng, thừa nhận'),
    ('Decade', 'n.', '', 'Thập kỷ'),
    ('Examine', 'v.', '', 'Xem xét chi tiết'),
    ('Experiment', 'v./n.', '', 'Làm thí nghiệm'),
    ('Logical', 'adj.', '', 'Hợp logic, hợp lý'),
    ('Research', 'n.', '', 'Nghiên cứu'),
    ('Responsibility', 'n.', '', 'Trách nhiệm'),
    ('Solve', 'v.', '', 'Giải quyết'),
    ('Supervisor', 'n.', '', 'Người giám sát'),
    ('Systematic', 'adj.', '', 'Có hệ thống'),
    ('Apprehensive', 'adj.', '', 'Sợ hãi, e sợ (về tương lai)'),
    ('Circumstance', 'n.', '', 'Hoàn cảnh, tình huống'),
    ('Condition', 'n.', '', 'Điều kiện'),
    ('Due to', 'prep.', '', 'Bởi vì'),
    ('Fluctuate', 'v.', '', 'Dao động, thay đổi bất thường'),
    ('Get out of', 'v.', '', 'Rời khỏi, thoát khỏi'),
    ('Indicator', 'n.', '', 'Người/vật chỉ dấu, dấu hiệu'),
    ('Lease', 'n./v.', '', 'Hợp đồng cho thuê'),
    ('Lock into', 'v.', '', 'Ràng buộc vào, không thể thay đổi'),
    ('Occupancy', 'n.', '', 'Sự cư ngụ'),
    ('Option', 'n.', '', 'Sự chọn lựa'),
    ('Subject to', 'adj.', '', 'Tùy thuộc vào')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 7: 600 TOEIC: Bài 31 - 35 (Nhà hàng, Ẩm thực & Dịch vụ Tiếp khách) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 31 - 35 (Nhà hàng, Ẩm thực & Dịch vụ Tiếp khách)', 'Nhà hàng & Dịch vụ khách hàng: Lựa chọn nhà hàng (Selecting Restaurant), Đi ăn ngoài (Eating Out), Gọi món (Ordering Food), Nấu nướng & Dinh dưỡng (Cooking), Tổ chức sự kiện & Khách sạn (Events)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Appeal', 'v.', '', 'Hấp dẫn'),
    ('Arrive', 'v.', '', 'Tới (một nơi)'),
    ('Compromise', 'n.', '', 'Thỏa hiệp'),
    ('Daring', 'adj.', '', 'Táo bạo, cả gan'),
    ('Familiar', 'adj.', '', 'Quen thuộc, thường thấy'),
    ('Guide', 'n.', '', 'Người chỉ dẫn'),
    ('Majority', 'n.', '', 'Phần lớn, đa số'),
    ('Mix', 'v./n.', '', 'Trộn, pha lẫn'),
    ('Rely', 'v.', '', 'Tin vào, dựa vào'),
    ('Secure', 'v.', '', 'Tìm được, đạt được'),
    ('Subjective', 'adj.', '', 'Chủ quan'),
    ('Suggest', 'v.', '', 'Đề nghị, giới thiệu'),
    ('Basic', 'adj.', '', 'Cơ bản'),
    ('Complete', 'adj.', '', 'Đầy đủ, trọn vẹn'),
    ('Excite', 'v.', '', 'Gây hứng thú'),
    ('Flavor', 'n.', '', 'Vị ngon, mùi vị'),
    ('Forget', 'v.', '', 'Hay quên'),
    ('Ingredient', 'n.', '', 'Thành phần'),
    ('Judge', 'v.', '', 'Đánh giá'),
    ('Mix-up', 'n./v.', '', 'Sự lộn xộn, nhầm lẫn'),
    ('Patron', 'n.', '', 'Khách hàng quen'),
    ('Predict', 'v.', '', 'Báo trước, nói trước'),
    ('Random', 'adj.', '', 'Ngẫu nhiên'),
    ('Remind', 'v.', '', 'Nhắc nhở'),
    ('Burdensome', 'adj.', '', 'Khó nhọc, phiền hà'),
    ('Common', 'adj.', '', 'Thông thường, phổ biến'),
    ('Delivery', 'n.', '', 'Sự phân phát, giao hàng'),
    ('Elegant', 'adj.', '', 'Thanh lịch, tao nhã'),
    ('Fall to', 'v.', '', 'Trở thành trách nhiệm của (ai)'),
    ('Impress', 'v.', '', 'Gây ấn tượng'),
    ('Individual', 'adj.', '', 'Thuộc về hoặc cho một người; riêng biệt'),
    ('List', 'n./v.', '', 'Danh sách'),
    ('Multiple', 'adj.', '', 'Nhiều, phức tạp'),
    ('Narrow', 'v./adj.', '', 'Thu hẹp'),
    ('Pick up', 'v.', '', 'Đón (ai đó)'),
    ('Settle', 'v.', '', 'Thanh toán, chọn lựa'),
    ('Accustom to', 'v.', '', 'Làm quen với'),
    ('Apprentice', 'n./v.', '', 'Người học việc, học nghề'),
    ('Culinary', 'adj.', '', 'Thuộc về bếp núc, nấu nướng'),
    ('Demanding', 'adj.', '', 'Đòi hỏi khắt khe'),
    ('Draw', 'v.', '', 'Lôi kéo, thu hút'),
    ('Incorporate', 'v.', '', 'Sáp nhập, hợp nhất'),
    ('Influx', 'n.', '', 'Sự chảy vào, dòng người đổ vào'),
    ('Method', 'n.', '', 'Phương pháp'),
    ('Outlet', 'n.', '', 'Chỗ thoát ra, lối thoát'),
    ('Profession', 'n.', '', 'Nghề nghiệp'),
    ('Relinquish', 'v.', '', 'Từ bỏ'),
    ('Theme', 'n.', '', 'Đề tài, chủ đề'),
    ('Assist', 'v.', '', 'Giúp đỡ, trợ giúp'),
    ('Coordinate', 'v.', '', 'Sắp xếp, sắp đặt'),
    ('Dimension', 'n.', '', 'Kích thước'),
    ('Exact', 'adj.', '', 'Chính xác'),
    ('General', 'adj.', '', 'Chung chung'),
    ('Ideal', 'adj.', '', 'Lý tưởng'),
    ('Lead time', 'n.', '', 'Thời gian giữa lúc bắt đầu và lúc hoàn thành dự án'),
    ('Plan', 'n./v.', '', 'Kế hoạch'),
    ('Proximity', 'n.', '', 'Sự gần gũi'),
    ('Regulation', 'n.', '', 'Quy tắc, điều lệ, sự điều chỉnh'),
    ('Site', 'n.', '', 'Chỗ, vị trí'),
    ('Stage', 'v.', '', 'Trình diễn, trưng bày')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 8: 600 TOEIC: Bài 36 - 40 (Du lịch, Máy bay, Tàu xe & Khách sạn) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 36 - 40 (Du lịch, Máy bay, Tàu xe & Khách sạn)', 'Du lịch & Đi lại công tác: Chuyến bay (Air Travel), Tàu hỏa & Xe buýt (Ground Transport), Lưu trú khách sạn (Hotels), Tham quan du lịch (Sightseeing), Dịch vụ thuê xe (Car Rentals)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Agency', 'n.', '', 'Đại lý'),
    ('Announcement', 'n.', '', 'Thông cáo'),
    ('Beverage', 'n.', '', 'Nước giải khát'),
    ('Blanket', 'n./v.', '', 'Mền, chăn'),
    ('Board', 'v.', '', 'Lên tàu'),
    ('Claim', 'v.', '', 'Đòi, yêu cầu nhận lại'),
    ('Delay', 'v./n.', '', 'Sự trì hoãn, chậm trễ'),
    ('Embark', 'v.', '', 'Lên tàu, bắt đầu'),
    ('Itinerary', 'n.', '', 'Sách hướng dẫn/ lộ trình du lịch'),
    ('Prohibit', 'v.', '', 'Ngăn chặn, cấm'),
    ('Valid', 'adj.', '', 'Hợp lệ, đúng đắn'),
    ('Depart', 'v.', '', 'Khởi hành, rời đi'),
    ('Deal with', 'v.', '', 'Giải quyết, xử lý'),
    ('Destination', 'n.', '', 'Nơi đến'),
    ('Distinguish', 'v.', '', 'Nhận ra, phân biệt'),
    ('Economical', 'adj.', '', 'Tiết kiệm'),
    ('Equivalent', 'adj.', '', 'Tương đương, bằng nhau'),
    ('Excursion', 'n.', '', 'Chuyến tham quan'),
    ('Expensive', 'adj.', '', 'Đắt tiền'),
    ('Extend', 'v.', '', 'Kéo dài, gia hạn'),
    ('Prospective', 'adj.', '', 'Về sau, sắp tới, tiềm năng'),
    ('Situation', 'n.', '', 'Tình huống, hoàn cảnh'),
    ('Substantial', 'adj.', '', 'Đáng kể, thực chất'),
    ('System', 'n.', '', 'Hệ thống'),
    ('Comprehensive', 'adj.', '', 'Bao gồm tất cả, toàn diện'),
    ('Deluxe', 'adj.', '', 'Sang trọng'),
    ('Directory', 'n.', '', 'Danh bạ'),
    ('Duration', 'n.', '', 'Khoảng thời gian mà một việc tồn tại'),
    ('Entitle', 'v.', '', 'Cho quyền (làm gì)'),
    ('Fare', 'n.', '', 'Tiền xe, tiền vé'),
    ('Offset', 'v.', '', 'Đền bù, bù đắp'),
    ('Operate', 'v.', '', 'Hoạt động'),
    ('Punctual', 'adj.', '', 'Đúng giờ'),
    ('Relatively', 'adv.', '', 'Vừa phải, tương đối'),
    ('Remainder', 'n.', '', 'Phần còn lại'),
    ('Remote', 'adj.', '', 'Xa xôi, cách biệt'),
    ('Advance', 'n.', '', 'Sự tiến lên, tiến bộ'),
    ('Chain', 'n.', '', 'Chuỗi các công việc kinh doanh do một người làm chủ'),
    ('Check in', 'v.', '', 'Đăng ký ở khách sạn'),
    ('Confirm', 'v.', '', 'Xác nhận'),
    ('Expect', 'v.', '', 'Mong đợi'),
    ('Housekeeper', 'n.', '', 'Quản gia'),
    ('Notify', 'v.', '', 'Thông báo, cho biết'),
    ('Preclude', 'v.', '', 'Ngăn cản'),
    ('Quote', 'v./n.', '', 'Trích dẫn, báo giá'),
    ('Rate', 'n.', '', 'Giá (cả)'),
    ('Reserve', 'v.', '', 'Để dành, đặt trước'),
    ('Service', 'n.', '', 'Sự giúp ích, dịch vụ'),
    ('Busy', 'adj.', '', 'Bận rộn'),
    ('Coincide', 'v.', '', 'Xảy ra đồng thời, trùng hợp'),
    ('Confusion', 'n.', '', 'Sự nhầm lẫn'),
    ('Contact', 'v.', '', 'Liên lạc với ai'),
    ('Disappoint', 'v.', '', 'Làm thất vọng'),
    ('Intend', 'v.', '', 'Định, dự định'),
    ('License', 'n.', '', 'Giấy phép, đăng ký'),
    ('Nervous', 'adj.', '', 'Lo lắng, hồi hộp'),
    ('Optional', 'adj.', '', 'Không bắt buộc'),
    ('Tempt', 'v.', '', 'Lôi cuốn'),
    ('Thrill', 'n.', '', 'Cái lôi cuốn, hấp dẫn, xúc động'),
    ('Tier', 'n.', '', 'Dãy, tầng, lớp')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 9: 600 TOEIC: Bài 41 - 45 (Giải trí, Âm nhạc, Bảo tàng & Truyền thông) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 41 - 45 (Giải trí, Âm nhạc, Bảo tàng & Truyền thông)', 'Văn hóa & Truyền thông: Điện ảnh (Movies), Kịch nghệ (Theater), Âm nhạc (Music), Viện bảo tàng (Museums), Báo chí & Truyền thông đại chúng (Media)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Attain', 'v.', '', 'Giành được, đạt được'),
    ('Combine', 'v.', '', 'Kết hợp, phối hợp'),
    ('Continue', 'v.', '', 'Tiếp tục'),
    ('Description', 'n.', '', 'Sự mô tả'),
    ('Disperse', 'v.', '', 'Phân tán'),
    ('Entertainment', 'n.', '', 'Sự giải trí'),
    ('Influence', 'v.', '', 'Ảnh hưởng, tác động'),
    ('Range', 'n.', '', 'Phạm vi, trình độ'),
    ('Release', 'v.', '', 'Phát hành'),
    ('Represent', 'v.', '', 'Đại diện cho'),
    ('Separate', 'adj.', '', 'Riêng biệt'),
    ('Successive', 'adj.', '', 'Lần lượt, liên tiếp'),
    ('Acting', 'n.', '', 'Diễn xuất'),
    ('Approach', 'v./n.', '', 'Đến gần, lại gần'),
    ('Audience', 'n.', '', 'Khán giả'),
    ('Create', 'v.', '', 'Tạo ra, sáng tạo'),
    ('Dialogue', 'n.', '', 'Đối thoại'),
    ('Element', 'n.', '', 'Yếu tố, chi tiết'),
    ('Experience', 'n./v.', '', 'Kinh nghiệm'),
    ('Occur', 'v.', '', 'Xảy ra, xuất hiện'),
    ('Perform', 'v.', '', 'Biểu diễn, trình diễn'),
    ('Rehearse', 'v.', '', 'Diễn tập'),
    ('Review', 'n./v.', '', 'Sự phê bình, lời phê bình'),
    ('Sold out', 'adj./v.', '', 'Bán hết'),
    ('Available', 'adj.', '', 'Sẵn sàng để dùng'),
    ('Broad', 'adj.', '', 'Bao la, mênh mông'),
    ('Category', 'n.', '', 'Hạng, loại'),
    ('Disparate', 'adj.', '', 'Khác loại, hoàn toàn khác biệt'),
    ('Divide', 'v.', '', 'Chia, phân ra'),
    ('Favorite', 'adj.', '', 'Được yêu thích nhất'),
    ('Instinct', 'n.', '', 'Bản năng'),
    ('Preference', 'n.', '', 'Sở thích, sự thích hơn'),
    ('Reason', 'n.', '', 'Lý do'),
    ('Relaxation', 'n.', '', 'Sự nghỉ ngơi'),
    ('Taste', 'n.', '', 'Sự thưởng thức, khả năng thẩm định'),
    ('Urge', 'v./n.', '', 'Thúc giục'),
    ('Acquire', 'v.', '', 'Thu được, giành được'),
    ('Admire', 'v.', '', 'Khâm phục, hâm mộ'),
    ('Collection', 'n.', '', 'Bộ sưu tầm'),
    ('Criticism', 'n.', '', 'Lời phê bình'),
    ('Express', 'v.', '', 'Hỏa tốc, nhanh chóng; bày tỏ'),
    ('Fashion', 'n.', '', 'Xu hướng thời trang'),
    ('Leisure', 'n.', '', 'Thời gian rỗi'),
    ('Respond', 'v.', '', 'Đáp lại, phản ứng lại'),
    ('Schedule', 'n./v.', '', 'Kế hoạch làm việc, thời gian biểu'),
    ('Significant', 'adj.', '', 'Có ý nghĩa, quan trọng'),
    ('Specialize', 'v.', '', 'Chuyên môn hóa'),
    ('Spectrum', 'n.', '', 'Dải quang phổ, phạm vi rộng'),
    ('Assignment', 'n./v.', '', 'Nhiệm vụ, công việc'),
    ('Choose', 'v.', '', 'Chọn lựa'),
    ('Constant', 'n.', '', 'Hằng số, điều không đổi'),
    ('Constitute', 'v.', '', 'Cấu thành, tạo thành'),
    ('Decisive', 'adj.', '', 'Kiên quyết, dứt khoát'),
    ('Disseminate', 'v.', '', 'Truyền bá, phổ biến'),
    ('Impact', 'n.', '', 'Sự tác động, ảnh hưởng'),
    ('In depth', 'adj.', '', 'Tỉ mỉ, cẩn thận'),
    ('Investigative', 'adj.', '', 'Thuộc về điều tra'),
    ('Link', 'n.', '', 'Mối liên hệ'),
    ('Subscribe', 'v.', '', 'Đặt mua báo, tạp chí'),
    ('Thorough', 'adj.', '', 'Kỹ lưỡng, thấu đáo')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;

-- ----------------------------------------------------
-- DECK 10: 600 TOEIC: Bài 46 - 50 (Y tế, Khám bệnh, Bảo hiểm & Nhà thuốc) (60 từ)
-- ----------------------------------------------------
WITH inserted_deck AS (
    INSERT INTO decks (name, description, quiz_practice_unlocked, reverse_practice_unlocked, listening_practice_unlocked, created_at, updated_at)
    VALUES ('600 TOEIC: Bài 46 - 50 (Y tế, Khám bệnh, Bảo hiểm & Nhà thuốc)', 'Chăm sóc y tế & Sức khỏe: Khám bác sĩ (Doctor''s Office), Nha khoa (Dentist), Bảo hiểm sức khỏe (Health Insurance), Bệnh viện điều trị (Hospitals), Dược phẩm & Nhà thuốc (Pharmacy)', false, false, false, NOW(), NOW())
    RETURNING id
),
raw_words (term, part_of_speech, phonetic, meaning) AS (
    VALUES
    ('Annual', 'adj.', '', 'Xảy ra hàng năm'),
    ('Appointment', 'n.', '', 'Cuộc hẹn'),
    ('Assess', 'v.', '', 'Ước định, định giá'),
    ('Diagnose', 'v.', '', 'Tiến hành chẩn đoán'),
    ('Effective', 'adj.', '', 'Có hiệu quả'),
    ('Instrument', 'n.', '', 'Dụng cụ, công cụ'),
    ('Manage', 'v.', '', 'Tìm cách xoay sở, quản lý'),
    ('Prevent', 'v.', '', 'Ngăn ngừa, tránh'),
    ('Recommend', 'v.', '', 'Đề nghị, giới thiệu'),
    ('Record', 'v./n.', '', 'Ghi lại'),
    ('Refer', 'v.', '', 'Tham khảo, giới thiệu'),
    ('Serious', 'adj.', '', 'Nghiêm trọng'),
    ('Aware', 'adj.', '', 'Có kiến thức về, ý thức được'),
    ('Catch up', 'v.', '', 'Bắt kịp, cập nhật'),
    ('Distraction', 'n.', '', 'Sự sao nhãng, đãng trí'),
    ('Encouragement', 'n.', '', 'Khích lệ, động viên'),
    ('Evident', 'adj.', '', 'Hiển nhiên, rõ ràng'),
    ('Habit', 'n.', '', 'Thói quen, tập quán'),
    ('Illuminate', 'v.', '', 'Chiếu sáng, rọi sáng'),
    ('Irritate', 'v.', '', 'Làm phát cáu, chọc tức'),
    ('Overview', 'n.', '', 'Khái quát, tổng quan'),
    ('Position', 'n.', '', 'Vị trí thích hợp'),
    ('Regularly', 'adv.', '', 'Một cách đều đặn'),
    ('Restore', 'v.', '', 'Phục hồi'),
    ('Allow', 'v.', '', 'Đồng ý, cho phép'),
    ('Alternative', 'n.', '', 'Sự lựa chọn giữa hai hay nhiều khả năng'),
    ('Aspect', 'n.', '', 'Diện mạo, khía cạnh'),
    ('Concern', 'v.', '', 'Bận tâm, lo lắng về'),
    ('Emphasize', 'v.', '', 'Nhấn mạnh'),
    ('Incur', 'v.', '', 'Gánh chịu, chịu lấy'),
    ('Personnel', 'n.', '', 'Cán bộ nhân viên'),
    ('Policy', 'n.', '', 'Chính sách, những điều khoản'),
    ('Portion', 'n.', '', 'Phần chia, khẩu phần'),
    ('Regardless', 'adv.', '', 'Bất chấp, không đếm xỉa'),
    ('Salary', 'n.', '', 'Lương'),
    ('Suitable', 'adj.', '', 'Phù hợp, thích hợp'),
    ('Admit', 'v.', '', 'Cho vào'),
    ('Authorization', 'n.', '', 'Sự cấp phép, cho phép'),
    ('Designate', 'v.', '', 'Được chỉ định'),
    ('Escort', 'n.', '', 'Vệ sĩ, đội hộ tống'),
    ('Identify', 'v.', '', 'Nhận dạng, nhận biết'),
    ('Missing', 'n.', '', 'Mất tích, vắng mặt'),
    ('Permit', 'v.', '', 'Cho phép'),
    ('Pertinent', 'adj.', '', 'Thích đáng, thích hợp'),
    ('Procedure', 'n.', '', 'Thủ tục'),
    ('Result', 'n.', '', 'Kết quả'),
    ('Statement', 'n.', '', 'Sự trình bày, hóa đơn'),
    ('Usual', 'adj.', '', 'Thông thường'),
    ('Consult', 'v.', '', 'Hỏi ý kiến, tham khảo'),
    ('Control', 'v.', '', 'Có quyền hành với ai, kiểm soát'),
    ('Convenient', 'adj.', '', 'Tiện lợi, thuận tiện'),
    ('Detect', 'v.', '', 'Phát hiện ra, khám phá'),
    ('Factor', 'n.', '', 'Nhân tố'),
    ('Interaction', 'n.', '', 'Sự ảnh hưởng lẫn nhau'),
    ('Limit', 'n.', '', 'Giới hạn'),
    ('Monitor', 'v.', '', 'Theo dõi, nắm được'),
    ('Potential', 'adj.', '', 'Tiềm năng, tiềm tàng'),
    ('Sample', 'n.', '', 'Mẫu, vật mẫu'),
    ('Sense', 'n.', '', 'Khả năng phán đoán'),
    ('Volunteer', 'n./v.', '', 'Người tình nguyện')
),
inserted_words AS (
    INSERT INTO words (deck_id, term, part_of_speech, phonetic, meaning, created_at, updated_at)
    SELECT d.id, rw.term, rw.part_of_speech, rw.phonetic, rw.meaning, NOW(), NOW()
    FROM raw_words rw, inserted_deck d
    RETURNING id, deck_id
),
ins_quiz_prog AS (
    INSERT INTO word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
),
ins_rev_prog AS (
    INSERT INTO reverse_word_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
    SELECT iw.id, iw.deck_id, 10, 0, 0, NOW(), NOW()
    FROM inserted_words iw
)
INSERT INTO listening_progress (word_id, deck_id, weight, correct_count, wrong_count, created_at, updated_at)
SELECT iw.id, iw.deck_id, 5, 0, 0, NOW(), NOW()
FROM inserted_words iw;
