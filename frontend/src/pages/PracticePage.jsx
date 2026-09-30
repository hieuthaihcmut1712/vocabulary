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
  Lock,
  RotateCcw
} from 'lucide-react';

const CARD_THEMES = [
  'quiz-card-blue',
  'quiz-card-teal',
  'quiz-card-yellow',
  'quiz-card-red'
];

export default function PracticePage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  // Khởi tạo và kiểm tra mở khóa
  const [loading, setLoading] = useState(true);
  const [initData, setInitData] = useState(null);
  const [words, setWords] = useState([]);

  // Trọng số in-memory (KHÔNG lưu Database)
  // Mỗi từ khởi tạo trọng số = 5, min = 1, max = 10
  const [weightsMap, setWeightsMap] = useState({});
  const recentHistoryRef = useRef([]);

  // Trạng thái câu hỏi hiện tại
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [result, setResult] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [wrongCountdown, setWrongCountdown] = useState(null);

  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const nextTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Audio Context Web Audio API
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

  const playSound = useCallback((isCorrect) => {
    if (!soundEnabled) return;
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
      console.error("Audio error", e);
    }
  }, [soundEnabled, getAudioContext]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c']
    });
  };

  // Phát âm từ tiếng Anh bằng Web Speech API
  const speakText = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('US') || v.name.includes('David'))
      );
      if (enVoice) {
        utterance.voice = enVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech error", e);
    }
  }, []);

  // Sinh câu hỏi kế tiếp theo Roulette Wheel Selection (trọng số cao xuất hiện nhiều hơn)
  const generateNextQuestion = useCallback((wordList, weights) => {
    if (!wordList || wordList.length === 0) return;

    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setSelectedIdx(null);
    setResult(null);
    setWrongCountdown(null);
    setElapsedTime(0);
    setIsLocked(false);

    // 1. Cooldown buffer (bỏ qua 5-8 từ vừa xuất hiện gần nhất)
    const recentQueue = recentHistoryRef.current;
    const cooldownLimit = Math.min(8, Math.max(1, Math.floor(wordList.length / 3)));

    let candidates = wordList.filter(w => !recentQueue.includes(w.id));
    if (candidates.length === 0) {
      candidates = wordList;
    }

    // 2. Tính tổng trọng số và bốc ngẫu nhiên (Roulette wheel)
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

    // Cập nhật recent cooldown queue
    recentQueue.push(chosenWord.id);
    if (recentQueue.length > cooldownLimit) {
      recentQueue.shift();
    }

    // 3. Sinh 3 đáp án nhiễu (distractors)
    const otherWords = wordList.filter(w => w.id !== chosenWord.id && w.meaning !== chosenWord.meaning);
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3).map(w => w.meaning);

    // Trộn 4 đáp án (1 đúng + 3 nhiễu)
    const allOptions = [chosenWord.meaning, ...distractors].sort(() => 0.5 - Math.random());

    setCurrentQuestion({
      wordId: chosenWord.id,
      term: chosenWord.term,
      partOfSpeech: chosenWord.partOfSpeech,
      phonetic: chosenWord.phonetic,
      meaning: chosenWord.meaning,
      currentWeight: weights[chosenWord.id] || 5,
      options: allOptions
    });

    // Bắt đầu bấm giờ phản xạ 60fps
    startTimeRef.current = performance.now();
    const tick = () => {
      const now = performance.now();
      const diff = (now - startTimeRef.current) / 1000;
      setElapsedTime(diff);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

    // Tự động phát âm từ tiếng Anh khi xuất hiện câu hỏi
    setTimeout(() => {
      speakText(chosenWord.term);
    }, 250);

  }, [speakText]);

  // Tải thông tin deck và danh sách từ vựng từ Backend
  const loadPracticeData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/practice-init?deckId=${deckId || 2}`);
      if (!res.ok) throw new Error('Không thể tải thông tin luyện tập');
      const data = await res.json();
      setInitData(data);

      if (data.unlocked && data.words && data.words.length > 0) {
        setWords(data.words);
        // Khởi tạo trọng số toàn bộ về 5
        const initialWeights = {};
        data.words.forEach(w => {
          initialWeights[w.id] = 5;
        });
        setWeightsMap(initialWeights);
        recentHistoryRef.current = [];
        generateNextQuestion(data.words, initialWeights);
      }
    } catch (err) {
      console.error("Lỗi khởi tạo luyện tập:", err);
    } finally {
      setLoading(false);
    }
  }, [deckId, generateNextQuestion]);

  useEffect(() => {
    loadPracticeData();
  }, [loadPracticeData]);

  // Reset toàn bộ trọng số về 5
  const handleResetWeights = () => {
    if (!words || words.length === 0) return;
    const initialWeights = {};
    words.forEach(w => {
      initialWeights[w.id] = 5;
    });
    setWeightsMap(initialWeights);
    recentHistoryRef.current = [];
    setStreak(0);
    setScore(0);
    setQuestionCount(1);
    generateNextQuestion(words, initialWeights);
  };

  // Chuyển sang câu hỏi kế tiếp
  const advanceNextQuestion = useCallback(() => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setWrongCountdown(null);
    setQuestionCount(c => c + 1);
    generateNextQuestion(words, weightsMap);
  }, [words, weightsMap, generateNextQuestion]);

  // Xử lý nộp câu trả lời (HOÀN TOÀN IN-MEMORY - KHÔNG GỌI API SUBMIT)
  const handleSelectOption = useCallback((index) => {
    if (isLocked || !currentQuestion || selectedIdx !== null) return;
    setIsLocked(true);
    setSelectedIdx(index);
    if (currentQuestion?.term) {
      speakText(currentQuestion.term);
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const finalResponseTime = Math.round(elapsedTime * 100) / 100;
    const selectedMeaning = currentQuestion.options[index];
    const isCorrect = (selectedMeaning === currentQuestion.meaning);

    const oldWeight = weightsMap[currentQuestion.wordId] || 5;
    let delta = 0;
    let feedback = "";

    if (isCorrect) {
      if (finalResponseTime < 1.5) {
        delta = -3;
        feedback = "⚡ Phản xạ siêu tốc (< 1.5s)!";
      } else if (finalResponseTime < 3.0) {
        delta = -2;
        feedback = "🔥 Nhớ rất tốt (< 3s)!";
      } else if (finalResponseTime < 5.0) {
        delta = -1;
        feedback = "👍 Đúng rồi (< 5s)!";
      } else {
        delta = 0;
        feedback = "👌 Đúng nhưng cần tăng tốc (≥ 5s)";
      }
    } else {
      delta = +2;
      feedback = "❌ Chưa chính xác! Trọng số tăng lên để ôn lại.";
    }

    // Trọng số min = 1, max = 10 (theo quy tắc Chế độ Luyện tập)
    const newWeight = Math.max(1, Math.min(10, oldWeight + delta));

    // Cập nhật weightsMap trong State
    setWeightsMap(prev => ({
      ...prev,
      [currentQuestion.wordId]: newWeight
    }));

    setResult({
      isCorrect,
      correctMeaning: currentQuestion.meaning,
      oldWeight,
      newWeight,
      weightDelta: delta,
      responseTimeSeconds: finalResponseTime,
      feedbackMessage: feedback
    });

    playSound(isCorrect);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const earnedScore = Math.max(10, Math.round(100 - finalResponseTime * 12));
      setScore(s => s + earnedScore);

      if (newStreak >= 3 && newStreak % 2 === 1) {
        triggerConfetti();
      }

      // ĐÚNG: Tự động chuyển câu sau 1.4s
      nextTimeoutRef.current = setTimeout(() => {
        advanceNextQuestion();
      }, 1400);

    } else {
      // SAI: Dừng 5s xem đáp án & bấm Space để bỏ qua
      setStreak(0);
      setWrongCountdown(5);

      let secondsRemaining = 5;
      countdownIntervalRef.current = setInterval(() => {
        secondsRemaining -= 1;
        setWrongCountdown(secondsRemaining);
        if (secondsRemaining <= 0) {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);

      nextTimeoutRef.current = setTimeout(() => {
        advanceNextQuestion();
      }, 5000);
    }

  }, [isLocked, currentQuestion, selectedIdx, elapsedTime, weightsMap, streak, playSound, advanceNextQuestion, speakText]);

  // Phím tắt bàn phím (1-4 chọn đáp án, Ctrl/Alt nghe lại, Space / Enter để bỏ qua khi sai)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === 'Space' || e.key === 'Enter') && result && !result.isCorrect) {
        e.preventDefault();
        advanceNextQuestion();
        return;
      }

      if (e.key === 'Control' || e.key === 'Alt') {
        e.preventDefault();
        if (currentQuestion && currentQuestion.term) {
          speakText(currentQuestion.term);
        }
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        handleSelectOption(idx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOption, result, advanceNextQuestion, currentQuestion, speakText]);

  // Cleanup timers & animation frame
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Tính toán thống kê in-memory của phiên Luyện tập:
  // Quy tắc luyện tập: Trọng số = 1: 1.0đ (full điểm) | Trọng số < 3: 0.5đ (nửa điểm) | Trọng số >= 3: 0đ.
  const totalWords = words.length;
  const masteredCount = Object.values(weightsMap).filter(w => w === 1).length;
  const learningCount = Object.values(weightsMap).filter(w => w > 1 && w < 3).length;
  const practiceProgressPercent = totalWords > 0 
    ? Math.round((((masteredCount * 1.0) + (learningCount * 0.5)) / totalWords) * 1000) / 10 
    : 0;

  // Thanh đo tốc độ phản xạ
  const speedProgressPercent = Math.max(0, 100 - (elapsedTime / 5.0) * 100);

  let timerColorClass = "text-emerald-400 border-emerald-500/40";
  let barColorClass = "bg-emerald-400";
  if (elapsedTime >= 1.5 && elapsedTime < 3.0) {
    timerColorClass = "text-teal-400 border-teal-500/40";
    barColorClass = "bg-teal-400";
  } else if (elapsedTime >= 3.0 && elapsedTime < 5.0) {
    timerColorClass = "text-amber-400 border-amber-500/40";
    barColorClass = "bg-amber-400";
  } else if (elapsedTime >= 5.0) {
    timerColorClass = "text-rose-400 border-rose-500/40";
    barColorClass = "bg-rose-500";
  }

  // MÀN HÌNH KHÓA NẾU TIẾN ĐỘ QUIZZIZ CHƯA ĐẠT 100%
  if (!loading && initData && !initData.unlocked) {
    const quizPct = initData.quizProgressPercent || 0;
    return (
      <div className="min-h-screen bg-[#240f32] text-white flex flex-col items-center justify-center font-['Quicksand'] p-6 select-none">
        <div className="max-w-md w-full bg-[#38184c] rounded-3xl p-8 border border-purple-700/50 shadow-2xl text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
            <Lock size={40} className="text-amber-400 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Chế độ Luyện tập Đang Bị Khóa</h2>
          <p className="text-sm text-purple-300 mb-6 leading-relaxed">
            Bạn chỉ có thể mở khóa chế độ này sau khi đã hoàn thành <b>100%</b> tiến độ trong bài Quizziz chính.
          </p>

          <div className="bg-purple-950/70 rounded-2xl p-4 border border-purple-800/40 mb-6 text-left">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-purple-300">Tiến độ Quizziz hiện tại:</span>
              <span className="text-amber-400 font-mono text-sm">{quizPct}% / 100%</span>
            </div>
            <div className="w-full h-3 bg-purple-900 rounded-full overflow-hidden p-0.5 border border-purple-700/50">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, quizPct))}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(`/deck/${deckId || 2}`)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-purple-900/50 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Zap size={18} />
              <span>Tiếp tục làm Quizziz để đạt 100%</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-6 rounded-2xl bg-purple-900/40 hover:bg-purple-800/50 text-purple-300 font-bold border border-purple-700/30 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Quay về Trang chủ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#240f32] text-white flex flex-col justify-between p-3 md:p-6 select-none font-['Quicksand']">
      
      {/* KHU VỰC TOP HEADER & TIẾN ĐỘ BỘ THẺ */}
      <div className="w-full max-w-6xl mx-auto space-y-2.5">
        
        {/* 1. TOP HEADER (Điều khiển & Thống kê trận đấu) */}
        <header className="flex items-center justify-between py-2 px-3.5 bg-[#38184c] rounded-2xl shadow-xl border border-purple-800/40">
          
          {/* Nhóm trái: Nút Back, Q. Number & Streak */}
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
            
            {/* Streak Flame */}
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all duration-300 ${
              streak > 0 
                ? 'bg-gradient-to-r from-orange-600/30 to-red-600/30 border-orange-500/40 text-orange-400 scale-105' 
                : 'bg-purple-950/40 border-purple-900/40 text-purple-400'
            }`}>
              <Flame size={15} className={streak > 0 ? "animate-bounce text-orange-400" : ""} />
              <span>Streak:</span>
              <span className="font-extrabold text-sm">{streak}</span>
            </div>

            {/* Huy hiệu Chế độ Luyện tập */}
            <span className="hidden md:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
              🎯 Luyện tập (In-Memory)
            </span>
          </div>

          {/* Nhóm giữa: Đồng hồ phản xạ thời gian thực */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-purple-300 hidden sm:inline">Phản xạ:</span>
            <div className={`font-mono font-extrabold text-base md:text-lg px-2.5 py-0.5 rounded-xl bg-purple-950/80 min-w-[65px] text-center border ${timerColorClass}`}>
              {elapsedTime.toFixed(1)}s
            </div>
          </div>

          {/* Nhóm phải: Trọng số, Điểm số, Nút Reset về 5 */}
          <div className="flex items-center space-x-2">
            <div className="bg-purple-950/60 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-300 flex items-center space-x-1.5 border border-purple-900/30">
              <Sparkles size={13} className="text-yellow-400" />
              <span className="hidden md:inline">Trọng số:</span>
              <span className="text-yellow-300 font-bold text-sm">
                {currentQuestion ? (weightsMap[currentQuestion.wordId] || 5) : 5}/10
              </span>
            </div>

            <div className="bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1 text-amber-300 font-bold text-xs shadow-sm">
              <Coins size={14} className="text-amber-400" />
              <span>{score}</span>
            </div>

            {/* Nút Reset trọng số về 5 */}
            <button
              onClick={handleResetWeights}
              title="Reset toàn bộ trọng số về 5 để luyện tập lại từ đầu"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold transition border border-purple-700/50 cursor-pointer shadow-sm"
            >
              <RotateCcw size={13} className="text-teal-400" />
              <span className="hidden sm:inline">Reset về 5</span>
            </button>
          </div>
        </header>

        {/* 2. THANH TIẾN ĐỘ HỌC THUỘC CỦA PHIÊN LUYỆN TẬP */}
        <div className="w-full py-2 px-4 bg-[#311444]/90 backdrop-blur rounded-2xl border border-purple-700/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-1.5">
              <BookOpen size={16} className="text-purple-400" />
              <span className="font-extrabold text-sm text-purple-100">
                {initData?.deckName || "Bộ từ vựng"}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-700/40">
              <span className="text-[11px] text-purple-300 font-semibold">Tiến độ:</span>
              <span className="font-black text-emerald-400 font-mono text-sm">{practiceProgressPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Thanh phần trăm tiến độ dài mượt mà */}
          <div className="flex-1 w-full md:mx-4">
            <div className="w-full bg-purple-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-purple-800/40 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, Math.max(practiceProgressPercent > 0 ? 3 : 0, practiceProgressPercent))}%` }}
              />
            </div>
          </div>

          {/* Huy hiệu số từ đã đạt điểm */}
          <div className="flex items-center space-x-2 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
              <Trophy size={12} className="text-emerald-400" /> {masteredCount} thuộc (1đ)
            </span>
            <span className="flex items-center gap-1 text-teal-300 bg-teal-950/40 px-2.5 py-0.5 rounded-lg border border-teal-500/30">
              <Zap size={12} className="text-teal-400" /> {learningCount} nhớ (&lt;3: 0.5đ)
            </span>
          </div>
        </div>

        {/* 3. THANH TỐC ĐỘ PHẢN XẠ CỦA CÂU HỎI */}
        <div>
          <div className="w-full bg-purple-950/70 h-2 rounded-full overflow-hidden p-0.5 border border-purple-900/40 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-75 shadow-sm ${barColorClass}`}
              style={{ width: `${speedProgressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-semibold px-1 mt-0.5 text-purple-400">
            <span className="text-emerald-400 flex items-center gap-0.5"><Zap size={10} /> &lt; 1.5s (-3)</span>
            <span className="text-teal-400">&lt; 3.0s (-2)</span>
            <span className="text-amber-400">&lt; 5.0s (-1)</span>
            <span className="text-rose-400">&ge; 5.0s (0)</span>
          </div>
        </div>

      </div>

      {/* KHU VỰC CÂU HỎI TRUNG TÂM */}
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center my-4 text-center">
        {loading ? (
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw size={36} className="animate-spin text-purple-400" />
            <div className="text-purple-300 font-bold text-lg">Đang bốc từ theo trọng số...</div>
          </div>
        ) : (
          <>
            <div className="text-xs uppercase tracking-widest px-3.5 py-1 rounded-full bg-purple-800/60 text-purple-300 font-extrabold mb-2 border border-purple-600/30 shadow-md">
              {currentQuestion?.partOfSpeech || 'Word'}
            </div>

            <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-wide drop-shadow-lg">
                {currentQuestion?.term}
              </h1>
              <button
                type="button"
                onClick={() => speakText(currentQuestion?.term)}
                className="p-2 md:p-2.5 rounded-2xl bg-purple-800/80 hover:bg-purple-700 text-cyan-300 hover:text-white border border-purple-600/50 shadow-lg cursor-pointer transition transform hover:scale-110 active:scale-95 flex items-center justify-center"
                title="Nghe phát âm (Phím tắt: Ctrl hoặc Alt)"
              >
                <Volume2 size={24} className="animate-pulse" />
              </button>
            </div>

            <div className="text-purple-300 font-medium text-lg min-h-[26px] mb-3 tracking-wider">
              {currentQuestion?.phonetic ? `/${currentQuestion.phonetic}/` : ''}
            </div>

            {/* BANNER PHẢN HỒI KHI TRẢ LỜI ĐÚNG */}
            {result && result.isCorrect && (
              <div className="animate-bounce-pop text-sm md:text-base font-bold py-2.5 px-6 rounded-2xl flex items-center gap-2 bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-lg">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span>{result.feedbackMessage} | Trọng số: <b>{result.oldWeight} ➔ {result.newWeight}</b> ({result.weightDelta})</span>
              </div>
            )}

            {/* BOX 5 GIÂY GHI NHỚ KHI TRẢ LỜI SAI */}
            {result && !result.isCorrect && (
              <div className="w-full max-w-2xl bg-gradient-to-br from-rose-950/80 via-purple-950/90 to-purple-900/80 border-2 border-rose-500/60 rounded-3xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
                
                {/* Thanh đếm ngược 5 giây */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-900/60 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${(wrongCountdown / 5) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mb-3 border-b border-rose-500/20 pb-2">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                    <XCircle size={18} />
                    <span>CHƯA ĐÚNG! HÃY GHI NHỚ NGHĨA:</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Clock size={13} className="animate-spin" />
                    <span>Chuyển sau {wrongCountdown}s</span>
                  </div>
                </div>

                <div className="my-2 py-3 px-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner">
                  <div className="text-left">
                    <span className="text-xs text-emerald-400/80 uppercase font-extrabold tracking-wider block">Đáp án chính xác:</span>
                    <span className="text-xl md:text-2xl font-black text-emerald-300 leading-snug">
                      {result.correctMeaning}
                    </span>
                  </div>

                  <div className="text-right text-xs text-purple-300">
                    <div>Trọng số: <b className="text-rose-400">{result.oldWeight} ➔ {result.newWeight}</b> <span className="text-rose-400">(+2)</span></div>
                    <div className="text-[11px] text-purple-400">Từ này sẽ gặp lại thường xuyên hơn</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-purple-300/80">
                  <span className="hidden sm:inline">💡 Đọc kỹ nghĩa để khắc sâu vào trí nhớ</span>
                  <button
                    onClick={advanceNextQuestion}
                    className="ml-auto flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-purple-700/60 hover:bg-purple-600 text-white font-bold text-xs transition shadow border border-purple-500/40 cursor-pointer"
                  >
                    <span>Tiếp tục ngay (Phím Space)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            )}
          </>
        )}
      </main>

      {/* 4 THẺ ĐÁP ÁN QUIZIZZ */}
      <footer className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentQuestion?.options.map((option, idx) => {
            let stateClass = CARD_THEMES[idx] + " quiz-card-hover";
            
            if (result) {
              const isOptionCorrect = option === result.correctMeaning;
              const isThisSelected = selectedIdx === idx;

              if (isThisSelected) {
                stateClass = result.isCorrect ? 'card-correct' : 'card-wrong';
              } else if (isOptionCorrect) {
                stateClass = 'card-correct ring-4 ring-emerald-400/80 shadow-emerald-500/60 scale-102';
              } else {
                stateClass = 'opacity-25 filter grayscale-[80%]';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isLocked}
                className={`${stateClass} relative rounded-2xl p-5 md:p-6 min-h-[135px] md:min-h-[160px] flex items-center justify-center text-center cursor-pointer shadow-xl border border-white/15 outline-none transition-all duration-200`}
              >
                <span className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-black/25 flex items-center justify-center text-xs font-black text-white/90 shadow">
                  {idx + 1}
                </span>

                {result && option === result.correctMeaning && (
                  <span className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-extrabold bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 px-2 py-0.5 rounded-md shadow">
                    <CheckCircle2 size={12} /> ĐÚNG
                  </span>
                )}

                <span className="text-base md:text-lg font-bold leading-relaxed px-2">
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hướng dẫn phím bấm & Nút âm thanh */}
        <div className="mt-4 flex items-center justify-between text-xs text-purple-400/80 px-2 font-medium">
          <div className="flex items-center space-x-2">
            <span>⌨️ Bấm phím <kbd className="px-1.5 py-0.5 rounded bg-purple-900/60 font-bold text-purple-200 border border-purple-700/50">1</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-purple-900/60 font-bold text-purple-200 border border-purple-700/50">2</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-purple-900/60 font-bold text-purple-200 border border-purple-700/50">3</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-purple-900/60 font-bold text-purple-200 border border-purple-700/50">4</kbd> để phản xạ nhanh</span>
          </div>

          <button 
            onClick={() => setSoundEnabled((v) => !v)}
            className="flex items-center space-x-1.5 hover:text-white transition px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-900/30"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
          </button>
        </div>
      </footer>

    </div>
  );
}
