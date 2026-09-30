import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Volume2, 
  VolumeX, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  Headphones, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Snail, 
  RotateCcw, 
  Lock, 
  Target 
} from 'lucide-react';

export default function ListeningPracticePage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  // Khởi tạo danh sách từ vựng & Deck info
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbProgress, setDbProgress] = useState(0);
  const [deckName, setDeckName] = useState('Bộ từ vựng');
  const [words, setWords] = useState([]);

  // Trọng số in-memory (KHÔNG lưu Database)
  // Mỗi từ khởi tạo trọng số = 5, min = 1, max = 10
  const [weightsMap, setWeightsMap] = useState({});
  const recentHistoryRef = useRef([]);

  // Trạng thái câu hỏi hiện tại
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [listenCount, setListenCount] = useState(1);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [wrongCountdown, setWrongCountdown] = useState(null);

  // Thống kê phiên luyện tập
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);

  // Refs
  const inputRef = useRef(null);
  const audioCtxRef = useRef(null);
  const nextTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Web Audio Context cho hiệu ứng âm thanh
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playEffectSound = useCallback((isCorrect) => {
    if (!soundEffectsEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCorrect) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(146.83, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.error("Audio effect error", e);
    }
  }, [soundEffectsEnabled, getAudioContext]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b']
    });
  };

  // Phát âm từ vựng bằng Web Speech API
  const speakText = useCallback((text, rate = 0.9) => {
    if (!window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('US') || v.name.includes('David'))
      );
      if (enVoice) {
        utterance.voice = enVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech error", err);
    }
  }, []);

  const handlePlayAudio = useCallback((forceSlow = null) => {
    if (!currentWord) return;
    const slow = (forceSlow !== null) ? forceSlow : isSlowMode;
    const rate = slow ? 0.65 : 0.95;
    
    speakText(currentWord.term, rate);

    if (!result) {
      setListenCount(c => c + 1);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord, isSlowMode, result, speakText]);

  // Sinh câu hỏi kế tiếp theo Roulette Wheel Selection (In-Memory)
  const generateNextQuestion = useCallback((wordList, weights) => {
    if (!wordList || wordList.length === 0) return;

    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setUserInput('');
    setResult(null);
    setWrongCountdown(null);
    setShowHint(false);
    setIsLocked(false);
    setListenCount(1);

    const recentQueue = recentHistoryRef.current;
    const cooldownLimit = Math.min(8, Math.max(1, Math.floor(wordList.length / 3)));

    let candidates = wordList.filter(w => !recentQueue.includes(w.id));
    if (candidates.length === 0) {
      candidates = wordList;
    }

    const totalWeight = candidates.reduce((sum, w) => sum + (weights[w.id] || 5), 0);
    let randomVal = Math.random() * totalWeight;
    let chosenWord = candidates[0];

    for (const w of candidates) {
      const wWeight = weights[w.id] || 5;
      randomVal -= wWeight;
      if (randomVal <= 0) {
        chosenWord = w;
        break;
      }
    }

    recentQueue.push(chosenWord.id);
    if (recentQueue.length > cooldownLimit) {
      recentQueue.shift();
    }

    setCurrentWord(chosenWord);

    setTimeout(() => {
      speakText(chosenWord.term, isSlowMode ? 0.65 : 0.95);
      if (inputRef.current) inputRef.current.focus();
    }, 300);

  }, [isSlowMode, speakText]);

  // Tải dữ liệu ban đầu
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listening/practice-init?deckId=${deckId || 2}`);
      if (!res.ok) throw new Error('Không thể tải bộ từ vựng');
      const data = await res.json();
      
      setDeckName(data.deckName || 'Bộ từ vựng');
      setDbProgress(data.listeningProgressPercent || 0);
      setIsUnlocked(Boolean(data.unlocked));

      if (data.words && data.words.length > 0) {
        setWords(data.words);
        // Khởi tạo toàn bộ trọng số ban đầu = 5 (In-Memory)
        const initWeights = {};
        data.words.forEach(w => {
          initWeights[w.id] = 5;
        });
        setWeightsMap(initWeights);
        recentHistoryRef.current = [];

        if (data.unlocked) {
          generateNextQuestion(data.words, initWeights);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [deckId, generateNextQuestion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Nút Reset toàn bộ trọng số về 5
  const handleResetWeights = () => {
    if (!words || words.length === 0) return;
    const initWeights = {};
    words.forEach(w => {
      initWeights[w.id] = 5;
    });
    setWeightsMap(initWeights);
    recentHistoryRef.current = [];
    setStreak(0);
    setScore(0);
    setQuestionCount(1);
    generateNextQuestion(words, initWeights);
  };

  const advanceNextQuestion = useCallback(() => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setWrongCountdown(null);
    setQuestionCount(c => c + 1);
    generateNextQuestion(words, weightsMap);
  }, [words, weightsMap, generateNextQuestion]);

  // Nộp bài chính tả trong Luyện tập
  const handleSubmitSpelling = useCallback((e) => {
    if (e) e.preventDefault();
    if (isLocked || !currentWord || result) return;

    const trimmedInput = userInput.trim().toLowerCase();
    const trimmedTarget = currentWord.term.trim().toLowerCase();

    if (!trimmedInput) return;

    setIsLocked(true);

    const isCorrect = (trimmedInput === trimmedTarget);
    const oldWeight = weightsMap[currentWord.id] || 5;

    let delta = 0;
    let feedback = "";

    // QUY TẮC LUYỆN NGHE:
    // Nghe 1 lần đúng: -2 | Nghe 2-3 lần đúng: -1 | Nghe >3: 0 | Sai: +1
    if (isCorrect) {
      if (listenCount === 1) {
        delta = -2;
        feedback = "⚡ Siêu chuẩn! Nghe 1 lần gõ đúng ngay (-2 trọng số)";
      } else if (listenCount <= 3) {
        delta = -1;
        feedback = `🔥 Rất tốt! Nghe ${listenCount} lần gõ đúng (-1 trọng số)`;
      } else {
        delta = 0;
        feedback = `👌 Chính xác! Đã nghe ${listenCount} lần (Giữ nguyên trọng số)`;
      }
    } else {
      delta = +1;
      feedback = "❌ Chưa đúng chính tả! Trọng số tăng +1 để ôn lại.";
    }

    const newWeight = Math.max(1, Math.min(10, oldWeight + delta));

    // Cập nhật in-memory
    setWeightsMap(prev => ({
      ...prev,
      [currentWord.id]: newWeight
    }));

    setResult({
      isCorrect,
      userTyped: userInput.trim(),
      correctTerm: currentWord.term,
      phonetic: currentWord.phonetic,
      partOfSpeech: currentWord.partOfSpeech,
      meaning: currentWord.meaning,
      listenCount,
      oldWeight,
      newWeight,
      weightDelta: delta,
      feedback
    });

    playEffectSound(isCorrect);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = listenCount === 1 ? 100 : (listenCount <= 3 ? 70 : 40);
      setScore(s => s + points);

      if (newStreak >= 3 && newStreak % 2 === 1) {
        triggerConfetti();
      }

      nextTimeoutRef.current = setTimeout(() => {
        advanceNextQuestion();
      }, 1600);

    } else {
      setStreak(0);
      setWrongCountdown(5);
      speakText(currentWord.term, 0.7);

      let count = 5;
      countdownIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setWrongCountdown(count);
        } else {
          clearInterval(countdownIntervalRef.current);
          setWrongCountdown(null);
          advanceNextQuestion();
        }
      }, 1000);
    }

  }, [isLocked, currentWord, result, userInput, weightsMap, listenCount, streak, playEffectSound, speakText, advanceNextQuestion]);

  const handleSkipWait = useCallback(() => {
    advanceNextQuestion();
  }, [advanceNextQuestion]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === 'Space' || e.key === 'Enter') && result && !result.isCorrect) {
        e.preventDefault();
        handleSkipWait();
        return;
      }
      if (e.key === 'Control' || e.key === 'Alt') {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result, handlePlayAudio, handleSkipWait]);

  useEffect(() => {
    return () => {
      if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Tính điểm phiên luyện tập in-memory:
  // weight = 1 (1.0đ) | weight < 3 (0.5đ) | weight >= 3 (0đ)
  const totalWords = words.length;
  const masteredCount = Object.values(weightsMap).filter(w => w === 1).length;
  const learningCount = Object.values(weightsMap).filter(w => w > 1 && w < 3).length;
  const practiceProgressPercent = totalWords > 0 
    ? Math.round((((masteredCount * 1.0) + (learningCount * 0.5)) / totalWords) * 1000) / 10 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#240f32] text-white flex flex-col items-center justify-center font-['Quicksand'] p-4 select-none">
        <RefreshCw size={36} className="animate-spin text-cyan-400 mb-3" />
        <div className="text-xl font-bold text-cyan-200">Đang tải Chế độ Luyện tập nghe tự do...</div>
      </div>
    );
  }

  // MÀN HÌNH KHÓA NẾU TIẾN ĐỘ NGHE CHƯA ĐẠT 100%
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#1f0d2b] text-white flex flex-col items-center justify-center p-4 font-['Quicksand'] select-none">
        <div className="max-w-md w-full bg-[#321345] rounded-3xl p-8 border border-purple-800/40 text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Chế độ Luyện tập đang bị khóa</h2>
            <p className="text-purple-300 text-sm mt-2">
              Bạn cần hoàn thành <b>100%</b> tiến độ <b>Học nghe chính tả</b> của bộ thẻ <b>"{deckName}"</b> để mở khóa mục này.
            </p>
          </div>

          <div className="bg-purple-950/60 p-4 rounded-2xl border border-purple-800/40 space-y-2 text-left">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-purple-300">Tiến độ Nghe hiện tại:</span>
              <span className="text-cyan-400 font-mono">{dbProgress.toFixed(1)}% / 100%</span>
            </div>
            <div className="w-full h-3 bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-800">
              <div 
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(dbProgress > 0 ? 4 : 0, dbProgress))}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate(`/deck/${deckId || 2}/listening`)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Headphones size={16} />
              <span>Vào Học nghe chính tả ngay</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-purple-300 font-bold text-xs transition cursor-pointer"
            >
              Quay về Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH LUYỆN TẬP TỰ DO KHI ĐÃ ĐẠT 100%
  return (
    <div className="min-h-screen bg-[#240f32] text-white flex flex-col justify-between p-3 md:p-6 select-none font-['Quicksand']">
      
      {/* 1. TOP HEADER & THANH TIẾN ĐỘ PHIÊN LUYỆN TẬP */}
      <div className="w-full max-w-5xl mx-auto space-y-2.5">
        <header className="flex items-center justify-between py-2 px-3.5 bg-[#38184c] rounded-2xl shadow-xl border border-purple-800/40">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold transition border border-purple-700/50 cursor-pointer shadow-sm"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Bộ thẻ</span>
            </button>

            <div className="bg-purple-950/60 px-3 py-1.5 rounded-xl font-bold text-xs text-purple-200 shadow-inner">
              Q. {questionCount}
            </div>
            
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all duration-300 ${
              streak > 0 
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 scale-105 shadow-md shadow-amber-500/20' 
                : 'bg-purple-950/40 border-purple-800/30 text-purple-400'
            }`}>
              <Flame size={14} className={streak > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-purple-400'} />
              <span>{streak} chuỗi</span>
            </div>
          </div>

          {/* Badge Luyện tập tự do */}
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-teal-950/60 border border-teal-500/40 text-teal-300 text-xs font-black shadow-sm">
            <Target size={13} className="text-teal-400" />
            <span className="hidden sm:inline">Luyện tập nghe tự do (In-Memory)</span>
            <span className="text-[10px] sm:hidden">Luyện tập</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-teal-600/30 to-emerald-600/30 border border-teal-500/40 px-3 py-1.5 rounded-xl font-black text-teal-300 text-xs shadow-inner">
              <Coins size={14} className="text-yellow-400" />
              <span>{score.toLocaleString()}</span>
            </div>

            <button
              onClick={handleResetWeights}
              className="p-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-300 hover:text-white transition border border-purple-700/40 cursor-pointer"
              title="Làm mới toàn bộ trọng số về 5"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* THANH TIẾN ĐỘ PHIÊN LUYỆN TẬP */}
        <div className="bg-[#321345] rounded-2xl p-3 border border-purple-800/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 text-xs">
            <div className="flex items-center space-x-2">
              <Headphones size={15} className="text-teal-400" />
              <span className="font-extrabold text-white text-sm">{deckName}</span>
              <span className="text-teal-400/80 font-medium text-xs">&bull; Tiến độ Phiên Luyện tập</span>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-bold">
              <span className="text-teal-300">
                Thuộc lầu (1.0đ): <b>{masteredCount}</b>
              </span>
              <span className="text-cyan-300">
                Đang nhớ (0.5đ): <b>{learningCount}</b>
              </span>
              <span className="text-purple-300">
                Cần luyện: <b>{totalWords - masteredCount - learningCount}</b>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-teal-950/80 text-teal-300 font-mono font-black border border-teal-600/40 text-xs">
                {practiceProgressPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="w-full h-3 bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-800/50 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(practiceProgressPercent > 0 ? 3 : 0, practiceProgressPercent))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC THỬ THÁCH NGHE */}
      <div className="w-full max-w-3xl mx-auto my-auto py-4">
        <div className="bg-[#38184c] rounded-3xl p-6 md:p-8 shadow-2xl border border-purple-700/40 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between text-xs mb-6 text-purple-300">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-xl bg-purple-950/70 border border-purple-700/40 text-purple-200 font-extrabold">
                {currentWord?.partOfSpeech || 'collocation'}
              </span>
              <span className="text-[11px] text-purple-400 font-mono">
                Trọng số: <b className="text-teal-300">{weightsMap[currentWord?.id] || 5}</b>
              </span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-purple-950/70 border border-purple-700/40 font-bold text-xs">
              <Headphones size={13} className="text-teal-400" />
              <span>Đã nghe: <b className="text-white">{listenCount}</b> lần</span>
            </div>
          </div>

          {/* AUDIO BUTTON */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative group">
              <button
                type="button"
                onClick={() => handlePlayAudio(false)}
                className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-500 hover:to-cyan-500 active:scale-95 text-white flex flex-col items-center justify-center shadow-xl shadow-teal-900/40 transition-all duration-200 transform group-hover:scale-105 cursor-pointer border-2 border-teal-400/40"
              >
                <Volume2 size={44} className="text-white drop-shadow-md animate-pulse" />
                <span className="text-xs font-black tracking-wider uppercase mt-1 text-teal-100">Phát âm</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayAudio(true)}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-[#260e34] hover:bg-purple-900 text-teal-300 border border-teal-500/40 shadow-lg cursor-pointer transition transform hover:scale-110"
                title="Nghe tốc độ chậm"
              >
                <Snail size={18} />
              </button>
            </div>

            <p className="text-xs text-purple-300/80 mt-3 font-medium">
              Bấm phím <b>Ctrl</b> hoặc <b>Alt</b> để nghe lại âm thanh
            </p>
          </div>

          {/* GỢI Ý */}
          <div className="mb-6">
            {!showHint ? (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-xs text-purple-400 hover:text-teal-300 flex items-center justify-center gap-1 mx-auto transition cursor-pointer"
              >
                <Eye size={13} />
                <span>Xem gợi ý nghĩa tiếng Việt</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-950/80 border border-purple-700/50 text-purple-200 text-xs font-semibold animate-fadeIn">
                <HelpCircle size={14} className="text-yellow-400 flex-shrink-0" />
                <span>Nghĩa: <b>{currentWord?.meaning}</b></span>
                <button
                  type="button"
                  onClick={() => setShowHint(false)}
                  className="text-purple-400 hover:text-white ml-1 cursor-pointer"
                >
                  <EyeOff size={13} />
                </button>
              </div>
            )}
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSubmitSpelling} className="max-w-xl mx-auto">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                disabled={isLocked || result !== null}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Gõ lại từ hoặc cụm từ bạn vừa nghe..."
                className={`w-full py-4 px-6 rounded-2xl bg-purple-950/80 border-2 text-white font-mono text-lg md:text-xl text-center placeholder-purple-400/50 focus:outline-none transition-all duration-200 shadow-inner ${
                  result
                    ? (result.isCorrect ? 'border-emerald-500 bg-emerald-950/30' : 'border-rose-500 bg-rose-950/30')
                    : 'border-purple-600/50 focus:border-teal-400 focus:shadow-lg focus:shadow-teal-500/20'
                }`}
              />

              {!result && (
                <button
                  type="submit"
                  disabled={!userInput.trim() || isLocked}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  Kiểm tra &crarr;
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-purple-400/70 mt-2 px-2">
              <span>Trọng số ban đầu 5 &bull; Reset về 5 mỗi lần luyện tập</span>
              <span>Bấm <b>Enter</b> để nộp</span>
            </div>
          </form>

          {/* KẾT QUẢ */}
          {result && (
            <div className={`mt-6 p-5 rounded-2xl border transition-all animate-fadeIn ${
              result.isCorrect 
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200' 
                : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center justify-center space-x-2 text-base md:text-lg font-black mb-2">
                {result.isCorrect ? (
                  <>
                    <CheckCircle2 size={24} className="text-emerald-400" />
                    <span className="text-emerald-300">Chính xác tuyệt vời!</span>
                  </>
                ) : (
                  <>
                    <XCircle size={24} className="text-rose-400" />
                    <span className="text-rose-300">Chưa chính xác!</span>
                  </>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <div className="font-mono text-lg font-black text-white">
                  {result.correctTerm}
                  {result.phonetic && <span className="text-sm font-normal text-purple-300 ml-2">/{result.phonetic}/</span>}
                </div>
                <div className="text-purple-200 font-semibold text-xs">
                  {result.meaning}
                </div>
                {!result.isCorrect && (
                  <div className="text-rose-300 text-xs">
                    Bạn đã gõ: <span className="font-mono line-through opacity-80">{result.userTyped || '(để trống)'}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-purple-800/40 flex items-center justify-between text-xs font-bold">
                <span className="text-purple-200">{result.feedback}</span>
                <span className="font-mono px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-700/50">
                  Trọng số: <b className="text-white">{result.oldWeight}</b> &rarr; <b className={result.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{result.newWeight}</b>
                </span>
              </div>

              {!result.isCorrect && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkipWait}
                    className="px-5 py-2 rounded-xl bg-purple-800 hover:bg-purple-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-md"
                  >
                    <span>Tiếp tục ngay</span>
                    {wrongCountdown !== null && <span className="opacity-75 font-mono">({wrongCountdown}s)</span>}
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 3. FOOTER */}
      <footer className="w-full max-w-5xl mx-auto py-2 flex items-center justify-between text-[11px] text-purple-400/60 border-t border-purple-900/40">
        <div>
          Chế độ Luyện tập In-Memory &bull; Không lưu Database &bull; Reset trọng số bất cứ lúc nào
        </div>
        <div>
          Vocabulary Quizizz &bull; Luyện nghe chính tả
        </div>
      </footer>

    </div>
  );
}
