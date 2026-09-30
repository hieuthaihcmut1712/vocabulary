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
  Clock, 
  Trophy, 
  RotateCcw, 
  Lock, 
  Target,
  Languages
} from 'lucide-react';

export default function ReversePracticePage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dbProgress, setDbProgress] = useState(0);
  const [deckName, setDeckName] = useState('Bộ từ vựng');
  const [words, setWords] = useState([]);

  // In-memory weights: khởi tạo = 5 cho toàn bộ từ
  const [weightsMap, setWeightsMap] = useState({});
  const recentHistoryRef = useRef([]);

  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [result, setResult] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wrongCountdown, setWrongCountdown] = useState(null);

  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const nextTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

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

  const speakText = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech error", err);
    }
  }, []);

  // Sinh câu hỏi kế tiếp theo Roulette Wheel (In-Memory)
  const generateNextQuestion = useCallback((wordList, weights) => {
    if (!wordList || wordList.length === 0) return;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setSelectedIdx(null);
    setResult(null);
    setWrongCountdown(null);
    setIsLocked(false);
    setElapsedTime(0);

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

    // Sinh 4 lựa chọn tiếng Anh
    const otherWords = wordList.filter(w => w.id !== chosenWord.id);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 3).map(w => w.term);
    const allOptions = [chosenWord.term, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    startTimeRef.current = performance.now();
    const tick = () => {
      const now = performance.now();
      const diff = (now - startTimeRef.current) / 1000;
      setElapsedTime(diff);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reverse-quiz/practice-init?deckId=${deckId || 2}`);
      if (!res.ok) throw new Error('Không thể tải bộ từ vựng');
      const data = await res.json();
      
      setDeckName(data.deckName || 'Bộ từ vựng');
      setDbProgress(data.reverseProgressPercent || 0);
      setIsUnlocked(Boolean(data.unlocked));

      if (data.words && data.words.length > 0) {
        setWords(data.words);
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

  const handleSelectOption = useCallback((index) => {
    if (isLocked || !currentWord || selectedIdx !== null) return;
    setIsLocked(true);
    setSelectedIdx(index);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const responseTime = Math.round(elapsedTime * 10) / 10;
    const chosenTerm = options[index];
    const isCorrect = (chosenTerm.trim().toLowerCase() === currentWord.term.trim().toLowerCase());

    const oldWeight = weightsMap[currentWord.id] || 5;
    let delta = 0;
    let feedback = "";

    if (isCorrect) {
      if (responseTime < 1.5) {
        delta = -3;
        feedback = "⚡ Phản xạ siêu tốc (< 1.5s)!";
      } else if (responseTime < 3.0) {
        delta = -2;
        feedback = "🔥 Nhớ rất tốt (< 3s)!";
      } else if (responseTime < 5.0) {
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

    const newWeight = Math.max(1, Math.min(10, oldWeight + delta));
    setWeightsMap(prev => ({
      ...prev,
      [currentWord.id]: newWeight
    }));

    setResult({
      isCorrect,
      correctTerm: currentWord.term,
      meaning: currentWord.meaning,
      oldWeight,
      newWeight,
      weightDelta: delta,
      feedback,
      responseTime
    });

    playSound(isCorrect);
    speakText(currentWord.term);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const speedBonus = responseTime < 1.5 ? 50 : responseTime < 3.0 ? 30 : 10;
      setScore(s => s + 100 + speedBonus + newStreak * 10);

      if (newStreak >= 3 && newStreak % 2 === 1) {
        triggerConfetti();
      }

      nextTimeoutRef.current = setTimeout(() => {
        advanceNextQuestion();
      }, 1400);

    } else {
      setStreak(0);
      setWrongCountdown(5);

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

  }, [isLocked, currentWord, selectedIdx, elapsedTime, options, weightsMap, streak, playSound, speakText, advanceNextQuestion]);

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

      if (isLocked || selectedIdx !== null || options.length === 0) return;

      if (e.key === '1' && options.length > 0) handleSelectOption(0);
      if (e.key === '2' && options.length > 1) handleSelectOption(1);
      if (e.key === '3' && options.length > 2) handleSelectOption(2);
      if (e.key === '4' && options.length > 3) handleSelectOption(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, selectedIdx, options, result, handleSelectOption, handleSkipWait]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Tính điểm phiên luyện tập:
  // weight = 1 (1.0đ) | weight < 3 (0.5đ) | weight >= 3 (0đ)
  const totalWords = words.length;
  const masteredCount = Object.values(weightsMap).filter(w => w === 1).length;
  const learningCount = Object.values(weightsMap).filter(w => w > 1 && w < 3).length;
  const practiceProgressPercent = totalWords > 0 
    ? Math.round((((masteredCount * 1.0) + (learningCount * 0.5)) / totalWords) * 1000) / 10 
    : 0;

  const optionStyles = [
    { bg: 'bg-[#e21b3c]', hover: 'hover:bg-[#ff3355]', border: 'border-[#b0132d]', shadow: 'shadow-[#b0132d]/40' },
    { bg: 'bg-[#1368ce]', hover: 'hover:bg-[#2680eb]', border: 'border-[#0c4a96]', shadow: 'shadow-[#0c4a96]/40' },
    { bg: 'bg-[#d89e00]', hover: 'hover:bg-[#f5b300]', border: 'border-[#9e7300]', shadow: 'shadow-[#9e7300]/40' },
    { bg: 'bg-[#26890c]', hover: 'hover:bg-[#34b312]', border: 'border-[#1b6108]', shadow: 'shadow-[#1b6108]/40' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f0d2b] text-white flex flex-col items-center justify-center font-['Quicksand'] p-4 select-none">
        <RefreshCw size={36} className="animate-spin text-purple-400 mb-3" />
        <div className="text-xl font-bold text-purple-200">Đang tải Chế độ Luyện tập Việt &rarr; Anh...</div>
      </div>
    );
  }

  // MÀN HÌNH KHÓA NẾU TIẾN ĐỘ VIỆT -> ANH CHƯA ĐẠT 100%
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
              Bạn cần đạt <b>100%</b> tiến độ <b>Quizziz: Việt &rarr; Anh</b> của bộ thẻ <b>"{deckName}"</b> để mở khóa mục này.
            </p>
          </div>

          <div className="bg-purple-950/60 p-4 rounded-2xl border border-purple-800/40 space-y-2 text-left">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-purple-300">Tiến độ hiện tại:</span>
              <span className="text-indigo-400 font-mono">{dbProgress.toFixed(1)}% / 100%</span>
            </div>
            <div className="w-full h-3 bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-800">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(dbProgress > 0 ? 4 : 0, dbProgress))}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate(`/deck/${deckId || 2}/reverse`)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Languages size={16} />
              <span>Vào Quizziz Việt &rarr; Anh ngay</span>
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

  return (
    <div className="min-h-screen bg-[#1f0d2b] text-white flex flex-col justify-between p-3 md:p-6 select-none font-['Quicksand']">
      
      {/* 1. TOP HEADER & TIẾN ĐỘ PHIÊN LUYỆN TẬP */}
      <div className="w-full max-w-5xl mx-auto space-y-2.5">
        <header className="flex items-center justify-between py-2 px-3.5 bg-[#321345] rounded-2xl shadow-xl border border-purple-800/40">
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
            <span className="hidden sm:inline">Luyện tập Việt &rarr; Anh (In-Memory)</span>
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
        <div className="bg-[#291038] rounded-2xl p-3 border border-purple-800/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 text-xs">
            <div className="flex items-center space-x-2">
              <Languages size={15} className="text-teal-400" />
              <span className="font-extrabold text-white text-sm">{deckName}</span>
              <span className="text-teal-400/80 font-medium text-xs">&bull; Tiến độ Luyện tập Việt &rarr; Anh</span>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-bold">
              <span className="text-teal-300">Thuộc lầu (1.0đ): <b>{masteredCount}</b></span>
              <span className="text-cyan-300">Đang nhớ (0.5đ): <b>{learningCount}</b></span>
              <span className="text-purple-300">Cần luyện: <b>{totalWords - masteredCount - learningCount}</b></span>
              <span className="px-2 py-0.5 rounded-lg bg-teal-950/80 text-teal-300 font-mono font-black border border-teal-600/40 text-xs">
                {practiceProgressPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="w-full h-3 bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-800/50 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(practiceProgressPercent > 0 ? 3 : 0, practiceProgressPercent))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. CÂU HỎI TRUNG TÂM */}
      <div className="w-full max-w-4xl mx-auto my-auto py-2">
        <div className="bg-[#321345] rounded-3xl p-6 md:p-8 shadow-2xl border border-purple-700/40 text-center relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-3 text-purple-300">
            <span className="px-2.5 py-1 rounded-xl bg-purple-950/70 border border-purple-700/40 text-purple-200 font-extrabold">
              {currentWord?.partOfSpeech || 'collocation'}
            </span>
            <div className="flex items-center space-x-1.5 font-mono text-purple-300 bg-purple-950/50 px-2.5 py-1 rounded-xl border border-purple-800/40">
              <Clock size={13} className="text-cyan-400" />
              <span>{elapsedTime.toFixed(1)}s</span>
            </div>
          </div>

          <div className="my-4">
            <span className="text-xs uppercase tracking-widest text-teal-300/80 font-bold block mb-1">
              Chọn từ tiếng Anh có nghĩa:
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-wide leading-tight">
              "{currentWord?.meaning}"
            </h2>
          </div>

          {result && (
            <div className={`mt-4 p-3 rounded-2xl border font-bold text-xs md:text-sm flex flex-col md:flex-row items-center justify-between gap-2 animate-fadeIn ${
              result.isCorrect 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center space-x-2">
                {result.isCorrect ? <CheckCircle2 size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-rose-400" />}
                <span>{result.feedback}</span>
                {!result.isCorrect && (
                  <span className="text-white font-mono ml-2 font-black">Đáp án: {result.correctTerm}</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs opacity-90">
                  Trọng số: <b>{result.oldWeight}</b> &rarr; <b>{result.newWeight}</b> ({result.weightDelta > 0 ? `+${result.weightDelta}` : result.weightDelta})
                </span>
                {!result.isCorrect && (
                  <button
                    onClick={handleSkipWait}
                    className="px-3 py-1 bg-purple-800 hover:bg-purple-700 text-white font-extrabold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-md"
                  >
                    <span>Tiếp tục ngay</span>
                    {wrongCountdown !== null && <span className="font-mono">({wrongCountdown}s)</span>}
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. 4 LỰA CHỌN TIẾNG ANH */}
      <div className="w-full max-w-4xl mx-auto pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {options.map((termOption, idx) => {
            const style = optionStyles[idx % 4];
            const isSelected = selectedIdx === idx;
            const isCorrectOption = result && termOption.trim().toLowerCase() === result.correctTerm.trim().toLowerCase();
            const isWrongSelection = result && isSelected && !result.isCorrect;

            let cardStateClasses = `${style.bg} ${style.hover} ${style.border} ${style.shadow}`;
            if (result) {
              if (isCorrectOption) {
                cardStateClasses = "bg-[#26890c] border-[#1b6108] scale-[1.02] shadow-2xl ring-4 ring-emerald-400/50";
              } else if (isWrongSelection) {
                cardStateClasses = "bg-[#e21b3c] border-[#b0132d] opacity-90 ring-4 ring-rose-400/50";
              } else {
                cardStateClasses = "bg-purple-950/40 border-purple-900/40 opacity-40";
              }
            }

            return (
              <button
                key={idx}
                disabled={isLocked || selectedIdx !== null}
                onClick={() => handleSelectOption(idx)}
                className={`relative p-5 md:p-6 rounded-2xl text-white font-extrabold text-base md:text-lg border-b-4 shadow-lg transition-all duration-150 transform active:scale-95 disabled:cursor-not-allowed flex items-center justify-between cursor-pointer ${cardStateClasses}`}
              >
                <div className="flex items-center space-x-3.5 text-left">
                  <span className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center font-mono font-black text-sm text-white/90">
                    {idx + 1}
                  </span>
                  <span className="font-mono tracking-wide">{termOption}</span>
                </div>

                {result && isCorrectOption && (
                  <CheckCircle2 size={24} className="text-white drop-shadow-md animate-bounce" />
                )}
                {result && isWrongSelection && (
                  <XCircle size={24} className="text-white drop-shadow-md" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer className="w-full max-w-5xl mx-auto py-1.5 flex items-center justify-between text-[11px] text-purple-400/60 border-t border-purple-900/40">
        <div>Chế độ Luyện tập Việt &rarr; Anh &bull; In-Memory &bull; Phím tắt: <b>1</b>, <b>2</b>, <b>3</b>, <b>4</b></div>
        <div>Reset trọng số về 5 mỗi lần luyện tập</div>
      </footer>

    </div>
  );
}
