/**
 * Helper chuẩn hóa và xử lý dữ liệu cho tính năng Nghe Chép Chính Tả (TOEIC Dictation)
 */

export const APOSTROPHE_REGEX = /['’‘ˈʼ`´ʻ‛\u0027\u2018\u2019\u02C8\u02BC\u00B4\u02BB\u201B]/g;

/**
 * Chuẩn hóa 1 từ:
 * - Chuyển chữ thường
 * - Loại bỏ toàn bộ các loại dấu nháy đơn (it's -> its, haven't -> havent, we're -> were)
 * - Loại bỏ toàn bộ dấu câu và ký tự đặc biệt
 */
export const normalizeWord = (w) => {
  if (!w) return '';
  return w
    .toLowerCase()
    .replace(APOSTROPHE_REGEX, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
};

/**
 * Chuẩn hóa cả câu: loại bỏ dấu câu, dấu nháy, khoảng trắng dư thừa
 * Đảm bảo chấm chính tả không quan tâm dấu câu (Punctuation-insensitive)
 */
export const normalizeSentence = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(APOSTROPHE_REGEX, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * So khớp 1 từ giữa người dùng nhập và từ gốc của câu:
 * - Khớp chính xác (sau khi bỏ dấu câu)
 * - Hỗ trợ dung sai số ít/số nhiều (ví dụ: người dùng nghe 'signer' nhưng từ gốc là 'signers' hoặc ngược lại)
 */
export const matchWord = (userWord, targetWord) => {
  const u = normalizeWord(userWord);
  const t = normalizeWord(targetWord);
  if (!u || !t) return false;
  
  // 1. Khớp chính xác
  if (u === t) return true;

  // 2. Dung sai số ít / số nhiều (thường gặp khi nghe âm đuôi 's' / 'es')
  if (u + 's' === t || u + 'es' === t || u === t + 's' || u === t + 'es') {
    return true;
  }

  return false;
};

/**
 * Tính điểm cho 1 câu nghe chép chính tả (thang điểm 100):
 * - Mỗi từ có trọng số cơ bản: wordWeight = 100 / totalWords
 * - Gợi ý từ đó (hint): coi như sai nguyên từ đó (0 điểm cho từ đó)
 * - Gõ sai từ đó (wrong attempts): mỗi lần gõ sai trừ 35% giá trị từ đó (tối đa mất 100%)
 * - Nghe lại audio: Mỗi lần nghe lại (từ lần nghe thứ 2 trở đi) bị trừ 5 điểm (lần nghe đầu tiên miễn phí)
 */
export function calculateSentenceScore(totalWords, wrongAttempts = {}, hintedWords = {}, replaysCount = 0) {
  if (!totalWords || totalWords <= 0) return 100;

  const wordWeight = 100 / totalWords;
  let totalScore = 0;

  for (let i = 0; i < totalWords; i++) {
    // 1. Gợi ý từ đó -> coi như sai nguyên từ đó (0 điểm)
    if (hintedWords && hintedWords[i]) {
      continue;
    }

    // 2. Gõ sai từ đó -> trừ điểm theo số lần sai (mỗi lần trừ 35% giá trị của từ)
    const mistakes = (wrongAttempts && wrongAttempts[i]) || 0;
    if (mistakes > 0) {
      const penaltyRatio = Math.min(1, mistakes * 0.35);
      const wordScore = Math.max(0, wordWeight * (1 - penaltyRatio));
      totalScore += wordScore;
    } else {
      totalScore += wordWeight;
    }
  }

  // 3. Trừ điểm nghe lại: mỗi lần nghe lại trừ 5 điểm (không thể âm dưới 0)
  const replayPenalty = Math.max(0, replaysCount || 0) * 5;
  const finalScore = Math.max(0, totalScore - replayPenalty);

  return Math.min(100, Math.max(0, Math.round(finalScore)));
}

/**
 * Phân loại mức điểm và màu sắc theo yêu cầu:
 * - 90 -> 100 điểm: Perfect -> Màu xanh lá (emerald)
 * - 60 -> dưới 90 điểm: Medium -> Màu vàng (amber)
 * - Dưới 60 điểm: Cần cố gắng -> Màu đỏ (rose)
 */
export function getScoreTier(score) {
  const numericScore = typeof score === 'number' ? score : 0;
  if (numericScore >= 90) {
    return {
      tier: 'perfect',
      label: 'Perfect',
      color: 'emerald',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500',
      btnBg: 'bg-emerald-950/80',
      btnBorder: 'border-emerald-500/80',
      btnText: 'text-emerald-300',
      hex: '#10b981'
    };
  }
  if (numericScore >= 60) {
    return {
      tier: 'medium',
      label: 'Medium',
      color: 'amber',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500',
      btnBg: 'bg-amber-950/80',
      btnBorder: 'border-amber-500/80',
      btnText: 'text-amber-300',
      hex: '#f59e0b'
    };
  }
  return {
    tier: 'low',
    label: 'Cần cố gắng',
    color: 'rose',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500',
    btnBg: 'bg-rose-950/80',
    btnBorder: 'border-rose-500/80',
    btnText: 'text-rose-300',
    hex: '#f43f5e'
  };
}

/**
 * Danh sách viết tắt thường gặp để bảo vệ tránh tách nhầm câu
 */
const ABBREVIATIONS_MAP = [
  [/\bA\.M\./gi, 'A_M_'],
  [/\bP\.M\./gi, 'P_M_'],
  [/\bMr\./gi, 'Mr_'],
  [/\bMs\./gi, 'Ms_'],
  [/\bMrs\./gi, 'Mrs_'],
  [/\bDr\./gi, 'Dr_'],
  [/\bNo\./gi, 'No_'],
  [/\bSt\./gi, 'St_'],
  [/\be\.g\./gi, 'eg_'],
  [/\bi\.e\./gi, 'ie_'],
  [/\betc\./gi, 'etc_']
];

export const protectAbbreviations = (text) => {
  let result = text;
  for (const [regex, replacement] of ABBREVIATIONS_MAP) {
    result = result.replace(regex, replacement);
  }
  return result;
};

export const restoreAbbreviations = (text) => {
  return text
    .replace(/A_M_/g, 'A.M.')
    .replace(/P_M_/g, 'P.M.')
    .replace(/Mr_/g, 'Mr.')
    .replace(/Ms_/g, 'Ms.')
    .replace(/Mrs_/g, 'Mrs.')
    .replace(/Dr_/g, 'Dr.')
    .replace(/No_/g, 'No.')
    .replace(/St_/g, 'St.')
    .replace(/eg_/g, 'e.g.')
    .replace(/ie_/g, 'i.e.')
    .replace(/etc_/g, 'etc.');
};

/**
 * Tách một câu đơn dài (> 9 từ) thành các cụm (thought groups) tự nhiên từ 4 đến 8 từ (tối đa 9 từ)
 * Dựa trên cấu trúc ngữ pháp:
 * 1. Dấu câu trong câu (, ; : — –)
 * 2. Liên từ chính (and, but, or, so, because, although, while, if, when, that, which, who...)
 * 3. Động từ nguyên mẫu (to + verb)
 * 4. Cụm giới từ (with, about, for, from, into, without, before, after...)
 */
export function splitSingleSentence(sentence, maxWords = 9, minWords = 4) {
  const cleanSent = sentence.trim();
  if (!cleanSent) return [];

  const tokens = cleanSent.split(/\s+/).filter(Boolean);
  if (tokens.length <= maxWords) {
    return [cleanSent];
  }

  const n = tokens.length;
  const isPunctuationEnd = (word) => /[,;:—–]$/.test(word);
  const isMajorConj = (word) => /^(and|but|or|so|because|although|though|since|while|if|when|where|unless|that|which|who|whom)$/i.test(word.replace(/^[^\w]+|[^\w]+$/g, ''));
  const isMinorPrep = (word) => /^(with|about|for|from|into|without|before|after|during|through|as)$/i.test(word.replace(/^[^\w]+|[^\w]+$/g, ''));
  const isInfinitive = (w1, w2) => /^to$/i.test(w1) && w2 && /^[a-z]{3,}/i.test(w2);

  const candidateScores = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const prevWord = tokens[i - 1];
    const currWord = tokens[i];
    const nextWord = tokens[i + 1];

    if (isPunctuationEnd(prevWord)) {
      candidateScores[i] += 100;
    }
    if (isMajorConj(currWord)) {
      candidateScores[i] += 80;
    } else if (isInfinitive(currWord, nextWord)) {
      candidateScores[i] += 60;
    } else if (isMinorPrep(currWord)) {
      candidateScores[i] += 40;
    }
  }

  const chunks = [];
  let startIdx = 0;

  while (startIdx < n) {
    const remaining = n - startIdx;
    if (remaining <= maxWords) {
      chunks.push(tokens.slice(startIdx, n).join(' '));
      break;
    }

    let bestCut = -1;
    let bestScore = -1000;

    const minCut = startIdx + minWords;
    const maxCut = Math.min(n - minWords, startIdx + maxWords);

    if (minCut <= maxCut) {
      for (let i = minCut; i <= maxCut; i++) {
        let score = candidateScores[i] * 10;
        const len = i - startIdx;
        const idealDiff = Math.abs(len - 6.5);
        score -= idealDiff * 5;

        if (score > bestScore) {
          bestScore = score;
          bestCut = i;
        }
      }
    }

    if (bestCut === -1) {
      if (remaining <= maxWords + minWords - 1) {
        bestCut = startIdx + Math.floor(remaining / 2);
      } else {
        bestCut = Math.min(n - minWords, startIdx + maxWords);
      }
    }

    chunks.push(tokens.slice(startIdx, bestCut).join(' '));
    startIdx = bestCut;
  }

  return chunks;
}

/**
 * Tách một văn bản thành các câu/cụm ngắn vừa vặn (5 - 8 từ, tối đa 9 từ)
 * Không bao giờ gộp cắt chéo qua dấu kết thúc câu (. ! ?)
 */
export function splitTextIntoBiteChunks(text, maxWords = 9, minWords = 4) {
  if (!text) return [];
  const clean = text.replace(/[\u02C8\u02BC]/g, "'").replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const protectedText = protectAbbreviations(clean);
  const rawSentences = protectedText.match(/[^.!?]+[.!?]*/g) || [protectedText];
  const allChunks = [];

  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const restored = restoreAbbreviations(trimmed);
    const chunks = splitSingleSentence(restored, maxWords, minWords);
    allChunks.push(...chunks);
  }

  return allChunks;
}

/**
 * Tách và trích xuất danh sách câu/cụm ngắn nghe chép chính tả từ Part 1, 2, 3, 4 của đề thi TOEIC
 * Đảm bảo mỗi mục nghe có độ dài lý tưởng 5 - 8 từ (tối đa 9 từ) phù hợp dung lượng trí nhớ làm việc.
 */
export function extractDictationSentences(testData) {
  const list = [];
  if (!testData) return list;

  const sanitizeText = (t) => (t || '').replace(/[\u02C8\u02BC]/g, "'").trim();

  // 1. Part 1: Photographs (4 câu miêu tả tranh)
  if (testData.part1?.transcript) {
    const p1 = testData.part1;
    const correctOpt = p1.correctAnswer;
    Object.entries(p1.transcript).forEach(([key, text]) => {
      const isCorrect = key === correctOpt;
      const clean = sanitizeText(text);
      const chunks = splitTextIntoBiteChunks(clean, 9, 4);

      if (chunks.length <= 1) {
        list.push({
          id: `p1-${key}`,
          part: 1,
          partLabel: 'Part 1: Photographs',
          badge: `Part 1 • Lựa chọn (${key})${isCorrect ? ' [Đáp án đúng]' : ''}`,
          contextHint: 'Nhìn tranh và nghe câu miêu tả hình ảnh',
          imageUrl: p1.imageUrl || p1.bwImageUrl || null,
          text: chunks[0] || clean,
          audioText: chunks[0] || clean,
          isCorrectOption: isCorrect
        });
      } else {
        chunks.forEach((chunk, cIdx) => {
          list.push({
            id: `p1-${key}-${cIdx + 1}`,
            part: 1,
            partLabel: 'Part 1: Photographs',
            badge: `Part 1 • Lựa chọn (${key}) [${cIdx + 1}/${chunks.length}]${isCorrect ? ' [Đáp án đúng]' : ''}`,
            contextHint: `Nhìn tranh và nghe câu miêu tả hình ảnh (${key}) - Phần ${cIdx + 1}/${chunks.length}`,
            imageUrl: p1.imageUrl || p1.bwImageUrl || null,
            text: chunk,
            audioText: chunk,
            isCorrectOption: isCorrect
          });
        });
      }
    });
  }

  // 2. Part 2: Question-Response (Spoken Question + 3 Choices)
  if (Array.isArray(testData.part2)) {
    testData.part2.forEach((q) => {
      if (q.spokenQuestion) {
        const clean = sanitizeText(q.spokenQuestion);
        const qChunks = splitTextIntoBiteChunks(clean, 9, 4);
        if (qChunks.length <= 1) {
          list.push({
            id: `p2-q${q.questionNumber}-question`,
            part: 2,
            partLabel: 'Part 2: Question-Response',
            badge: `Part 2 • Câu ${q.questionNumber} [Câu hỏi Audio]`,
            contextHint: `Nghe và chép lại câu hỏi số ${q.questionNumber}`,
            text: qChunks[0] || clean,
            audioText: qChunks[0] || clean
          });
        } else {
          qChunks.forEach((chunk, cIdx) => {
            list.push({
              id: `p2-q${q.questionNumber}-question-${cIdx + 1}`,
              part: 2,
              partLabel: 'Part 2: Question-Response',
              badge: `Part 2 • Câu ${q.questionNumber} [Câu hỏi - Phần ${cIdx + 1}/${qChunks.length}]`,
              contextHint: `Nghe và chép lại câu hỏi số ${q.questionNumber} (Phần ${cIdx + 1}/${qChunks.length})`,
              text: chunk,
              audioText: chunk
            });
          });
        }
      }

      if (q.transcript) {
        Object.entries(q.transcript).forEach(([key, text]) => {
          const isCorrect = key === q.correctAnswer;
          const clean = sanitizeText(text);
          const optChunks = splitTextIntoBiteChunks(clean, 9, 4);
          if (optChunks.length <= 1) {
            list.push({
              id: `p2-q${q.questionNumber}-opt-${key}`,
              part: 2,
              partLabel: 'Part 2: Question-Response',
              badge: `Part 2 • Câu ${q.questionNumber} [Lựa chọn ${key}]${isCorrect ? ' [Đáp án đúng]' : ''}`,
              contextHint: `Lựa chọn phản hồi (${key}) cho câu ${q.questionNumber}`,
              text: optChunks[0] || clean,
              audioText: optChunks[0] || clean,
              isCorrectOption: isCorrect
            });
          } else {
            optChunks.forEach((chunk, cIdx) => {
              list.push({
                id: `p2-q${q.questionNumber}-opt-${key}-${cIdx + 1}`,
                part: 2,
                partLabel: 'Part 2: Question-Response',
                badge: `Part 2 • Câu ${q.questionNumber} [Lựa chọn ${key} - Phần ${cIdx + 1}/${optChunks.length}]${isCorrect ? ' [Đáp án đúng]' : ''}`,
                contextHint: `Lựa chọn phản hồi (${key}) cho câu ${q.questionNumber} (Phần ${cIdx + 1}/${optChunks.length})`,
                text: chunk,
                audioText: chunk,
                isCorrectOption: isCorrect
              });
            });
          }
        });
      }
    });
  }

  // 3. Part 3: Short Conversations (Đoạn hội thoại đối đáp nam/nữ)
  if (Array.isArray(testData.part3) && testData.part3.length > 0) {
    const rawTranscript = testData.part3[0].transcript || '';
    
    // Tách các lượt nói theo tag [M] hoặc [W]
    // Hỗ trợ cả trường hợp trên cùng một dòng hoặc nhiều dòng
    const turns = rawTranscript
      .split(/(?=\[(?:M|W|Man|Woman)\])/i)
      .map(t => t.trim())
      .filter(Boolean);

    let turnCount = 0;
    turns.forEach((turn) => {
      // Bỏ số trang/số câu thừa nếu có ở đầu block
      const cleanTurn = turn.replace(/^\d+\s*/, '').trim();
      if (!cleanTurn) return;

      let speaker = '';
      let speakerName = 'Người nói';
      let content = cleanTurn;

      if (/^\[M\]/i.test(cleanTurn)) {
        speaker = '[M]';
        speakerName = 'Người đàn ông (Man)';
        content = cleanTurn.replace(/^\[M\]\s*/i, '').trim();
      } else if (/^\[W\]/i.test(cleanTurn)) {
        speaker = '[W]';
        speakerName = 'Người phụ nữ (Woman)';
        content = cleanTurn.replace(/^\[W\]\s*/i, '').trim();
      } else if (cleanTurn.toLowerCase().includes('conversation') || cleanTurn.toLowerCase().includes('questions')) {
        speakerName = 'Người dẫn (Narrator)';
      }

      if (!content) return;
      turnCount++;

      const chunks = splitTextIntoBiteChunks(content, 9, 4);
      chunks.forEach((chunk, cIdx) => {
        const cleanChunk = sanitizeText(chunk);
        if (!cleanChunk) return;

        const subLabel = chunks.length > 1 ? `.${cIdx + 1}` : '';
        list.push({
          id: `p3-turn-${turnCount}-${cIdx + 1}`,
          part: 3,
          partLabel: 'Part 3: Conversations',
          badge: `Part 3 • Lượt ${turnCount}${subLabel} (${speakerName})`,
          speaker: speaker,
          speakerName: speakerName,
          contextHint: `Hội thoại Part 3 - ${speakerName}${chunks.length > 1 ? ` (Phần ${cIdx + 1}/${chunks.length})` : ''}`,
          text: cleanChunk,
          audioText: cleanChunk
        });
      });
    });
  }

  // 4. Part 4: Short Talks (Bài nói ngắn / Thông báo / Hướng dẫn)
  if (Array.isArray(testData.part4) && testData.part4.length > 0) {
    let rawTranscript = testData.part4[0].transcript || '';
    if (rawTranscript.includes('\n\nBARRO')) {
      rawTranscript = rawTranscript.split('\n\nBARRO')[0];
    }

    const chunks = splitTextIntoBiteChunks(rawTranscript, 9, 4);
    chunks.forEach((chunk, cIdx) => {
      const cleanChunk = sanitizeText(chunk);
      if (!cleanChunk) return;

      list.push({
        id: `p4-chunk-${cIdx + 1}`,
        part: 4,
        partLabel: 'Part 4: Short Talks',
        badge: `Part 4 • Câu ${cIdx + 1}/${chunks.length}`,
        contextHint: `Bài nói / Độc thoại Part 4 (Câu ${cIdx + 1}/${chunks.length})`,
        text: cleanChunk,
        audioText: cleanChunk
      });
    });
  }

  return list;
}
