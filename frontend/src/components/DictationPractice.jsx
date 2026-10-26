import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Volume2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Lightbulb,
  Keyboard,
  ListFilter,
  Check,
  Zap,
  VolumeX,
  Play,
  Pause,
  Layers,
  ArrowRight,
  BookOpen,
  AlertCircle,
  Award,
  LayoutGrid,
  List,
  Trash2,
  Image as ImageIcon,
  HelpCircle,
  MessageSquare,
  Mic,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';

import {
  normalizeWord,
  normalizeSentence,
  matchWord,
  extractDictationSentences,
  calculateSentenceScore,
  getScoreTier
} from '../utils/dictationHelper';

// Key định danh lưu tiến độ Dictation trong LocalStorage theo từng bài Lesson
const getStorageKey = (lId) => `toeic_dictation_progress_lesson_${lId}`;

// Đọc dữ liệu tiến độ từ LocalStorage một cách an toàn
const loadLocalProgress = (lId) => {
  if (typeof window === 'undefined' || !lId) return {};
  try {
    const raw = localStorage.getItem(getStorageKey(lId));
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) {
    console.error('Error reading dictation progress from localStorage:', e);
    return {};
  }
};

// Lưu dữ liệu tiến độ 2 tầng: Lưu ngay vào LocalStorage và đồng bộ lên Backend PostgreSQL
const saveProgressToStorageAndApi = async (lId, sentId, partNum, data) => {
  if (!lId || !sentId) return;

  // 1. Lưu ngay lập tức vào LocalStorage để không bị trễ UI
  try {
    const key = getStorageKey(lId);
    let currentData = {};
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        currentData = JSON.parse(raw) || {};
      } catch (e) {}
    }
    currentData[sentId] = {
      lessonId: lId,
      sentenceId: sentId,
      part: partNum,
      isCompleted: !!data.isCompleted,
      score: typeof data.score === 'number' ? data.score : 0,
      userInput: data.userInput || '',
      hintsCount: data.hintsCount || 0,
      listenCount: typeof data.listenCount === 'number' ? data.listenCount : 0,
      wrongAttempts: data.wrongAttempts || {},
      hintedWords: data.hintedWords || {},
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(currentData));
  } catch (e) {
    console.error('Error saving dictation progress to localStorage:', e);
  }

  // 2. Gửi request đồng bộ lên backend Spring Boot (PostgreSQL)
  try {
    await fetch(`/api/lesson-practice/dictation/${lId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: lId,
        sentenceId: sentId,
        part: partNum,
        isCompleted: !!data.isCompleted,
        score: typeof data.score === 'number' ? data.score : 0,
        userInput: data.userInput || '',
        hintsCount: data.hintsCount || 0,
        listenCount: typeof data.listenCount === 'number' ? data.listenCount : 0,
        wrongAttempts: data.wrongAttempts || {},
        hintedWords: data.hintedWords || {}
      })
    });
  } catch (err) {
    console.warn('Error saving dictation progress to backend:', err);
  }
};

export default function DictationPractice({ testData, lessonId, onBackToTest }) {
  // Trích xuất toàn bộ câu của bài Test
  const sentences = useMemo(() => extractDictationSentences(testData), [testData]);

  // Bộ lọc phần nghe (Tất cả, Part 1, Part 2, Part 3, Part 4)
  const [activePartFilter, setActivePartFilter] = useState('all');

  // Bộ lọc trạng thái câu nghe ('all', 'completed', 'uncompleted', 'perfect', 'medium', 'low')
  const [statusFilter, setStatusFilter] = useState('all');

  // Chế độ xem danh sách câu: 'grid' (dạng ô lưới) | 'list' (dạng danh sách chi tiết)
  const [viewMode, setViewMode] = useState('grid');

  // Danh sách câu theo bộ lọc phần thi
  const filteredSentences = useMemo(() => {
    if (activePartFilter === 'all') return sentences;
    const partNum = parseInt(activePartFilter, 10);
    return sentences.filter((s) => s.part === partNum);
  }, [sentences, activePartFilter]);

  // Chỉ mục câu hiện tại đang luyện trong filteredSentences
  const [currentIndex, setCurrentIndex] = useState(0);

  // Dữ liệu nhập của người dùng cho từng câu { [sentenceId]: text }
  const [userInputs, setUserInputs] = useState(() => {
    const local = loadLocalProgress(lessonId);
    const map = {};
    Object.values(local).forEach((item) => {
      if (item?.sentenceId && item.userInput) map[item.sentenceId] = item.userInput;
    });
    return map;
  });

  // Trạng thái đã hoàn thành của từng câu { [sentenceId]: boolean }
  const [completedMap, setCompletedMap] = useState(() => {
    const local = loadLocalProgress(lessonId);
    const map = {};
    Object.values(local).forEach((item) => {
      if (item?.sentenceId && item.isCompleted) map[item.sentenceId] = true;
    });
    return map;
  });

  // Số từ đã dùng gợi ý của từng câu { [sentenceId]: count }
  const [hintsCountMap, setHintsCountMap] = useState(() => {
    const local = loadLocalProgress(lessonId);
    const map = {};
    Object.values(local).forEach((item) => {
      if (item?.sentenceId && typeof item.hintsCount === 'number') map[item.sentenceId] = item.hintsCount;
    });
    return map;
  });

  // Điểm số đã đạt được của từng câu { [sentenceId]: number }
  const [sentenceScoresMap, setSentenceScoresMap] = useState(() => {
    const local = loadLocalProgress(lessonId);
    const map = {};
    Object.values(local).forEach((item) => {
      if (item?.sentenceId && typeof item.score === 'number') map[item.sentenceId] = item.score;
    });
    return map;
  });

  // Số lần gõ sai cho từng từ của từng câu { [sentenceId]: { [wordIndex]: number } }
  const [wrongAttemptsMap, setWrongAttemptsMap] = useState(() => {
    const local = loadLocalProgress(lessonId);
    const map = {};
    Object.values(local).forEach((item) => {
      if (item?.sentenceId && item.wrongAttempts) map[item.sentenceId] = item.wrongAttempts;
    });
    return map;
  });

  // Danh sách các từ đã dùng gợi ý (mất điểm hoàn toàn từ đó) { [sentenceId]: { [wordIndex]: boolean } }
  const [hintedWordsMap, setHintedWordsMap] = useState(() => {
    const local = loadLocalProgress(lessonId);
    const map = {};
    Object.values(local).forEach((item) => {
      if (item?.sentenceId && item.hintedWords) map[item.sentenceId] = item.hintedWords;
    });
    return map;
  });

  // Số lần nghe audio của từng câu { [sentenceId]: count } (Lần 1 miễn phí, từ lần 2 trừ 5đ/lần nghe lại)
  const [listenCountsMap, setListenCountsMap] = useState(() => {
    const local = loadLocalProgress(lessonId);
    const map = {};
    Object.values(local).forEach((item) => {
      if (item?.sentenceId && typeof item.listenCount === 'number') map[item.sentenceId] = item.listenCount;
    });
    return map;
  });

  // Đồng bộ hai chiều với LocalStorage và Backend API khi lessonId thay đổi hoặc reload trang
  useEffect(() => {
    if (!lessonId) return;

    // 1. Tải trước từ LocalStorage để render tức thì 0ms
    const local = loadLocalProgress(lessonId);
    const nCompleted = {};
    const nScores = {};
    const nInputs = {};
    const nHints = {};
    const nListenCounts = {};
    const nWrongs = {};
    const nHintedWords = {};

    Object.values(local).forEach((item) => {
      if (!item?.sentenceId) return;
      if (item.isCompleted) nCompleted[item.sentenceId] = true;
      if (typeof item.score === 'number') nScores[item.sentenceId] = item.score;
      if (item.userInput) nInputs[item.sentenceId] = item.userInput;
      if (typeof item.hintsCount === 'number') nHints[item.sentenceId] = item.hintsCount;
      if (typeof item.listenCount === 'number') nListenCounts[item.sentenceId] = item.listenCount;
      if (item.wrongAttempts) nWrongs[item.sentenceId] = item.wrongAttempts;
      if (item.hintedWords) nHintedWords[item.sentenceId] = item.hintedWords;
    });

    setCompletedMap(nCompleted);
    setSentenceScoresMap(nScores);
    setUserInputs(nInputs);
    setHintsCountMap(nHints);
    setListenCountsMap(nListenCounts);
    setWrongAttemptsMap(nWrongs);
    setHintedWordsMap(nHintedWords);

    // 2. Tải tiến độ vĩnh viễn từ Spring Boot Backend API
    let isMounted = true;
    const fetchBackendProgress = async () => {
      try {
        const res = await fetch(`/api/lesson-practice/dictation/${lessonId}`);
        if (!res.ok) return;
        const list = await res.json();
        if (!Array.isArray(list) || !isMounted) return;

        const apiCompleted = {};
        const apiScores = {};
        const apiInputs = {};
        const apiHints = {};
        const apiListenCounts = {};
        const apiWrongs = {};
        const apiHintedWords = {};
        const mergedForLocal = { ...loadLocalProgress(lessonId) };

        list.forEach((item) => {
          if (!item.sentenceId) return;
          if (item.isCompleted) apiCompleted[item.sentenceId] = true;
          if (typeof item.score === 'number') apiScores[item.sentenceId] = item.score;
          if (item.userInput) apiInputs[item.sentenceId] = item.userInput;
          if (typeof item.hintsCount === 'number') apiHints[item.sentenceId] = item.hintsCount;
          if (typeof item.listenCount === 'number') apiListenCounts[item.sentenceId] = item.listenCount;
          if (item.wrongAttempts) apiWrongs[item.sentenceId] = item.wrongAttempts;
          if (item.hintedWords) apiHintedWords[item.sentenceId] = item.hintedWords;

          mergedForLocal[item.sentenceId] = {
            lessonId,
            sentenceId: item.sentenceId,
            part: item.part,
            isCompleted: item.isCompleted,
            score: item.score,
            userInput: item.userInput,
            hintsCount: item.hintsCount,
            listenCount: typeof item.listenCount === 'number' ? item.listenCount : 0,
            wrongAttempts: item.wrongAttempts,
            hintedWords: item.hintedWords
          };
        });

        // Hợp nhất dữ liệu backend vào state
        setCompletedMap((prev) => ({ ...apiCompleted, ...prev }));
        setSentenceScoresMap((prev) => ({ ...apiScores, ...prev }));
        setUserInputs((prev) => ({ ...apiInputs, ...prev }));
        setHintsCountMap((prev) => ({ ...apiHints, ...prev }));
        setListenCountsMap((prev) => ({ ...apiListenCounts, ...prev }));
        setWrongAttemptsMap((prev) => ({ ...apiWrongs, ...prev }));
        setHintedWordsMap((prev) => ({ ...apiHintedWords, ...prev }));

        // Cập nhật lại localStorage để luôn đồng bộ nhất quán
        try {
          localStorage.setItem(getStorageKey(lessonId), JSON.stringify(mergedForLocal));
        } catch (e) {}
      } catch (err) {
        console.warn('Backend dictation progress fetch error:', err);
      }
    };

    fetchBackendProgress();

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  // Refs lưu trữ giá trị mới nhất để tránh stale closures
  const completedMapRef = useRef(completedMap);
  completedMapRef.current = completedMap;

  const listenCountsMapRef = useRef(listenCountsMap);
  listenCountsMapRef.current = listenCountsMap;

  const wrongAttemptsMapRef = useRef(wrongAttemptsMap);
  wrongAttemptsMapRef.current = wrongAttemptsMap;

  const hintedWordsMapRef = useRef(hintedWordsMap);
  hintedWordsMapRef.current = hintedWordsMap;

  // Theo dõi token sai gần nhất đã được ghi nhận lỗi cho từng vị trí từ { [sentenceId]: { [wordIndex]: string } }
  const lastEvaluatedWrongTokensRef = useRef({});

  // Tốc độ phát audio Web Speech API (0.8x, 1.0x, 1.2x)
  const [speechRate, setSpeechRate] = useState(0.9);

  // Tự động phát khi đổi câu
  const [autoPlay, setAutoPlay] = useState(true);

  // Đang phát âm thanh
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Input ref để auto focus
  const inputRef = useRef(null);

  // Câu hiện tại
  const currentSentence = filteredSentences[currentIndex] || null;
  const currentSentenceId = currentSentence?.id;
  const isCurrentCompleted = currentSentenceId ? !!completedMap[currentSentenceId] : false;
  const currentInput = currentSentenceId ? userInputs[currentSentenceId] || '' : '';

  // Đảm bảo currentIndex hợp lệ khi đổi bộ lọc
  useEffect(() => {
    if (currentIndex >= filteredSentences.length) {
      setCurrentIndex(0);
    }
  }, [filteredSentences, currentIndex]);

  // Phát âm thanh chúc mừng bằng Web Audio API
  const playSuccessSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }, []);

  // Phát âm thanh giọng đọc tiếng Anh bản xứ cho câu hiện tại
  const speakCurrentSentence = useCallback(
    (rate = speechRate) => {
      if (!currentSentence || typeof window === 'undefined' || !window.speechSynthesis) return;

      // Ghi nhận số lượt nghe audio (Lần 1 miễn phí, mỗi lần nghe lại từ lần 2 trừ 5 điểm)
      if (!completedMapRef.current[currentSentence.id]) {
        setListenCountsMap((prev) => ({
          ...prev,
          [currentSentence.id]: (prev[currentSentence.id] || 0) + 1
        }));
      }

      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(true);

        const cleanText = currentSentence.audioText.replace(/^\[[MW]\]\s*/i, '').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = rate;

        const voices = window.speechSynthesis.getVoices();
        const enVoice =
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Zira') ||
                v.name.includes('David') ||
                v.name.includes('Samantha'))
          ) || voices.find((v) => v.lang.startsWith('en'));

        if (enVoice) utterance.voice = enVoice;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setIsSpeaking(false);
      }
    },
    [currentSentence, speechRate]
  );

  // Tự động phát khi đổi câu nếu autoPlay bật
  useEffect(() => {
    if (autoPlay && currentSentence) {
      const timer = setTimeout(() => {
        speakCurrentSentence();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [currentSentence?.id, autoPlay, speakCurrentSentence]);

  // Focus ô gõ phím khi đổi câu
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentSentence?.id]);

  // Xử lý nộp / kiểm tra tính chính xác của câu và chấm điểm
  const handleCompleteSentence = useCallback(
    (sentId, targetText, overrideHints, overrideWrongs) => {
      const sent = filteredSentences.find((s) => s.id === sentId) || currentSentence;
      const words = sent ? sent.text.trim().split(/\s+/) : [];
      const totalWords = words.length;

      const wrongs = overrideWrongs || wrongAttemptsMapRef.current[sentId] || {};
      const hints = overrideHints || hintedWordsMapRef.current[sentId] || {};
      const listenCount = listenCountsMapRef.current[sentId] || 0;
      const replaysCount = Math.max(0, listenCount - 1);

      const finalScore = calculateSentenceScore(totalWords, wrongs, hints, replaysCount);

      setSentenceScoresMap((prev) => ({ ...prev, [sentId]: finalScore }));
      setCompletedMap((prev) => ({ ...prev, [sentId]: true }));
      setUserInputs((prev) => ({ ...prev, [sentId]: sent?.text || targetText }));

      // Lưu trữ đồng bộ 2 tầng: LocalStorage và Spring Boot Backend (PostgreSQL)
      saveProgressToStorageAndApi(lessonId, sentId, sent?.part || 1, {
        isCompleted: true,
        score: finalScore,
        userInput: sent?.text || targetText,
        hintsCount: Object.values(hints).filter(Boolean).length,
        listenCount: listenCount,
        wrongAttempts: wrongs,
        hintedWords: hints
      });

      // Kiểm tra nếu câu này giúp hoàn thành toàn bộ Part
      const partNum = sent?.part || 1;
      const partSents = sentences.filter((s) => s.part === partNum);
      const isPartCompleteNow = partSents.length > 0 && partSents.every((s) => s.id === sentId || !!completedMap[s.id]);

      if (isPartCompleteNow) {
        confetti({
          particleCount: 110,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6']
        });
      } else if (finalScore >= 90) {
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.75 },
          colors: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#f59e0b']
        });
      } else if (finalScore >= 60) {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.75 },
          colors: ['#f59e0b', '#fbbf24', '#d97706', '#3b82f6']
        });
      }
    },
    [filteredSentences, currentSentence, sentences, completedMap, lessonId, playSuccessSound]
  );

  // Luyện lại câu này từ đầu (reset điểm và trạng thái của câu đó)
  const handleRetrySentence = useCallback((sentId) => {
    const sent = filteredSentences.find((s) => s.id === sentId) || currentSentence;

    setCompletedMap((prev) => {
      const next = { ...prev };
      delete next[sentId];
      return next;
    });
    setUserInputs((prev) => ({ ...prev, [sentId]: '' }));
    setSentenceScoresMap((prev) => {
      const next = { ...prev };
      delete next[sentId];
      return next;
    });
    setWrongAttemptsMap((prev) => {
      const next = { ...prev };
      delete next[sentId];
      return next;
    });
    setHintedWordsMap((prev) => {
      const next = { ...prev };
      delete next[sentId];
      return next;
    });
    setHintsCountMap((prev) => ({ ...prev, [sentId]: 0 }));
    setListenCountsMap((prev) => {
      const next = { ...prev };
      delete next[sentId];
      return next;
    });
    if (lastEvaluatedWrongTokensRef.current) {
      delete lastEvaluatedWrongTokensRef.current[sentId];
    }

    // Đồng bộ reset trong LocalStorage và Backend PostgreSQL
    saveProgressToStorageAndApi(lessonId, sentId, sent?.part || 1, {
      isCompleted: false,
      score: 0,
      userInput: '',
      hintsCount: 0,
      listenCount: 0,
      wrongAttempts: {},
      hintedWords: {}
    });

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [filteredSentences, currentSentence, lessonId]);

  // Đặt lại toàn bộ tiến độ của Lesson này
  const handleResetAllProgress = useCallback(async () => {
    if (!window.confirm('Bạn có chắc chắn muốn làm lại toàn bộ bài nghe chép chính tả này? Mọi điểm số và câu đã làm sẽ được xóa để luyện lại từ đầu.')) {
      return;
    }

    try {
      localStorage.removeItem(getStorageKey(lessonId));
      await fetch(`/api/lesson-practice/dictation/${lessonId}/reset`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Error resetting dictation progress:', e);
    }

    setCompletedMap({});
    setSentenceScoresMap({});
    setUserInputs({});
    setHintsCountMap({});
    setListenCountsMap({});
    setWrongAttemptsMap({});
    setHintedWordsMap({});
    if (lastEvaluatedWrongTokensRef.current) {
      lastEvaluatedWrongTokensRef.current = {};
    }
    setCurrentIndex(0);
  }, [lessonId]);

  // Phân tích và đánh giá trạng thái từng từ trong câu theo thời gian thực:
  // - Khi người dùng gõ phím cách (Space) -> Chuyển sang từ mới:
  //   + Đúng: status = 'correct' (Xanh lá & Full chữ)
  //   + Sai: status = 'wrong' (Màu đỏ & KHÔNG hiện chữ)
  // - Khi đang gõ tới từ đó: status = 'active' (Xanh dương & hiển thị số ký tự)
  // - Những từ chưa gõ tới: status = 'idle'
  const wordsEvaluation = useMemo(() => {
    if (!currentSentence) return { list: [], allCorrect: false, activeIndex: 0, submittedWords: [] };

    const targetWordsList = currentSentence.text.trim().split(/\s+/).map((raw, idx) => ({
      index: idx,
      raw: raw,
      clean: normalizeWord(raw),
      length: normalizeWord(raw).length || raw.length
    }));

    // QUAN TRỌNG: Nếu câu này đã được hoàn thành trước đó (từ cache LocalStorage / Backend hoặc vừa làm xong)
    if (isCurrentCompleted) {
      return {
        list: targetWordsList.map((tw) => ({
          ...tw,
          status: 'correct',
          typedText: tw.raw
        })),
        allCorrect: true,
        activeIndex: targetWordsList.length,
        submittedWords: targetWordsList.map((tw) => tw.raw)
      };
    }

    if (!currentInput || !currentInput.trimStart()) {
      return {
        list: targetWordsList.map((tw, idx) => ({
          ...tw,
          status: idx === 0 ? 'active' : 'idle',
          typedText: ''
        })),
        allCorrect: false,
        activeIndex: 0,
        submittedWords: []
      };
    }

    const hasTrailingSpace = /\s$/.test(currentInput);
    const rawTokens = currentInput.trimStart().split(/\s+/);

    let submittedWords = [];
    let currentTypingWord = '';
    let activeIndex = 0;

    if (hasTrailingSpace) {
      submittedWords = rawTokens.filter(Boolean);
      currentTypingWord = '';
      activeIndex = submittedWords.length;
    } else {
      submittedWords = rawTokens.slice(0, -1).filter(Boolean);
      currentTypingWord = rawTokens[rawTokens.length - 1] || '';
      activeIndex = submittedWords.length;
    }

    const list = targetWordsList.map((tw, idx) => {
      // 1. Những từ người dùng đã gõ xong và cách khoảng trắng (Submitted)
      if (idx < submittedWords.length) {
        const userWord = submittedWords[idx];
        const isMatch = matchWord(userWord, tw.clean);
        return {
          ...tw,
          status: isMatch ? 'correct' : 'wrong',
          typedText: userWord
        };
      }

      // 2. Từ người dùng đang gõ tới (Active - Xanh dương)
      if (idx === activeIndex) {
        // Trường hợp đặc biệt: Từ cuối cùng của câu, người dùng đã gõ đúng từ nhưng chưa nhấn Space
        if (
          idx === targetWordsList.length - 1 &&
          currentTypingWord &&
          matchWord(currentTypingWord, tw.clean)
        ) {
          return {
            ...tw,
            status: 'correct',
            typedText: currentTypingWord
          };
        }

        return {
          ...tw,
          status: 'active',
          typedText: currentTypingWord
        };
      }

      // 3. Những từ chưa gõ tới (Idle)
      return {
        ...tw,
        status: 'idle',
        typedText: ''
      };
    });

    const allCorrect =
      list.length > 0 &&
      list.every((w) => w.status === 'correct');

    return { list, allCorrect, activeIndex, submittedWords };
  }, [currentSentence, currentInput, isCurrentCompleted]);

  // Lắng nghe và đếm số lần gõ sai cho từng từ khi người dùng cách khoảng trắng (Space)
  useEffect(() => {
    if (!currentSentenceId || isCurrentCompleted) return;

    const { list } = wordsEvaluation;
    list.forEach((w) => {
      if (w.status === 'wrong' && w.typedText) {
        if (!lastEvaluatedWrongTokensRef.current[currentSentenceId]) {
          lastEvaluatedWrongTokensRef.current[currentSentenceId] = {};
        }
        const lastWrongForWord = lastEvaluatedWrongTokensRef.current[currentSentenceId][w.index];

        // Nếu từ sai này khác với từ sai vừa ghi nhận trước đó cho vị trí này
        if (lastWrongForWord !== w.typedText) {
          lastEvaluatedWrongTokensRef.current[currentSentenceId][w.index] = w.typedText;

          setWrongAttemptsMap((prev) => {
            const prevSent = prev[currentSentenceId] || {};
            return {
              ...prev,
              [currentSentenceId]: {
                ...prevSent,
                [w.index]: (prevSent[w.index] || 0) + 1
              }
            };
          });
        }
      } else if (w.status === 'correct') {
        // Khi đã sửa đúng từ đó, reset token sai đã nhớ để nếu sau này sửa lại mà gõ sai thì vẫn ghi nhận
        if (lastEvaluatedWrongTokensRef.current[currentSentenceId]) {
          delete lastEvaluatedWrongTokensRef.current[currentSentenceId][w.index];
        }
      }
    });
  }, [wordsEvaluation, currentSentenceId, isCurrentCompleted]);

  // Điểm số của câu hiện tại:
  // Nếu đã hoàn thành: lấy điểm chính thức từ sentenceScoresMap[currentSentenceId]
  // Nếu đang gõ: tính điểm thời gian thực theo số lỗi, gợi ý đã dùng, và số lần nghe lại (trừ 5đ/lần nghe lại từ lần 2)
  const currentWrongAttempts = wrongAttemptsMap[currentSentenceId] || {};
  const currentHintedWords = hintedWordsMap[currentSentenceId] || {};
  const currentTargetWordsCount = currentSentence ? currentSentence.text.trim().split(/\s+/).length : 0;
  const currentListenCount = (currentSentenceId ? listenCountsMap[currentSentenceId] : 0) || 0;
  const currentReplaysCount = Math.max(0, currentListenCount - 1);

  const currentSentenceScore = useMemo(() => {
    if (isCurrentCompleted && typeof sentenceScoresMap[currentSentenceId] === 'number') {
      return sentenceScoresMap[currentSentenceId];
    }
    return calculateSentenceScore(
      currentTargetWordsCount,
      currentWrongAttempts,
      currentHintedWords,
      currentReplaysCount
    );
  }, [
    isCurrentCompleted,
    sentenceScoresMap,
    currentSentenceId,
    currentTargetWordsCount,
    currentWrongAttempts,
    currentHintedWords,
    currentReplaysCount
  ]);

  const currentScoreTier = useMemo(() => {
    return getScoreTier(currentSentenceScore);
  }, [currentSentenceScore]);

  // Tổng số lượt gõ sai cho câu hiện tại
  const currentSentenceMistakesCount = useMemo(() => {
    return Object.values(currentWrongAttempts).reduce((acc, v) => acc + (v || 0), 0);
  }, [currentWrongAttempts]);

  // Tổng số từ đã dùng gợi ý cho câu hiện tại
  const currentSentenceHintsCount = useMemo(() => {
    return Object.values(currentHintedWords).filter(Boolean).length;
  }, [currentHintedWords]);

  // Khi người dùng gõ vào ô input
  const handleInputChange = (e) => {
    if (!currentSentence || isCurrentCompleted) return;
    const value = e.target.value;
    setUserInputs((prev) => ({ ...prev, [currentSentence.id]: value }));

    // Kiểm tra nếu câu đã hoàn thành đầy đủ
    const normInput = normalizeSentence(value);
    const normTarget = normalizeSentence(currentSentence.text);

    if (normInput.length > 0 && normInput === normTarget) {
      handleCompleteSentence(currentSentence.id, currentSentence.text);
    }
  };

  // Tự động kích hoạt hoàn thành khi toàn bộ từ đều correct
  useEffect(() => {
    if (wordsEvaluation.allCorrect && currentSentence && !isCurrentCompleted) {
      handleCompleteSentence(currentSentence.id, currentSentence.text);
    }
  }, [wordsEvaluation.allCorrect, currentSentence, isCurrentCompleted, handleCompleteSentence]);

  // Nút "Mở 1 từ" (Reveal Next Word): Mở từ đầu tiên chưa đúng (sai hoặc đang gõ)
  // Gợi ý từ đó thì coi như sai nguyên từ đó (trừ 100% điểm của từ đó)
  const handleRevealNextWord = useCallback(() => {
    if (!currentSentence || isCurrentCompleted) return;

    const targetWordsList = currentSentence.text.trim().split(/\s+/);
    const { list } = wordsEvaluation;

    // Tìm từ đầu tiên chưa đúng (hoặc là 'wrong', hoặc là 'active', hoặc 'idle')
    const firstUnfinishedIdx = list.findIndex((w) => w.status !== 'correct');

    if (firstUnfinishedIdx !== -1 && firstUnfinishedIdx < targetWordsList.length) {
      const updatedHints = {
        ...(hintedWordsMapRef.current[currentSentence.id] || {}),
        [firstUnfinishedIdx]: true
      };

      setHintedWordsMap((prev) => ({
        ...prev,
        [currentSentence.id]: updatedHints
      }));

      setHintsCountMap((prev) => ({
        ...prev,
        [currentSentence.id]: (prev[currentSentence.id] || 0) + 1
      }));

      // Giữ lại các từ đúng phía trước và điền từ đúng tại firstUnfinishedIdx
      const correctPrefix = targetWordsList.slice(0, firstUnfinishedIdx + 1);
      const newText = correctPrefix.join(' ') + ' ';

      setUserInputs((prev) => ({ ...prev, [currentSentence.id]: newText }));

      // Nếu từ vừa mở là từ cuối cùng
      if (firstUnfinishedIdx === targetWordsList.length - 1) {
        handleCompleteSentence(
          currentSentence.id,
          currentSentence.text,
          updatedHints,
          wrongAttemptsMapRef.current[currentSentence.id]
        );
      }
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
  }, [currentSentence, isCurrentCompleted, wordsEvaluation, handleCompleteSentence]);

  // Nhảy trực tiếp đến 1 từ bị sai để gõ lại
  const handleJumpToWord = (wordIndex) => {
    if (!currentSentence || isCurrentCompleted) return;
    const { list } = wordsEvaluation;
    const targetWordsList = currentSentence.text.trim().split(/\s+/);

    const preservedWords = [];
    for (let i = 0; i < wordIndex; i++) {
      if (list[i]?.status === 'correct') {
        preservedWords.push(targetWordsList[i]);
      } else {
        break;
      }
    }
    const newInput = preservedWords.join(' ') + (preservedWords.length > 0 ? ' ' : '');
    setUserInputs((prev) => ({ ...prev, [currentSentence.id]: newInput }));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
  };

  // Phím tắt bàn phím:
  // - Bấm phím "Control" (Ctrl): Nghe lại audio câu hiện tại
  // - Bấm "Tab": Mở 1 từ gợi ý tiếp theo
  // - Bấm "Enter" (khi đã hoàn thành): Chuyển sang câu tiếp theo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Phím Ctrl: Nghe lại audio ngay lập tức
      if (e.key === 'Control') {
        e.preventDefault();
        speakCurrentSentence();
        return;
      }

      // 2. Phím Tab: Mở 1 từ (khi đang gõ trong input)
      if (e.key === 'Tab') {
        if (!isCurrentCompleted) {
          e.preventDefault();
          handleRevealNextWord();
        }
        return;
      }

      // 3. Phím Enter: Nếu câu hiện tại đã hoàn thành thì qua câu tiếp theo
      if (e.key === 'Enter' && isCurrentCompleted) {
        e.preventDefault();
        if (currentIndex < filteredSentences.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speakCurrentSentence, handleRevealNextWord, isCurrentCompleted, currentIndex, filteredSentences.length]);

  // Thống kê tiến độ hoàn thành của danh sách đang xem
  const totalInFilter = filteredSentences.length;
  const completedInFilter = useMemo(() => {
    return filteredSentences.filter((s) => !!completedMap[s.id]).length;
  }, [filteredSentences, completedMap]);

  const progressPercent = totalInFilter > 0 ? Math.round((completedInFilter / totalInFilter) * 100) : 0;

  // Thống kê phân loại điểm cho danh sách đang xem (Perfect, Medium, Cần cố gắng)
  const scoreStats = useMemo(() => {
    let perfect = 0;
    let medium = 0;
    let low = 0;
    let totalScoreSum = 0;
    let scoredCount = 0;

    filteredSentences.forEach((s) => {
      if (completedMap[s.id] && typeof sentenceScoresMap[s.id] === 'number') {
        const score = sentenceScoresMap[s.id];
        scoredCount++;
        totalScoreSum += score;
        if (score >= 90) perfect++;
        else if (score >= 60) medium++;
        else low++;
      }
    });

    const avg = scoredCount > 0 ? Math.round(totalScoreSum / scoredCount) : 0;
    return { perfect, medium, low, scoredCount, avg };
  }, [filteredSentences, completedMap, sentenceScoresMap]);

  // Thống kê chi tiết & điểm trung bình theo 4 Part của bài TOEIC (Part 1, 2, 3, 4)
  const partsSummary = useMemo(() => {
    const meta = [
      {
        part: 1,
        title: 'Part 1: Photographs',
        subTitle: '4 câu miêu tả tranh',
        shortName: 'Part 1: Tranh',
        icon: 'image',
        description: 'Điểm tính trung bình của cả 4 câu tranh'
      },
      {
        part: 2,
        title: 'Part 2: Question-Response',
        subTitle: 'Hỏi & Phản hồi đối đáp',
        shortName: 'Part 2: Hỏi-Đáp',
        icon: 'qa',
        description: 'Điểm tính trung bình câu hỏi & lựa chọn'
      },
      {
        part: 3,
        title: 'Part 3: Conversations',
        subTitle: 'Đoạn hội thoại nam/nữ',
        shortName: 'Part 3: Hội thoại',
        icon: 'chat',
        description: 'Phải nghe hết trọn bài hội thoại để tính điểm'
      },
      {
        part: 4,
        title: 'Part 4: Short Talks',
        subTitle: 'Bài nói ngắn / Thông báo',
        shortName: 'Part 4: Bài nói',
        icon: 'talk',
        description: 'Phải nghe hết trọn bài nói để tính điểm'
      }
    ];

    return meta.map((m) => {
      const partSents = sentences.filter((s) => s.part === m.part);
      const totalCount = partSents.length;
      const completedCount = partSents.filter((s) => !!completedMap[s.id]).length;
      const isCompleted = totalCount > 0 && completedCount === totalCount;

      let scoreSum = 0;
      let scoredCount = 0;
      let mistakesCount = 0;
      let hintsCount = 0;

      partSents.forEach((s) => {
        if (completedMap[s.id] && typeof sentenceScoresMap[s.id] === 'number') {
          scoreSum += sentenceScoresMap[s.id];
          scoredCount++;
        }
        const wrongs = wrongAttemptsMap[s.id] || {};
        const hints = hintedWordsMap[s.id] || {};
        mistakesCount += Object.values(wrongs).reduce((acc, v) => acc + (v || 0), 0);
        hintsCount += Object.values(hints).filter(Boolean).length;
      });

      // Điểm trung bình của Part: Chỉ tính khi hoàn thành trọn vẹn cả Part
      const averageScore = isCompleted && totalCount > 0 ? Math.round(scoreSum / totalCount) : null;
      const scoreTier = averageScore !== null ? getScoreTier(averageScore) : null;
      const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        ...m,
        totalCount,
        completedCount,
        isCompleted,
        averageScore,
        scoreTier,
        percent,
        mistakesCount,
        hintsCount,
        sentences: partSents
      };
    });
  }, [sentences, completedMap, sentenceScoresMap, wrongAttemptsMap, hintedWordsMap]);

  // Thông tin Part của câu hiện tại đang luyện
  const currentPartInfo = useMemo(() => {
    if (!currentSentence) return null;
    return partsSummary.find((p) => p.part === currentSentence.part) || null;
  }, [partsSummary, currentSentence]);

  // Thứ tự của câu hiện tại trong Part (1-indexed)
  const currentSentenceIndexInPart = useMemo(() => {
    if (!currentSentence || !currentPartInfo) return 1;
    const idx = currentPartInfo.sentences.findIndex((s) => s.id === currentSentence.id);
    return idx !== -1 ? idx + 1 : 1;
  }, [currentSentence, currentPartInfo]);

  // Lấy chi tiết số lỗi, gợi ý và lượt nghe lại của 1 câu bất kỳ
  const getSentenceDetails = useCallback(
    (sentId) => {
      const isDone = !!completedMap[sentId];
      const score = sentenceScoresMap[sentId];
      const tier = isDone && typeof score === 'number' ? getScoreTier(score) : null;
      const wrongs = wrongAttemptsMap[sentId] || {};
      const hints = hintedWordsMap[sentId] || {};
      const listenCount = listenCountsMap[sentId] || 0;
      const replaysCount = Math.max(0, listenCount - 1);
      const mistakesCount = Object.values(wrongs).reduce((acc, v) => acc + (v || 0), 0);
      const hintsCount = Object.values(hints).filter(Boolean).length;
      return { isDone, score, tier, mistakesCount, hintsCount, listenCount, replaysCount };
    },
    [completedMap, sentenceScoresMap, wrongAttemptsMap, hintedWordsMap, listenCountsMap]
  );

  // Danh sách các câu hiển thị trong phần chọn câu theo bộ lọc trạng thái (Tất cả, Đã làm, Chưa làm, Perfect, Medium, Low)
  const displayedDrawerSentences = useMemo(() => {
    return filteredSentences
      .map((s, originalFilteredIndex) => {
        const isDone = !!completedMap[s.id];
        const score = sentenceScoresMap[s.id];
        const tier = isDone && typeof score === 'number' ? getScoreTier(score) : null;
        return {
          sentence: s,
          originalIndex: originalFilteredIndex,
          isDone,
          score,
          tier
        };
      })
      .filter((item) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'completed') return item.isDone;
        if (statusFilter === 'uncompleted') return !item.isDone;
        if (statusFilter === 'perfect') return item.isDone && item.tier?.tier === 'perfect';
        if (statusFilter === 'medium') return item.isDone && item.tier?.tier === 'medium';
        if (statusFilter === 'low') return item.isDone && item.tier?.tier === 'low';
        return true;
      });
  }, [filteredSentences, completedMap, sentenceScoresMap, statusFilter]);

  // Gom nhóm danh sách câu trong Drawer theo 4 Part (Part 1, 2, 3, 4)
  const groupedDrawerByPart = useMemo(() => {
    const map = { 1: [], 2: [], 3: [], 4: [] };
    displayedDrawerSentences.forEach((item) => {
      const p = item.sentence.part || 1;
      if (!map[p]) map[p] = [];
      map[p].push(item);
    });
    return map;
  }, [displayedDrawerSentences]);

  // Hàm render 1 ô câu trong dạng Lưới
  const renderDrawerButton = (item) => {
    const isCurrent = item.originalIndex === currentIndex;
    let cardStyle = 'bg-purple-950/60 border-purple-800/40 text-purple-300 hover:bg-purple-900 hover:text-white';

    if (item.isDone && item.tier) {
      if (item.tier.tier === 'perfect') {
        cardStyle = 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200 shadow-md shadow-emerald-500/10 font-bold';
      } else if (item.tier.tier === 'medium') {
        cardStyle = 'bg-amber-950/90 border-amber-500/80 text-amber-200 shadow-md shadow-amber-500/10 font-bold';
      } else {
        cardStyle = 'bg-rose-950/90 border-rose-500/80 text-rose-200 shadow-md shadow-rose-500/10 font-bold';
      }
    }

    if (isCurrent) {
      cardStyle += ' ring-2 ring-cyan-300 scale-[1.04] shadow-lg shadow-cyan-500/25';
    }

    return (
      <button
        key={item.sentence.id}
        onClick={() => setCurrentIndex(item.originalIndex)}
        className={`p-2.5 rounded-2xl border text-xs flex flex-col items-center justify-center transition cursor-pointer relative ${cardStyle}`}
      >
        <div className="flex items-center space-x-1 font-bold">
          <span>Câu {item.originalIndex + 1}</span>
          {item.isDone && (
            item.tier?.tier === 'perfect' ? <Sparkles size={11} className={isCurrent ? 'text-cyan-200' : 'text-emerald-400'} /> :
            item.tier?.tier === 'medium' ? <Zap size={11} className={isCurrent ? 'text-cyan-200' : 'text-amber-400'} /> :
            <Check size={11} className={isCurrent ? 'text-cyan-200' : 'text-rose-400'} />
          )}
        </div>

        {item.isDone && typeof item.score === 'number' ? (
          <div className="flex flex-col items-center mt-1">
            <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-md border ${
              item.tier?.tier === 'perfect' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' :
              item.tier?.tier === 'medium' ? 'bg-amber-500/20 text-amber-200 border-amber-500/40' :
              'bg-rose-500/20 text-rose-200 border-rose-500/40'
            }`}>
              {item.score}đ
            </span>
            <span className="text-[9px] font-bold opacity-80 mt-0.5">
              {item.tier?.label}
            </span>
          </div>
        ) : (
          <span className="text-[10px] opacity-70 font-mono px-1.5 py-0.5 rounded bg-purple-900/40 mt-1">
            Chưa làm
          </span>
        )}
      </button>
    );
  };

  if (sentences.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-purple-300">
        <Headphones size={48} className="mx-auto text-purple-400 mb-3 opacity-60 animate-bounce" />
        <p className="text-lg font-bold">Không tìm thấy dữ liệu audio transcript của bài này.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 py-4 px-2 md:px-4 font-['Quicksand'] select-none">
      
      {/* 1. TOP HEADER & PHẦN LỌC BÀI NGHE */}
      <div className="bg-[#240d36] rounded-3xl p-4 md:p-6 border border-purple-800/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Headphones size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-[11px] border border-cyan-500/40 uppercase">
                  Nghe Chép Chính Tả TOEIC
                </span>
                <span className="text-xs text-purple-300 font-bold hidden sm:inline">
                  Lesson {lessonId} • Part 1 - 4
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 mt-0.5">
                <span>Luyện Tai Nghe & Chép Transcript Từng Câu</span>
              </h2>
            </div>
          </div>

          {/* Nút quay lại bài test nếu có */}
          {onBackToTest && (
            <button
              onClick={onBackToTest}
              className="self-start md:self-auto px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold transition border border-purple-700/50 cursor-pointer flex items-center space-x-2 shadow-sm"
            >
              <BookOpen size={14} />
              <span>Xem bài Test TOEIC</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* GOM NHÓM THEO 4 PHẦN THI (PART 1, 2, 3, 4) & TÍNH ĐIỂM TRUNG BÌNH THEO PART */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-purple-800/30 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers size={14} className="text-cyan-400" />
              <span>4 Phần nghe chép chính tả (Bấm chọn phần để luyện tập):</span>
            </span>

            {/* Nút xem Tất cả các câu */}
            <button
              onClick={() => {
                setActivePartFilter('all');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                activePartFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-purple-950/60 text-purple-300 border-purple-800/50 hover:bg-purple-900 hover:text-white'
              }`}
            >
              Xem tất cả ({sentences.length} câu)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {partsSummary.map((p) => {
              const isSelected = activePartFilter === String(p.part);
              return (
                <button
                  key={p.part}
                  type="button"
                  onClick={() => {
                    setActivePartFilter(String(p.part));
                    setCurrentIndex(0);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 relative group ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#3b1552] to-[#240d36] border-cyan-400 ring-2 ring-cyan-400/50 shadow-xl shadow-cyan-500/15'
                      : p.isCompleted
                      ? 'bg-[#210c2f] border-emerald-500/50 hover:border-emerald-400'
                      : 'bg-purple-950/50 border-purple-800/40 hover:bg-purple-900/50 hover:border-purple-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      {p.part === 1 && <ImageIcon size={15} className="text-cyan-400" />}
                      {p.part === 2 && <HelpCircle size={15} className="text-indigo-400" />}
                      {p.part === 3 && <MessageSquare size={15} className="text-teal-400" />}
                      {p.part === 4 && <Mic size={15} className="text-amber-400" />}
                      <span>Part {p.part}</span>
                    </span>

                    {p.isCompleted ? (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border font-mono flex items-center gap-1 ${p.scoreTier?.bgColor} ${p.scoreTier?.borderColor} ${p.scoreTier?.textColor}`}>
                        <Sparkles size={11} />
                        <span>TB: {p.averageScore}đ</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-purple-300 font-bold px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-700/40">
                        {p.completedCount}/{p.totalCount} câu
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-purple-200 group-hover:text-white transition">
                      {p.shortName}
                    </div>
                    <div className="text-[11px] text-purple-300/80 mt-0.5">
                      {p.isCompleted ? (
                        <span className={`${p.scoreTier?.textColor} font-bold flex items-center gap-1`}>
                          <CheckCircle2 size={11} /> {p.scoreTier?.label} (Hoàn thành)
                        </span>
                      ) : p.part === 3 ? (
                        <span className="text-teal-300/90 font-medium">Nghe hết bài để tính điểm</span>
                      ) : p.part === 4 ? (
                        <span className="text-amber-300/90 font-medium">Nghe hết bài để tính điểm</span>
                      ) : (
                        <span className="text-purple-400 font-medium">Điểm TB tính khi xong 4 câu</span>
                      )}
                    </div>
                  </div>

                  {/* Thanh tiến độ của Part */}
                  <div className="w-full bg-purple-950 h-1.5 rounded-full overflow-hidden border border-purple-800/40">
                    <div
                      className={`h-full transition-all duration-500 ${
                        p.isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-400 to-teal-400'
                      }`}
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thanh tiến độ hoàn thành & thống kê điểm trong danh mục */}
        <div className="flex items-center space-x-3 bg-purple-950/70 px-4 py-2.5 rounded-2xl border border-purple-800/40">
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-purple-300 mb-1.5">
              <span>Tiến độ đã gõ đúng:</span>
              <div className="flex flex-wrap items-center gap-2 font-mono">
                <span className="text-cyan-300 font-extrabold">
                  {completedInFilter}/{totalInFilter} câu ({progressPercent}%)
                </span>
                {scoreStats.scoredCount > 0 && (
                  <>
                    <span className="text-purple-500">•</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                      <Sparkles size={11} /> {scoreStats.perfect} Perfect
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                      <Zap size={11} /> {scoreStats.medium} Medium
                    </span>
                    {scoreStats.low > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1">
                        <AlertCircle size={11} /> {scoreStats.low} Cần cố gắng
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="w-full bg-purple-900/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-purple-800/50">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC THỰC HÀNH CHÉP CHÍNH TẢ CHO CÂU HIỆN TẠI */}
      {currentSentence && (
        <div className="bg-gradient-to-b from-[#2a1040] to-[#1e0a2e] rounded-3xl p-5 md:p-8 border border-purple-700/40 shadow-2xl space-y-6">
          
          {/* Header câu: Số thứ tự, Badge, Điểm số Part & Câu, Nút điều hướng */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800/40 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-purple-950 border border-purple-700/60 font-mono text-sm font-extrabold text-amber-400">
                Câu {currentIndex + 1} / {totalInFilter}
              </span>
              <span className="text-xs md:text-sm font-bold text-purple-200">
                {currentSentence.badge}
              </span>

              {/* BADGE ĐIỂM TRUNG BÌNH THEO PART HOẶC TIẾN ĐỘ PART */}
              {currentPartInfo?.isCompleted ? (
                <div
                  className={`px-3 py-1 rounded-xl border text-xs font-black flex items-center space-x-1.5 shadow-sm transition-all duration-300 ${currentPartInfo.scoreTier?.bgColor} ${currentPartInfo.scoreTier?.borderColor} ${currentPartInfo.scoreTier?.textColor}`}
                >
                  <Trophy size={14} className={currentPartInfo.scoreTier?.textColor} />
                  <span>
                    Điểm TB Part {currentPartInfo.part}: {currentPartInfo.averageScore}/100đ • {currentPartInfo.scoreTier?.label}
                  </span>
                  <Check size={12} className="stroke-[3]" />
                </div>
              ) : (
                <div className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-700/50 text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                  <span className="font-mono text-cyan-300 font-extrabold">
                    Part {currentPartInfo?.part}: {currentPartInfo?.completedCount}/{currentPartInfo?.totalCount} câu
                  </span>
                  <span className="text-purple-400">•</span>
                  <span className="text-[11px] text-amber-300">
                    {currentSentence.part === 3 || currentSentence.part === 4
                      ? 'Nghe hết bài để nhận điểm TB'
                      : 'Điểm TB tính khi xong cả Part'}
                  </span>
                </div>
              )}

              {/* Badge nhỏ cho biết điểm riêng của câu hiện tại nếu đã hoàn thành */}
              {isCurrentCompleted && (
                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${currentScoreTier.bgColor} ${currentScoreTier.borderColor} ${currentScoreTier.textColor}`}>
                  Câu này: {currentSentenceScore}đ
                </span>
              )}
            </div>

            {/* Điều khiển câu trước / câu sau */}
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition flex items-center space-x-1 border border-purple-700/40 cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Câu trước</span>
              </button>

              <button
                disabled={currentIndex >= filteredSentences.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(filteredSentences.length - 1, prev + 1))}
                className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition flex items-center space-x-1 border border-purple-700/40 cursor-pointer"
              >
                <span className="hidden sm:inline">Câu sau</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* BANNER TỔNG KẾT ĐIỂM KHI HOÀN THÀNH CẢ PART */}
          {currentPartInfo && currentPartInfo.isCompleted && (
            <div className="bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-purple-950/70 border-2 border-emerald-500/60 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-500/20">
                  <Trophy size={26} className="text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                      Đã hoàn thành trọn vẹn
                    </span>
                    <span className="text-xs text-purple-200 font-bold">{currentPartInfo.title}</span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-2xl font-black text-white font-mono">
                      {currentPartInfo.averageScore} / 100đ
                    </span>
                    <span className={`text-xs font-black ${currentPartInfo.scoreTier?.textColor}`}>
                      • {currentPartInfo.scoreTier?.label} (Điểm trung bình {currentPartInfo.totalCount} câu)
                    </span>
                  </div>
                  <p className="text-xs text-purple-300/80 mt-0.5">
                    {currentPartInfo.part === 3 ? 'Bạn đã nghe và chép thành công toàn bộ đoạn hội thoại Part 3!' :
                     currentPartInfo.part === 4 ? 'Bạn đã nghe và chép thành công toàn bộ bài độc thoại Part 4!' :
                     `Bạn đã hoàn thành đủ cả ${currentPartInfo.totalCount} câu của Part ${currentPartInfo.part}.`}
                  </p>
                </div>
              </div>

              {currentPartInfo.part < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePartFilter(String(currentPartInfo.part + 1));
                    setCurrentIndex(0);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 self-start sm:self-auto"
                >
                  <span>Chuyển sang Part {currentPartInfo.part + 1}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}

          {/* Hình ảnh nếu là Part 1 */}
          {currentSentence.imageUrl && (
            <div className="flex justify-center bg-black/40 p-3 rounded-2xl border border-purple-800/40 max-w-sm mx-auto shadow-inner">
              <img
                src={currentSentence.imageUrl}
                alt="Part 1 Illustration"
                className="max-h-52 w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          )}

          {/* AUDIO CONTROLLER TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1d082c] p-3.5 rounded-2xl border border-purple-800/50">
            <div className="flex items-center space-x-2">
              {/* NÚT CHÍNH: PHÁT AUDIO / PHÍM CTRL */}
              <button
                onClick={() => speakCurrentSentence()}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-sm transition cursor-pointer shadow-lg ${
                  isSpeaking
                    ? 'bg-amber-500 text-slate-950 animate-pulse ring-2 ring-amber-400/50'
                    : currentListenCount >= 1 && !isCurrentCompleted
                    ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white hover:from-amber-500 hover:to-rose-500 shadow-amber-500/25 ring-1 ring-amber-400/40'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25'
                }`}
                title={
                  isCurrentCompleted
                    ? 'Bấm hoặc nhấn phím Ctrl để nghe lại phát âm'
                    : currentListenCount === 0
                    ? 'Lần nghe đầu tiên miễn phí'
                    : `Nghe lại sẽ bị trừ 5 điểm (Đã nghe ${currentListenCount} lần)`
                }
              >
                <Volume2 size={18} />
                <span>
                  {isSpeaking
                    ? 'Đang phát...'
                    : isCurrentCompleted
                    ? 'Nghe audio'
                    : currentListenCount === 0
                    ? 'Nghe audio'
                    : 'Nghe lại (-5đ)'}
                </span>
                <kbd className="ml-1.5 px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-mono text-cyan-200 border border-white/20">
                  Ctrl
                </kbd>
              </button>

              {/* Tag cảnh báo số lần nghe lại và điểm bị trừ */}
              {currentReplaysCount > 0 && !isCurrentCompleted && (
                <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
                  <AlertCircle size={14} className="text-rose-400" />
                  <span>Nghe lại {currentReplaysCount} lần (-{currentReplaysCount * 5}đ)</span>
                </div>
              )}

              {/* Tốc độ đọc (0.8x, 1.0x, 1.2x) */}
              <div className="flex items-center space-x-1 bg-purple-950/80 p-1 rounded-xl border border-purple-800/40 text-xs font-bold text-purple-300">
                {[
                  { r: 0.8, l: '0.8x' },
                  { r: 0.95, l: '1.0x' },
                  { r: 1.15, l: '1.2x' }
                ].map((s) => (
                  <button
                    key={s.l}
                    onClick={() => {
                      setSpeechRate(s.r);
                      speakCurrentSentence(s.r);
                    }}
                    className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                      Math.abs(speechRate - s.r) < 0.05
                        ? 'bg-purple-700 text-white font-black'
                        : 'hover:text-white'
                    }`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Cài đặt tự động phát & Gợi ý phím tắt */}
            <div className="flex items-center space-x-4 text-xs font-bold text-purple-300">
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                />
                <span>Tự động phát khi đổi câu</span>
              </label>

              <div className="hidden lg:flex items-center space-x-2 text-purple-400/80 text-[11px]">
                <Keyboard size={13} />
                <span>Phím tắt:</span>
                <span className="font-mono text-cyan-300">[Ctrl] Nghe lại</span>
                <span>•</span>
                <span className="font-mono text-amber-300">[Tab] Mở 1 từ</span>
                <span>•</span>
                <span className="font-mono text-emerald-300">[Enter] Câu kế</span>
              </div>
            </div>
          </div>

          {/* KHU VỰC HIỂN THỊ CÁC Ô TỪ BỊ CHE (WORD PLACEHOLDERS) HOẶC ĐÁP ÁN ĐẦY ĐỦ KHI ĐÚNG */}
          <div
            className={`p-5 md:p-6 rounded-2xl border-2 min-h-[110px] flex flex-col justify-center transition-all duration-300 ${
              isCurrentCompleted
                ? `${currentScoreTier.borderColor} ${currentScoreTier.bgColor}`
                : 'bg-[#1b082a] border-purple-800/40'
            }`}
          >
            {isCurrentCompleted ? (
              // KHI ĐÃ HOÀN THÀNH: HIỂN THỊ ĐIỂM SỐ, THÔNG BÁO THEO TIER (PERFECT XANH LÁ, MEDIUM VÀNG, <60 ĐỎ), VÀ NÚT LUYỆN LẠI
              <div className="space-y-3 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className={`flex items-center space-x-2 text-xs md:text-sm font-black uppercase tracking-wider ${currentScoreTier.textColor}`}>
                    {currentScoreTier.tier === 'perfect' && <CheckCircle2 size={18} className="text-emerald-400" />}
                    {currentScoreTier.tier === 'medium' && <Zap size={18} className="text-amber-400" />}
                    {currentScoreTier.tier === 'low' && <AlertCircle size={18} className="text-rose-400" />}
                    <span>
                      {currentScoreTier.tier === 'perfect' && `⭐ PERFECT • ${currentSentenceScore}/100 ĐIỂM (Xuất sắc!)`}
                      {currentScoreTier.tier === 'medium' && `⚡ MEDIUM • ${currentSentenceScore}/100 ĐIỂM (Khá tốt!)`}
                      {currentScoreTier.tier === 'low' && `🚩 CẦN CỐ GẮNG • ${currentSentenceScore}/100 ĐIỂM (Hãy luyện lại!)`}
                    </span>
                  </div>

                  {/* Thống kê số lần gõ sai, gợi ý và nghe lại của câu này */}
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-purple-200">
                    {currentReplaysCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-rose-500/40 text-rose-300 font-bold">
                        Nghe lại: {currentReplaysCount} lần (-{currentReplaysCount * 5}đ)
                      </span>
                    )}
                    {currentSentenceMistakesCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-rose-500/40 text-rose-300">
                        Sai: {currentSentenceMistakesCount} lượt
                      </span>
                    )}
                    {currentSentenceHintsCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-amber-500/40 text-amber-300">
                        Gợi ý: {currentSentenceHintsCount} từ
                      </span>
                    )}
                  </div>
                </div>

                {/* Toàn bộ nội dung câu đầy đủ */}
                <div className="text-xl md:text-2xl font-black text-white select-text leading-relaxed tracking-wide font-sans">
                  {currentSentence.text}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-purple-300">
                  <span className="italic">
                    💡 Nhấn <kbd className="px-1.5 py-0.5 rounded bg-purple-900 font-mono text-white text-[11px]">Enter</kbd> hoặc nút "Câu sau" để tiếp tục câu kế tiếp.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRetrySentence(currentSentence.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold transition border border-purple-700/50 cursor-pointer shadow-sm hover:text-white"
                    title="Xóa và luyện nghe chép lại câu này để đạt 100 điểm Perfect"
                  >
                    <RotateCcw size={13} />
                    <span>Luyện lại câu này</span>
                  </button>
                </div>
              </div>
            ) : (
              // KHI CHƯA ĐÚNG: HIỂN THỊ CÁC TỪ THEO THỜI GIAN THỰC
              // - Đang gõ tới: Xanh dương, hiển thị số ký tự của từ đó
              // - Cách sang từ mới: Đúng -> Xanh lá & full chữ; Sai -> Màu đỏ & KHÔNG hiện từ đó
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-purple-300 font-bold border-b border-purple-800/40 pb-2.5">
                  <div className="flex items-center space-x-3">
                    <span>
                      Tiến độ: <strong className="text-emerald-400 font-mono text-sm">{wordsEvaluation.list.filter((w) => w.status === 'correct').length}</strong>/{wordsEvaluation.list.length} từ
                    </span>
                    <span className="text-purple-400 font-mono">•</span>
                    <span className="flex items-center space-x-1 font-mono">
                      <span className="text-purple-300">Điểm hiện tại:</span>
                      <strong className={`px-2 py-0.5 rounded-md border text-xs font-black ${currentScoreTier.bgColor} ${currentScoreTier.borderColor} ${currentScoreTier.textColor}`}>
                        {currentSentenceScore}đ
                      </strong>
                    </span>
                    {currentReplaysCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-mono font-bold">
                        Nghe lại: -{currentReplaysCount * 5}đ
                      </span>
                    )}
                    <div className="hidden sm:flex items-center space-x-3 text-[11px]">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50"></span>
                        <span className="text-blue-300">Đang gõ (Xanh dương)</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
                        <span className="text-emerald-300">Đúng (Xanh lá)</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50"></span>
                        <span className="text-rose-300">Sai (Màu đỏ)</span>
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-amber-400/90 font-medium">
                    Gõ xong từ &rarr; Bấm [Space / Phím cách] để nhận diện đúng/sai
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {wordsEvaluation.list.map((w) => {
                    // 1. ĐÚNG (XANH LÁ) -> Đúng thì hiển thị Xanh lá và FULL CHỮ
                    if (w.status === 'correct') {
                      return (
                        <span
                          key={w.index}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-black font-sans text-sm md:text-base border-2 border-emerald-500 shadow-md shadow-emerald-500/10 transition-all animate-scaleIn select-text"
                        >
                          <span>{w.raw}</span>
                          <Check size={14} className="text-emerald-400 stroke-[3]" />
                        </span>
                      );
                    }

                    // 2. SAI (MÀU ĐỎ) -> Sai thì chỉ hiện Màu đỏ, hiển thị từ bạn đã gõ bị gạch đỏ, KHÔNG hiện từ gốc
                    if (w.status === 'wrong') {
                      return (
                        <button
                          key={w.index}
                          type="button"
                          onClick={() => handleJumpToWord(w.index)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-bold font-mono text-sm md:text-base border-2 border-rose-500/80 shadow-md shadow-rose-500/10 hover:bg-rose-500/30 transition cursor-pointer"
                          title="Từ này bị sai! Bấm vào đây để gõ lại"
                        >
                          <span className="line-through text-rose-200 font-black">
                            {w.typedText}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                            sai ({w.length} ký tự)
                          </span>
                        </button>
                      );
                    }

                    // 3. ĐANG GÕ TỚI (XANH DƯƠNG) -> Hiện Xanh dương lên nhưng vẫn để số ký tự của từ đó
                    if (w.status === 'active') {
                      const cleanTyped = normalizeWord(w.typedText);
                      const chars = cleanTyped.split('');
                      const remaining = Math.max(0, w.length - chars.length);

                      return (
                        <span
                          key={w.index}
                          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-blue-600/25 text-blue-200 font-bold font-mono text-sm md:text-base border-2 border-blue-400 ring-2 ring-blue-400/40 shadow-lg shadow-blue-500/20 animate-pulse"
                        >
                          {/* Hiển thị ký tự đang gõ và gạch dưới cho các ký tự còn lại */}
                          <span className="tracking-widest text-blue-100 font-extrabold">
                            {chars.length > 0 ? (
                              <>
                                <span className="text-white font-black">{chars.join(' ')}</span>
                                {remaining > 0 && (
                                  <span className="text-blue-300/80"> {Array.from({ length: remaining }).map(() => '_').join(' ')}</span>
                                )}
                              </>
                            ) : (
                              <span>{Array.from({ length: w.length }).map(() => '_').join(' ')}</span>
                            )}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-400/50">
                            {w.length} ký tự
                          </span>
                        </span>
                      );
                    }

                    // 4. CHƯA TỚI (IDLE) -> Hiển thị chấm tròn và độ dài từ
                    return (
                      <span
                        key={w.index}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/40 text-purple-400/50 font-mono text-sm md:text-base border border-purple-800/30 select-none opacity-60"
                        title={`${w.length} ký tự`}
                      >
                        <span className="tracking-widest">
                          {Array.from({ length: Math.min(6, Math.max(3, w.length)) }).map(() => '•').join('')}
                        </span>
                        <span className="text-[9px] font-mono opacity-70">
                          {w.length}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ô NHẬP LIỆU CHÉP CHÍNH TẢ & CÁC NÚT HỖ TRỢ */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={currentInput}
                disabled={isCurrentCompleted}
                onChange={handleInputChange}
                placeholder={
                  isCurrentCompleted
                    ? 'Bạn đã hoàn thành câu này rồi!'
                    : 'Gõ những gì bạn nghe được vào đây (bấm Ctrl để nghe lại, bấm Tab để mở 1 từ)...'
                }
                rows={3}
                className={`w-full p-4 rounded-2xl font-mono text-base md:text-lg text-white placeholder:text-purple-400/40 outline-none transition resize-none border-2 ${
                  isCurrentCompleted
                    ? `${currentScoreTier.borderColor} bg-black/40 ${currentScoreTier.textColor} cursor-not-allowed`
                    : 'bg-[#1a0827] border-purple-700/60 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20'
                }`}
              />

              {/* Badge điểm số trong ô input khi đã xong */}
              {isCurrentCompleted && (
                <div
                  className={`absolute right-4 top-4 flex items-center space-x-1.5 px-3 py-1 rounded-full font-black text-xs shadow-md border ${currentScoreTier.bgColor} ${currentScoreTier.borderColor} ${currentScoreTier.textColor}`}
                >
                  {currentScoreTier.tier === 'perfect' && <Sparkles size={13} className="text-emerald-400" />}
                  {currentScoreTier.tier === 'medium' && <Zap size={13} className="text-amber-400" />}
                  {currentScoreTier.tier === 'low' && <AlertCircle size={13} className="text-rose-400" />}
                  <span>{currentSentenceScore}đ • {currentScoreTier.label}</span>
                </div>
              )}
            </div>

            {/* THANH ĐIỀU KHIỂN DƯỚI INPUT: NÚT MỞ 1 TỪ, NÚT XÓA, NÚT TIẾP THEO */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2">
                {/* NÚT MỞ 1 TỪ (HINT NEXT WORD) */}
                <button
                  type="button"
                  disabled={isCurrentCompleted}
                  onClick={handleRevealNextWord}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-xs md:text-sm border border-amber-500/40 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95"
                  title="Nhấn phím Tab hoặc bấm vào đây để mở từ tiếp theo (lưu ý: từ gợi ý sẽ coi như sai nguyên từ đó)"
                >
                  <Lightbulb size={16} className="text-amber-400" />
                  <span>Mở 1 từ tiếp theo</span>
                  <span className="text-[10px] opacity-75 hidden sm:inline">(mất điểm từ này)</span>
                  <kbd className="ml-1 px-1.5 py-0.5 rounded bg-amber-950/80 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                    Tab
                  </kbd>
                </button>

                {/* Nút xóa làm lại */}
                {!isCurrentCompleted && currentInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserInputs((prev) => ({ ...prev, [currentSentence.id]: '' }));
                      inputRef.current?.focus();
                    }}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900 text-purple-300 text-xs font-bold transition cursor-pointer border border-purple-700/30"
                  >
                    <RotateCcw size={14} />
                    <span>Xóa nhập lại</span>
                  </button>
                )}
              </div>

              {/* Nút chuyển câu kế tiếp khi đã xong */}
              {isCurrentCompleted && currentIndex < filteredSentences.length - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs md:text-sm transition cursor-pointer shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 animate-pulse"
                >
                  <span>Sang câu tiếp theo</span>
                  <ArrowRight size={16} />
                  <kbd className="ml-1 px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono text-slate-900">
                    Enter
                  </kbd>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. DANH SÁCH TẤT CẢ CÁC CÂU (DRAWER / GRID / LIST) VÀ THỐNG KÊ ĐIỂM CHI TIẾT */}
      <div className="bg-[#240d36] rounded-3xl p-4 md:p-6 border border-purple-800/40 shadow-xl space-y-4">
        {/* Header danh sách: Tiêu đề, Đổi chế độ Grid / List, Nút Reset tất cả */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800/30 pb-3">
          <div className="flex items-center space-x-2">
            <Layers size={18} className="text-cyan-400" />
            <h3 className="font-extrabold text-sm md:text-base text-white">
              Danh sách các câu nghe ({filteredSentences.length} câu)
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {completedInFilter}/{totalInFilter} đã chép
            </span>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* Chuyển đổi Grid / List */}
            <div className="flex items-center bg-purple-950/80 p-1 rounded-xl border border-purple-800/50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
                title="Xem dạng ô lưới"
              >
                <LayoutGrid size={14} />
                <span>Lưới</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
                title="Xem dạng danh sách chi tiết"
              >
                <List size={14} />
                <span>Danh sách</span>
              </button>
            </div>

            {/* Nút Đặt lại tất cả */}
            {completedInFilter > 0 && (
              <button
                type="button"
                onClick={handleResetAllProgress}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-rose-950 text-purple-300 hover:text-rose-200 border border-purple-800/40 hover:border-rose-500/40 text-xs font-bold transition cursor-pointer"
                title="Làm lại tất cả câu nghe chép chính tả của bài này"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Làm lại bài</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh lọc trạng thái câu */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-purple-400 flex items-center mr-1">
            <ListFilter size={13} className="mr-1" /> Lọc trạng thái:
          </span>

          {[
            { key: 'all', label: `Tất cả (${totalInFilter})` },
            { key: 'completed', label: `Đã làm (${completedInFilter})`, color: 'text-emerald-300' },
            { key: 'uncompleted', label: `Chưa làm (${totalInFilter - completedInFilter})`, color: 'text-purple-300' },
            { key: 'perfect', label: `🌟 Perfect (${scoreStats.perfect})`, color: 'text-emerald-400' },
            { key: 'medium', label: `⚡ Medium (${scoreStats.medium})`, color: 'text-amber-400' },
            { key: 'low', label: `⚠️ Cần cố gắng (${scoreStats.low})`, color: 'text-rose-400' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                statusFilter === tab.key
                  ? 'bg-purple-700 text-white border-purple-400 font-black shadow-md'
                  : 'bg-purple-950/60 text-purple-300 border-purple-800/40 hover:bg-purple-900 hover:text-white'
              }`}
            >
              <span className={statusFilter === tab.key ? 'text-white' : tab.color}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* NỘI DUNG HIỂN THỊ THEO DẠNG LƯỚI HOẶC DANH SÁCH */}
        {displayedDrawerSentences.length === 0 ? (
          <div className="py-8 text-center text-purple-400 text-xs font-medium">
            Không có câu nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : viewMode === 'grid' ? (
          /* 1. DẠNG LƯỚI (GRID VIEW) - GOM THEO TỪNG PART */
          <div className="space-y-4 pt-1">
            {activePartFilter === 'all' ? (
              [1, 2, 3, 4].map((pNum) => {
                const items = groupedDrawerByPart[pNum] || [];
                if (items.length === 0) return null;
                const pInfo = partsSummary.find((p) => p.part === pNum);
                return (
                  <div key={pNum} className="space-y-2 bg-purple-950/40 p-3.5 rounded-2xl border border-purple-800/40">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-purple-800/30">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-cyan-300 text-xs">Part {pNum}:</span>
                        <span className="text-white font-bold text-xs">{pInfo?.title}</span>
                        <span className="text-purple-400 text-[11px] font-mono">({items.length} câu)</span>
                      </div>
                      {pInfo?.isCompleted ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border font-mono flex items-center gap-1 ${pInfo.scoreTier?.bgColor} ${pInfo.scoreTier?.borderColor} ${pInfo.scoreTier?.textColor}`}>
                          <Sparkles size={11} />
                          <span>Điểm TB: {pInfo.averageScore}đ • {pInfo.scoreTier?.label}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-purple-400 font-bold">
                          {pInfo?.completedCount}/{pInfo?.totalCount} câu {pNum === 3 || pNum === 4 ? '(Nghe hết bài để nhận điểm)' : ''}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 pt-1">
                      {items.map((item) => renderDrawerButton(item))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 pt-1">
                {displayedDrawerSentences.map((item) => renderDrawerButton(item))}
              </div>
            )}
          </div>
        ) : (
          /* 2. DẠNG DANH SÁCH CHI TIẾT (LIST VIEW) */
          <div className="space-y-2 pt-1 max-h-[500px] overflow-y-auto pr-1">
            {displayedDrawerSentences.map((item) => {
              const isCurrent = item.originalIndex === currentIndex;
              const details = getSentenceDetails(item.sentence.id);

              return (
                <div
                  key={item.sentence.id}
                  onClick={() => setCurrentIndex(item.originalIndex)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-purple-900/60 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
                      : item.isDone
                      ? 'bg-purple-950/50 border-purple-800/40 hover:bg-purple-900/40'
                      : 'bg-purple-950/30 border-purple-900/30 hover:bg-purple-950/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Cột 1: Câu số, Part, Trạng thái & Điểm số */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="flex flex-col items-center justify-center w-14 py-1 rounded-xl bg-purple-900/60 border border-purple-700/50">
                      <span className="text-xs font-mono font-black text-amber-300">
                        #{item.originalIndex + 1}
                      </span>
                      <span className="text-[10px] text-purple-300 font-bold">
                        Part {item.sentence.part}
                      </span>
                    </div>

                    <div>
                      {item.isDone && item.tier ? (
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border flex items-center space-x-1 ${item.tier.bgColor} ${item.tier.borderColor} ${item.tier.textColor}`}
                          >
                            {item.tier.tier === 'perfect' && <Sparkles size={11} className="text-emerald-400" />}
                            {item.tier.tier === 'medium' && <Zap size={11} className="text-amber-400" />}
                            {item.tier.tier === 'low' && <AlertCircle size={11} className="text-rose-400" />}
                            <span>{item.score}đ • {item.tier.label}</span>
                          </span>

                          <div className="flex items-center space-x-2 text-[11px] font-mono text-purple-300 hidden sm:flex">
                            {details.replaysCount > 0 && (
                              <span className="text-rose-300">Nghe lại: {details.replaysCount} lần (-{details.replaysCount * 5}đ)</span>
                            )}
                            {details.mistakesCount > 0 && (
                              <span className="text-rose-300">Sai: {details.mistakesCount} lượt</span>
                            )}
                            {details.hintsCount > 0 && (
                              <span className="text-amber-300">Gợi ý: {details.hintsCount} từ</span>
                            )}
                            {details.mistakesCount === 0 && details.hintsCount === 0 && details.replaysCount === 0 && (
                              <span className="text-emerald-300 font-bold">Hoàn hảo 100đ 🎯</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-900/40 text-purple-400 border border-purple-800/40">
                          Chưa nghe chép chính tả
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cột 2: Nội dung transcript câu */}
                  <div className="flex-1 min-w-0 px-1">
                    {item.isDone ? (
                      <p className="text-sm font-bold text-white truncate font-sans">
                        {item.sentence.text}
                      </p>
                    ) : (
                      <p className="text-xs text-purple-400/80 italic">
                        Bấm vào đây để nghe và chép chính tả câu này ({item.sentence.text.trim().split(/\s+/).length} từ)
                      </p>
                    )}
                  </div>

                  {/* Cột 3: Nút hành động */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                    {item.isDone && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetrySentence(item.sentence.id);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white text-xs font-bold transition cursor-pointer border border-purple-700/40 flex items-center space-x-1"
                        title="Luyện lại câu này"
                      >
                        <RotateCcw size={12} />
                        <span>Luyện lại</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCurrentIndex(item.originalIndex)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                          : 'bg-purple-800/70 hover:bg-purple-700 text-white'
                      }`}
                    >
                      <span>{isCurrent ? 'Đang chọn' : item.isDone ? 'Xem lại' : 'Luyện câu này'}</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
