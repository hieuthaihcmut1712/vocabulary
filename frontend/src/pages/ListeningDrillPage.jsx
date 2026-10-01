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
  Headphones,
  HelpCircle,
  Eye,
  EyeOff,
  Snail,
  Target,
  Database
} from 'lucide-react';

export default function ListeningDrillPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  // Trạng thái tải và dữ liệu câu hỏi từ Backend
  const [loading, setLoading] = useState(true);
  const [deckName, setDeckName] = useState('Bộ từ vựng');
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // Tiến độ kỹ năng nghe của bộ thẻ (lưu DB)
  const [deckProgress, setDeckProgress] = useState({
    percent: 0,
    mastered: 0,
    learning: 0,
    unlearned: 0,
    total: 0
  });

  // Trạng thái phiên làm bài
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
  const questionStartTimeRef = useRef(Date.now());

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
      colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b']
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
    if (!currentQuestion) return;
    const slow = (forceSlow !== null) ? forceSlow : isSlowMode;
    const rate = slow ? 0.65 : 0.95;
    
    speakText(currentQuestion.term, rate);

    if (!result) {
      setListenCount(c => c + 1);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion, isSlowMode, result, speakText]);

  // Tải câu hỏi kế tiếp từ Backend
  const fetchNextQuestion = useCallback(async () => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setUserInput('');
    setResult(null);
    setWrongCountdown(null);
    setShowHint(false);
    setIsLocked(false);
    setListenCount(1);
    questionStartTimeRef.current = Date.now();

    try {
      const res = await fetch(`/api/listening/next?deckId=${deckId || 2}`);
      if (!res.ok) throw new Error('Không thể tải câu hỏi nghe');
      const data = await res.json();
      
      setCurrentQuestion(data);
      setDeckName(data.deckName || 'Bộ từ vựng');
      setDeckProgress({
        percent: data.deckProgressPercent || 0,
        mastered: data.masteredWords || 0,
        learning: data.learningWords || 0,
        unlearned: data.unlearnedWords || 0,
        total: data.totalWords || 0
      });

      // Tự động phát âm câu hỏi mới sau một khoảng trễ ngắn
      setTimeout(() => {
        speakText(data.term, isSlowMode ? 0.65 : 0.95);
        if (inputRef.current) inputRef.current.focus();
      }, 300);

    } catch (err) {
      console.error("Lỗi tải câu hỏi nghe:", err);
    } finally {
      setLoading(false);
    }
  }, [deckId, isSlowMode, speakText]);

  // Khởi tạo lần đầu
  useEffect(() => {
    fetchNextQuestion();
  }, [fetchNextQuestion]);

  // Nộp bài chính tả lên Backend
  const handleSubmitSpelling = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (isLocked || !currentQuestion || result) return;

    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    setIsLocked(true);
    const responseTime = Math.round((Date.now() - questionStartTimeRef.current) / 100) / 10;

    try {
      const res = await fetch('/api/listening/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: currentQuestion.wordId,
          typedText: trimmedInput,
          listenCount: listenCount,
          responseTimeSeconds: responseTime
        })
      });

      if (!res.ok) throw new Error('Không thể nộp câu trả lời');
      const data = await res.json();

      setResult({
        isCorrect: data.isCorrect,
        userTyped: trimmedInput,
        correctTerm: data.correctTerm,
        meaning: data.meaning,
        phonetic: currentQuestion.phonetic,
        partOfSpeech: currentQuestion.partOfSpeech,
        listenCount: data.listenCount,
        oldWeight: data.oldWeight,
        newWeight: data.newWeight,
        weightDelta: data.weightDelta,
        feedback: data.feedbackMessage
      });

      // Cập nhật thanh tiến độ nghe của bộ thẻ
      setDeckProgress(prev => ({
        ...prev,
        percent: data.deckProgressPercent,
        mastered: data.masteredWords,
        learning: data.learningWords,
        unlearned: data.unlearnedWords
      }));

      playEffectSound(data.isCorrect);

      if (data.isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        const points = data.listenCount === 1 ? 100 : (data.listenCount <= 3 ? 70 : 40);
        setScore(s => s + points);

        if (newStreak >= 3 && newStreak % 2 === 1) {
          triggerConfetti();
        }

        // Tự động chuyển câu sau 1.6s
        nextTimeoutRef.current = setTimeout(() => {
          setQuestionCount(c => c + 1);
          fetchNextQuestion();
        }, 1600);

      } else {
        setStreak(0);
        // Đếm ngược 5 giây khi trả lời sai để ghi nhớ chính tả
        setWrongCountdown(5);
        speakText(currentQuestion.term, 0.7);

        let count = 5;
        countdownIntervalRef.current = setInterval(() => {
          count -= 1;
          if (count > 0) {
            setWrongCountdown(count);
          } else {
            clearInterval(countdownIntervalRef.current);
            setWrongCountdown(null);
            setQuestionCount(c => c + 1);
            fetchNextQuestion();
          }
        }, 1000);
      }

    } catch (err) {
      console.error("Lỗi khi nộp bài:", err);
      setIsLocked(false);
    }
  }, [isLocked, currentQuestion, result, userInput, listenCount, streak, playEffectSound, speakText, fetchNextQuestion]);

  // Bỏ qua thời gian chờ khi trả lời sai (bấm Space / Enter hoặc nút)
  const handleSkipWait = useCallback(() => {
    if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setWrongCountdown(null);
    setQuestionCount(c => c + 1);
    fetchNextQuestion();
  }, [fetchNextQuestion]);

  // Phím tắt bàn phím
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (nextTimeoutRef.current) clearTimeout(nextTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#240f32] text-white flex flex-col items-center justify-center font-['Quicksand'] p-4 select-none">
        <RefreshCw size={36} className="animate-spin text-cyan-400 mb-3" />
        <div className="text-xl font-bold text-cyan-200">Đang khởi tạo Bài học Nghe chính tả...</div>
        <div className="text-xs text-purple-400 mt-1">Trọng số khởi đầu 5 &bull; Lưu tiến độ trực tiếp vào Database</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#240f32] text-white flex flex-col justify-between p-3 md:p-6 select-none font-['Quicksand']">
      
      {/* 1. TOP HEADER & THANH TIẾN ĐỘ NGHE RIÊNG */}
      <div className="w-full max-w-5xl mx-auto space-y-2.5">
        
        {/* TOP HEADER */}
        <header className="flex items-center justify-between py-2 px-3.5 bg-[#38184c] rounded-2xl shadow-xl border border-purple-800/40">
          
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
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 scale-105 shadow-md shadow-amber-500/20' 
                : 'bg-purple-950/40 border-purple-800/30 text-purple-400'
            }`}>
              <Flame size={14} className={streak > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-purple-400'} />
              <span>{streak} chuỗi</span>
            </div>
          </div>

          {/* Badge Chế độ Học nghe có lưu DB */}
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-black shadow-sm">
            <Database size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">Học nghe chính tả</span>
            <span className="text-[10px] opacity-75 sm:hidden">Lưu DB</span>
          </div>

          {/* Nhóm phải: Điểm & Âm thanh */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 px-3 py-1.5 rounded-xl font-black text-cyan-300 text-xs shadow-inner">
              <Coins size={14} className="text-yellow-400" />
              <span>{score.toLocaleString()}</span>
            </div>

            <button
              onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
              className="p-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-300 transition border border-purple-700/40 cursor-pointer"
              title={soundEffectsEnabled ? "Tắt hiệu ứng âm thanh" : "Bật hiệu ứng âm thanh"}
            >
              {soundEffectsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-red-400" />}
            </button>
          </div>
        </header>

        {/* THANH TIẾN ĐỘ NGHE RIÊNG CỦA BỘ THẺ */}
        <div className="bg-[#321345] rounded-2xl p-3 border border-purple-800/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 text-xs">
            <div className="flex items-center space-x-2">
              <Headphones size={15} className="text-cyan-400" />
              <span className="font-extrabold text-white text-sm">{deckName}</span>
              <span className="text-cyan-400/80 font-medium text-xs">&bull; Tiến độ Nghe chính tả</span>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-bold">
              <span className="text-cyan-300 flex items-center gap-1">
                <Trophy size={13} className="text-cyan-400" />
                Thuộc lầu: <b>{deckProgress.mastered}</b>
              </span>
              <span className="text-blue-300">
                Đang nhớ: <b>{deckProgress.learning}</b>
              </span>
              <span className="text-purple-300">
                Cần học: <b>{deckProgress.unlearned}</b>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 font-mono font-black border border-cyan-600/40 text-xs">
                {Number(deckProgress?.percent || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Thanh phần trăm tiến độ Nghe */}
          <div className="w-full h-3 bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-800/50 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(Number(deckProgress?.percent || 0) > 0 ? 3 : 0, Number(deckProgress?.percent || 0)))}%` }}
            />
          </div>

          {/* Nếu đạt 100% thì thông báo mở khóa Luyện tập */}
          {(deckProgress?.percent || 0) >= 100 && (
            <div className="mt-2.5 p-2 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-200">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles size={14} className="text-yellow-400 animate-spin" />
                Chúc mừng! Bộ thẻ đã đạt 100% tiến độ Nghe! Đã mở khóa Chế độ Luyện tập tự do.
              </span>
              <button
                onClick={() => navigate(`/deck/${deckId || 2}/listening-practice`)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg transition cursor-pointer"
              >
                Vào Luyện tập ngay
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 2. KHU VỰC THỬ THÁCH NGHE CHÍNH TẢ */}
      <div className="w-full max-w-3xl mx-auto my-auto py-4">
        
        {/* THẺ ÂM THANH & CÂU HỎI */}
        <div className="bg-[#38184c] rounded-3xl p-6 md:p-8 shadow-2xl border border-purple-700/40 text-center relative overflow-hidden">
          
          {/* Vòng sáng nền mờ */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badges thông tin câu hỏi */}
          <div className="flex items-center justify-between text-xs mb-6 text-purple-300">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-xl bg-purple-950/70 border border-purple-700/40 text-purple-200 font-extrabold">
                {currentQuestion?.partOfSpeech || 'collocation'}
              </span>
              <span className="text-[11px] text-purple-400 font-mono">
                Trọng số hiện tại: <b className="text-cyan-300">{currentQuestion?.currentWeight || 5}</b>
              </span>
            </div>

            {/* Badge số lần nghe hiện tại */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-purple-950/70 border border-purple-700/40 font-bold text-xs">
              <Headphones size={13} className="text-cyan-400" />
              <span>Đã nghe: <b className="text-white">{listenCount}</b> lần</span>
              <span className="text-[10px] text-cyan-300 ml-1">
                {listenCount === 1 ? '(-2đ nếu đúng)' : (listenCount <= 3 ? '(-1đ)' : '(0đ)')}
              </span>
            </div>
          </div>

          {/* NÚT NGHE LỚN (MAIN AUDIO BUTTON) */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative group">
              <button
                type="button"
                onClick={() => handlePlayAudio(false)}
                className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white flex flex-col items-center justify-center shadow-xl shadow-cyan-900/40 transition-all duration-200 transform group-hover:scale-105 cursor-pointer border-2 border-cyan-400/40"
                title="Bấm để nghe phát âm (Ctrl / Alt)"
              >
                <Volume2 size={44} className="text-white drop-shadow-md animate-pulse" />
                <span className="text-xs font-black tracking-wider uppercase mt-1 text-cyan-100">Phát âm</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayAudio(true)}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-[#260e34] hover:bg-purple-900 text-cyan-300 border border-cyan-500/40 shadow-lg cursor-pointer transition transform hover:scale-110"
                title="Nghe tốc độ chậm"
              >
                <Snail size={18} />
              </button>
            </div>

            <p className="text-xs text-purple-300/80 mt-3 font-medium flex items-center gap-1.5">
              <span>Bấm phím <b>Ctrl</b> hoặc <b>Alt</b> để nghe lại âm thanh</span>
            </p>
          </div>

          {/* GỢI Ý NGHĨA TIẾNG VIỆT (TÙY CHỌN) */}
          <div className="mb-6">
            {!showHint ? (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-xs text-purple-400 hover:text-cyan-300 flex items-center justify-center gap-1 mx-auto transition cursor-pointer"
              >
                <Eye size={13} />
                <span>Xem gợi ý nghĩa tiếng Việt</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-950/80 border border-purple-700/50 text-purple-200 text-xs font-semibold animate-fadeIn">
                <HelpCircle size={14} className="text-yellow-400 flex-shrink-0" />
                <span>Nghĩa: <b>{currentQuestion?.meaning}</b></span>
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

          {/* FORM NHẬP CHÍNH TẢ */}
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
                    : 'border-purple-600/50 focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20'
                }`}
              />

              {/* Nút gửi trong input */}
              {!result && (
                <button
                  type="submit"
                  disabled={!userInput.trim() || isLocked}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  Kiểm tra &crarr;
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-purple-400/70 mt-2 px-2">
              <span>Quy tắc: Nghe 1 lần đúng (-2đ) &bull; Nghe 2-3 lần (-1đ) &bull; Sai (+1đ)</span>
              <span>Bấm <b>Enter</b> để nộp</span>
            </div>
          </form>

          {/* HIỂN THỊ KẾT QUẢ VÀ FEEDBACK */}
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

              {/* Chi tiết đáp án đúng */}
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

              {/* Thông báo điều chỉnh trọng số */}
              <div className="mt-3 pt-3 border-t border-purple-800/40 flex items-center justify-between text-xs font-bold">
                <span className="text-purple-200">{result.feedback}</span>
                <span className="font-mono px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-700/50">
                  Trọng số: <b className="text-white">{result.oldWeight}</b> &rarr; <b className={result.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{result.newWeight}</b>
                </span>
              </div>

              {/* Countdown hoặc Nút qua câu tiếp */}
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
        <div className="flex items-center space-x-3">
          <span>Phím tắt: <b>Ctrl</b> (Nghe lại) &bull; <b>Enter</b> (Nộp bài)</span>
        </div>
        <div>
          Tiến độ nghe lưu Database &bull; Cần 100% để mở Luyện tập tự do
        </div>
      </footer>

    </div>
  );
}
