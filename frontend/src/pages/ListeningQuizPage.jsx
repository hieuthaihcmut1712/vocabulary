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
  Zap, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  Clock,
  BookOpen,
  Trophy,
  RotateCcw,
  Headphones,
  HelpCircle,
  Eye,
  EyeOff,
  Snail
} from 'lucide-react';

export default function ListeningQuizPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  // Khởi tạo danh sách từ vựng & Deck info
  const [loading, setLoading] = useState(true);
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

  // Thống kê trận đấu
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);

  // Refs
  const inputRef = useRef(null);
  const audioCtxRef = useRef(null);
  const nextTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Web Audio Context cho hiệu ứng âm thanh Đúng/Sai
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
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now); // A3
        osc.frequency.setValueAtTime(146.83, now + 0.12); // D3
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
      colors: ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c']
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

  // Bấm nút nghe lại (tăng listenCount)
  const handlePlayAudio = useCallback((forceSlow = null) => {
    if (!currentWord) return;
    const slow = (forceSlow !== null) ? forceSlow : isSlowMode;
    const rate = slow ? 0.65 : 0.95;
    
    speakText(currentWord.term, rate);

    // Tăng số lần nghe nếu chưa chốt kết quả
    if (!result) {
      setListenCount(c => c + 1);
    }

    // Auto focus lại ô nhập
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord, isSlowMode, result, speakText]);

  // Sinh câu hỏi kế tiếp theo Roulette Wheel
  const generateNextQuestion = useCallback((wordList, weights) => {
    if (!wordList || wordList.length === 0) return;

    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setUserInput('');
    setResult(null);
    setWrongCountdown(null);
    setShowHint(false);
    setIsLocked(false);
    setListenCount(1); // Lần nghe đầu tiên

    // Cooldown buffer
    const recentQueue = recentHistoryRef.current;
    const cooldownLimit = Math.min(8, Math.max(1, Math.floor(wordList.length / 3)));

    let candidates = wordList.filter(w => !recentQueue.includes(w.id));
    if (candidates.length === 0) {
      candidates = wordList;
    }

    // Roulette wheel sampling theo trọng số
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

    // Tự động phát âm ngay khi chuyển câu
    setTimeout(() => {
      speakText(chosenWord.term, 0.95);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);

  }, [speakText]);

  // Tải từ vựng từ Backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/practice-init?deckId=${deckId || 2}`);
      if (!res.ok) throw new Error('Không thể tải bộ từ vựng');
      const data = await res.json();
      
      setDeckName(data.deckName || 'Bộ từ vựng');
      if (data.words && data.words.length > 0) {
        setWords(data.words);
        // Trọng số ban đầu = 5
        const initWeights = {};
        data.words.forEach(w => {
          initWeights[w.id] = 5;
        });
        setWeightsMap(initWeights);
        recentHistoryRef.current = [];
        generateNextQuestion(data.words, initWeights);
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

  // Reset về trọng số 5
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

  // Chuyển sang câu hỏi kế tiếp
  const advanceNextQuestion = useCallback(() => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setWrongCountdown(null);
    setQuestionCount(c => c + 1);
    generateNextQuestion(words, weightsMap);
  }, [words, weightsMap, generateNextQuestion]);

  // Xử lý nộp bài chính tả
  const handleSubmitSpelling = useCallback((e) => {
    if (e) e.preventDefault();
    if (isLocked || !currentWord || result) return;

    const trimmedInput = userInput.trim().toLowerCase();
    const trimmedTarget = currentWord.term.trim().toLowerCase();

    if (!trimmedInput) return; // Chưa nhập gì

    setIsLocked(true);

    const isCorrect = (trimmedInput === trimmedTarget);
    const oldWeight = weightsMap[currentWord.id] || 5;

    let delta = 0;
    let feedback = "";

    // QUY TẮC TRỌNG SỐ LUYỆN NGHE:
    // - Nghe 1 lần và gõ đúng: GIẢM 2 (-2)
    // - Nghe 2-3 lần và gõ đúng: GIẢM 1 (-1)
    // - Nghe > 3 lần: KHÔNG GIẢM (0)
    // - Sai: TĂNG 1 (+1)
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

    // Giới hạn min = 1, max = 10
    const newWeight = Math.max(1, Math.min(10, oldWeight + delta));

    // Cập nhật weightsMap in-memory
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

      // Phát âm lại từ đúng để người học ghi nhớ
      setTimeout(() => {
        speakText(currentWord.term, 0.85);
      }, 400);

      let seconds = 5;
      countdownIntervalRef.current = setInterval(() => {
        seconds -= 1;
        setWrongCountdown(seconds);
        if (seconds <= 0) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);

      nextTimeoutRef.current = setTimeout(() => {
        advanceNextQuestion();
      }, 5000);
    }

  }, [isLocked, currentWord, result, userInput, weightsMap, listenCount, streak, playEffectSound, speakText, advanceNextQuestion]);

  // Phím tắt:
  // - Ctrl hoặc Alt: Nghe lại âm thanh
  // - Space / Enter khi sai: Tiếp tục ngay
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Khi đang xem kết quả sai, bấm Space hoặc Enter để bỏ qua 5s
      if ((e.code === 'Space' || e.key === 'Enter') && result && !result.isCorrect) {
        e.preventDefault();
        advanceNextQuestion();
        return;
      }

      // Phím tắt nghe lại âm thanh: Ctrl hoặc Alt
      if (e.key === 'Control' || e.key === 'Alt') {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result, handlePlayAudio, advanceNextQuestion]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Thống kê tiến độ Luyện nghe:
  // Trọng số = 1: 1.0đ | Trọng số < 3: 0.5đ | Trọng số >= 3: 0đ
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
        <div className="text-xl font-bold text-cyan-200">Đang khởi tạo Quizz Luyện nghe chính tả...</div>
        <div className="text-xs text-purple-400 mt-1">Trọng số khởi đầu 5 &bull; Phát âm tiếng Anh tự nhiên</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#240f32] text-white flex flex-col justify-between p-3 md:p-6 select-none font-['Quicksand']">
      
      {/* 1. TOP HEADER & TIẾN ĐỘ BỘ THẺ */}
      <div className="w-full max-w-5xl mx-auto space-y-2.5">
        
        {/* TOP HEADER */}
        <header className="flex items-center justify-between py-2 px-3.5 bg-[#38184c] rounded-2xl shadow-xl border border-purple-800/40">
          
          {/* Nhóm trái */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold transition border border-purple-700/50 cursor-pointer shadow-sm"
              title="Quay lại danh sách bộ thẻ"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Bộ thẻ</span>
            </button>

            <div className="bg-purple-950/60 px-3 py-1.5 rounded-xl font-bold text-xs text-purple-200 shadow-inner">
              Q. {questionCount}
            </div>
            
            {/* Streak */}
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all duration-300 ${
              streak > 0 
                ? 'bg-gradient-to-r from-orange-600/30 to-red-600/30 border-orange-500/40 text-orange-400 scale-105' 
                : 'bg-purple-950/40 border-purple-900/40 text-purple-400'
            }`}>
              <Flame size={15} className={streak > 0 ? "animate-bounce text-orange-400" : ""} />
              <span>Streak:</span>
              <span className="font-extrabold text-sm">{streak}</span>
            </div>

            {/* Mode badge */}
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Headphones size={12} /> Luyện nghe chính tả
            </span>
          </div>

          {/* Nhóm phải: Trọng số, Điểm số, Reset */}
          <div className="flex items-center space-x-2">
            <div className="bg-purple-950/60 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-300 flex items-center space-x-1.5 border border-purple-900/30">
              <Sparkles size={13} className="text-yellow-400" />
              <span className="hidden md:inline">Trọng số:</span>
              <span className="text-yellow-300 font-bold text-sm">
                {currentWord ? (weightsMap[currentWord.id] || 5) : 5}/10
              </span>
            </div>

            <div className="bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1 text-amber-300 font-bold text-xs shadow-sm">
              <Coins size={14} className="text-amber-400" />
              <span>{score}</span>
            </div>

            <button
              onClick={handleResetWeights}
              title="Reset toàn bộ trọng số về 5 để luyện nghe lại từ đầu"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold transition border border-purple-700/50 cursor-pointer shadow-sm"
            >
              <RotateCcw size={13} className="text-cyan-400" />
              <span className="hidden sm:inline">Reset về 5</span>
            </button>
          </div>
        </header>

        {/* THANH TIẾN ĐỘ BỘ THẺ */}
        <div className="w-full py-2 px-4 bg-[#311444]/90 backdrop-blur rounded-2xl border border-purple-700/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-1.5">
              <BookOpen size={16} className="text-cyan-400" />
              <span className="font-extrabold text-sm text-purple-100">{deckName}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-700/40">
              <span className="text-[11px] text-purple-300 font-semibold">Tiến độ nghe:</span>
              <span className="font-black text-cyan-400 font-mono text-sm">{practiceProgressPercent.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex-1 w-full md:mx-4">
            <div className="w-full bg-purple-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-purple-800/40 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, Math.max(practiceProgressPercent > 0 ? 3 : 0, practiceProgressPercent))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
              <Trophy size={12} className="text-emerald-400" /> {masteredCount} thuộc (1đ)
            </span>
            <span className="flex items-center gap-1 text-teal-300 bg-teal-950/40 px-2.5 py-0.5 rounded-lg border border-teal-500/30">
              <Zap size={12} className="text-teal-400" /> {learningCount} nhớ (&lt;3: 0.5đ)
            </span>
          </div>
        </div>

      </div>

      {/* 2. KHU VỰC LUYỆN NGHE & GÕ CHÍNH TẢ TRUNG TÂM */}
      <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center my-6 text-center">
        {currentWord && (
          <div className="w-full space-y-6">

            {/* THẺ PHÁT ÂM AUDIO */}
            <div className="bg-gradient-to-b from-[#38184c] to-[#290e38] rounded-3xl p-6 md:p-8 border border-purple-700/40 shadow-2xl relative overflow-hidden">
              
              {/* Vòng sáng audio animation */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Nút Loa to phát âm */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <button
                  type="button"
                  onClick={() => handlePlayAudio()}
                  className="group relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-center shadow-2xl shadow-cyan-600/40 transform active:scale-95 transition-all duration-200 cursor-pointer border-4 border-cyan-400/40"
                  title="Bấm hoặc nhấn phím Ctrl để nghe lại"
                >
                  <Volume2 size={46} className="group-hover:scale-110 transition-transform text-white animate-pulse" />
                  
                  {/* Ripple pulse ring */}
                  <span className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping pointer-events-none" />
                </button>

                <div className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                  <span>Bấm vào loa hoặc nhấn phím</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-700/60 font-mono text-cyan-300 text-[11px] font-bold">
                    Ctrl
                  </kbd>
                  <span>để nghe lại</span>
                </div>
              </div>

              {/* THANH ĐIỀU KHIỂN ÂM THANH & SỐ LẦN NGHE */}
              <div className="mt-6 pt-4 border-t border-purple-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                {/* Badge số lần nghe & Quy tắc áp dụng */}
                <div className="flex items-center space-x-2">
                  <span className="text-purple-300">Đã nghe:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-950 font-mono font-black text-cyan-300 border border-purple-700/50">
                    {listenCount} lần
                  </span>

                  {/* Nhãn giải thích quy tắc điểm */}
                  {listenCount === 1 ? (
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      ⚡ Đúng lần 1: Giảm 2 trọng số (-2)
                    </span>
                  ) : listenCount <= 3 ? (
                    <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      🔥 Đúng lần 2-3: Giảm 1 trọng số (-1)
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-500/30">
                      👌 Đúng lần &gt;3: Giữ nguyên (0)
                    </span>
                  )}
                </div>

                {/* Chế độ nghe chậm (Turtle) & Gợi ý */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSlowMode(!isSlowMode);
                      handlePlayAudio(!isSlowMode);
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isSlowMode 
                        ? 'bg-amber-600/30 border-amber-500/60 text-amber-300' 
                        : 'bg-purple-950/60 border-purple-800/40 text-purple-300 hover:text-white'
                    }`}
                    title="Nghe tốc độ chậm"
                  >
                    <Snail size={14} />
                    <span>{isSlowMode ? 'Chậm 0.7x' : 'Bình thường'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-purple-950/60 hover:bg-purple-800/50 border border-purple-800/40 text-purple-300 text-xs font-bold transition cursor-pointer"
                    title="Gợi ý nghĩa và số chữ cái"
                  >
                    <HelpCircle size={14} className="text-cyan-400" />
                    <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý'}</span>
                  </button>
                </div>

              </div>

              {/* KHUNG GỢI Ý (NẾU BẬT) */}
              {showHint && (
                <div className="mt-3 p-3 bg-purple-950/80 rounded-2xl border border-cyan-500/30 text-xs text-left animate-fade-in flex items-center justify-between">
                  <div>
                    <span className="text-cyan-400 font-bold uppercase tracking-wider block">Gợi ý từ vựng:</span>
                    <span className="text-purple-200 mt-0.5 block">
                      👉 Nghĩa: <b>{currentWord.meaning}</b> ({currentWord.partOfSpeech})
                    </span>
                  </div>
                  <div className="text-right font-mono text-cyan-300 bg-purple-900/60 px-3 py-1 rounded-xl border border-purple-700/40">
                    {currentWord.term.length} chữ cái
                  </div>
                </div>
              )}

            </div>

            {/* FORM NHẬP CHÍNH TẢ */}
            <form onSubmit={handleSubmitSpelling} className="w-full space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  disabled={isLocked || result !== null}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Gõ từ bạn nghe được và nhấn Enter..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full py-4 px-6 rounded-2xl bg-[#38184c] border-2 border-purple-600/50 focus:border-cyan-400 text-white font-extrabold text-xl md:text-2xl text-center placeholder-purple-400/50 outline-none shadow-2xl transition-all duration-200"
                />

                {/* Nút gửi Enter */}
                <button
                  type="submit"
                  disabled={isLocked || !userInput.trim()}
                  className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-extrabold text-sm transition shadow flex items-center justify-center cursor-pointer"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="text-xs text-purple-400/80 font-medium">
                * Nhập chính tả (không phân biệt chữ hoa/thường), sau đó nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-purple-950 font-bold border border-purple-800 text-purple-200">Enter</kbd>
              </div>
            </form>

            {/* BANNER PHẢN HỒI KHI ĐÚNG */}
            {result && result.isCorrect && (
              <div className="animate-bounce-pop p-4 rounded-3xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/50 text-emerald-200 shadow-2xl space-y-2">
                <div className="flex items-center justify-center space-x-2 text-base font-extrabold text-emerald-300">
                  <CheckCircle2 size={22} className="text-emerald-400" />
                  <span>{result.feedback}</span>
                </div>

                <div className="border-t border-emerald-500/30 pt-2 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
                  <div className="text-left">
                    <span className="text-white text-lg font-black">{result.correctTerm}</span>
                    <span className="text-emerald-300 ml-2 font-mono">/{result.phonetic}/</span>
                    <span className="text-emerald-400/80 ml-2">({result.partOfSpeech})</span>
                    <div className="text-emerald-300 text-xs">{result.meaning}</div>
                  </div>

                  <div className="bg-black/30 px-3 py-1.5 rounded-xl font-mono text-xs">
                    Trọng số: <b className="text-white">{result.oldWeight}</b> ➔ <b className="text-white">{result.newWeight}</b> ({result.weightDelta})
                  </div>
                </div>
              </div>
            )}

            {/* BOX 5 GIÂY GHI NHỚ KHI SAI */}
            {result && !result.isCorrect && (
              <div className="w-full bg-gradient-to-br from-rose-950/90 via-purple-950/90 to-purple-900/90 border-2 border-rose-500/60 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-left space-y-3 animate-fade-in">
                
                {/* Thanh đếm ngược 5s */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-900/60 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${(wrongCountdown / 5) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                    <XCircle size={18} />
                    <span>CHƯA ĐÚNG! HÃY XEM CHÍNH TẢ ĐÚNG:</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Clock size={13} className="animate-spin" />
                    <span>Chuyển sau {wrongCountdown}s</span>
                  </div>
                </div>

                <div className="bg-purple-950/70 p-3.5 rounded-2xl border border-purple-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-rose-400 uppercase font-bold block">Bạn đã gõ:</span>
                    <span className="text-base font-bold text-rose-300 line-through">
                      {result.userTyped || "(Để trống)"}
                    </span>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-xs text-emerald-400 uppercase font-bold block">Chính tả chính xác:</span>
                    <span className="text-2xl font-black text-emerald-300">
                      {result.correctTerm}
                    </span>
                    <span className="text-xs text-purple-300 block font-mono">
                      /{result.phonetic}/ &bull; {result.meaning}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="text-purple-300">
                    Trọng số: <b className="text-rose-400">{result.oldWeight} ➔ {result.newWeight} (+1)</b>
                  </div>

                  <button
                    type="button"
                    onClick={advanceNextQuestion}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition shadow border border-purple-500/40 cursor-pointer"
                  >
                    <span>Tiếp tục ngay (Space)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            )}

          </div>
        )}
      </main>

      {/* 3. FOOTER HƯỚNG DẪN */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-purple-400/80 px-2 pt-3 border-t border-purple-900/40 gap-2">
        <div className="flex items-center space-x-3">
          <span>⌨️ Phím tắt:</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-200 font-bold">Ctrl</kbd> Nghe lại</span>
          <span>&bull;</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-200 font-bold">Enter</kbd> Nộp bài</span>
          <span>&bull;</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-200 font-bold">Space</kbd> Bỏ qua khi sai</span>
        </div>

        <button 
          onClick={() => setSoundEffectsEnabled((v) => !v)}
          className="flex items-center space-x-1.5 hover:text-white transition px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-900/30 cursor-pointer"
        >
          {soundEffectsEnabled ? <Volume2 size={15} className="text-cyan-400" /> : <VolumeX size={15} className="text-gray-400" />}
          <span>{soundEffectsEnabled ? 'Âm hiệu ứng: Bật' : 'Âm hiệu ứng: Tắt'}</span>
        </button>
      </footer>

    </div>
  );
}
