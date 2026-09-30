import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  Headphones, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  Play, 
  Pause, 
  RefreshCw, 
  History, 
  Award, 
  Lock, 
  Zap, 
  ChevronRight,
  Clock,
  HelpCircle,
  Eye,
  Send
} from 'lucide-react';

const LEVELS = [
  {
    id: 'TOEIC_550',
    name: 'TOEIC 550',
    subtitle: 'Điền từ 1 câu đơn (Gõ)',
    desc: 'Ngữ pháp cơ bản, câu đơn có 1 ô trống',
    color: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Zap
  },
  {
    id: 'TOEIC_700_READING',
    name: 'TOEIC 700 - Đọc',
    subtitle: 'Đoạn văn điền từ (Không nghe)',
    desc: 'Đoạn văn công sở 3-4 câu, ngữ pháp trung cấp, 2-3 chỗ trống',
    color: 'from-amber-600 to-orange-700',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: FileText
  },
  {
    id: 'TOEIC_700_LISTENING',
    name: 'TOEIC 700 - Nghe',
    subtitle: 'Đoạn văn điền từ (Có Audio)',
    desc: 'Nghe bài nói và bắt từ để điền vào các chỗ trống',
    color: 'from-cyan-600 to-blue-700',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    icon: Headphones
  },
  {
    id: 'TOEIC_850',
    name: 'TOEIC 850',
    subtitle: 'Gõ câu ngữ cảnh nâng cao',
    desc: 'Đảo ngữ, câu điều kiện, cấu trúc phân từ thương mại phức hợp',
    color: 'from-rose-600 to-purple-700',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: Award
  }
];

export default function AppliedExercisePage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const isComprehensive = (deckId === '0' || deckId === 'comprehensive');
  const targetDeckId = isComprehensive ? 0 : parseInt(deckId || '2', 10);

  // Trạng thái mở khóa & dữ liệu bài tập
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [currentLevel, setCurrentLevel] = useState('TOEIC_550'); // hoặc 'HISTORY'
  
  // Trạng thái bài tập hiện tại
  const [exercise, setExercise] = useState(null);
  const [userInputs, setUserInputs] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Audio player (dùng Web Speech API cho audioScript)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);

  // Lịch sử bài tập
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const inputRefs = useRef([]);

  // 1. Kiểm tra trạng thái mở khóa của Deck
  const checkStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch(`/api/exercises/status?deckId=${targetDeckId}`);
      if (!res.ok) throw new Error('Không thể kiểm tra trạng thái mở khóa');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  }, [targetDeckId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // 2. Sinh bài tập mới từ AI
  const fetchNewExercise = useCallback(async (levelToGen) => {
    setGenerating(true);
    setResult(null);
    setExercise(null);
    setUserInputs([]);
    window.speechSynthesis?.cancel();
    setIsPlayingAudio(false);

    try {
      const res = await fetch('/api/exercises/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: targetDeckId,
          level: levelToGen
        })
      });

      if (!res.ok) throw new Error('Lỗi sinh bài tập từ AI');
      const data = await res.json();
      setExercise(data);
      setUserInputs(new Array(data.targetAnswers?.length || 1).fill(''));

      // Tự động focus ô đầu tiên
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 300);

    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }, [targetDeckId]);

  // Tự động tải bài khi chuyển level (nếu không phải tab Lịch sử)
  useEffect(() => {
    if (status && status.unlocked && currentLevel !== 'HISTORY') {
      fetchNewExercise(currentLevel);
    }
  }, [status, currentLevel, fetchNewExercise]);

  // 3. Tải danh sách lịch sử bài tập
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/exercises/history?deckId=${targetDeckId}`);
      if (!res.ok) throw new Error('Không thể tải lịch sử');
      const data = await res.json();
      setHistoryList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, [targetDeckId]);

  useEffect(() => {
    if (currentLevel === 'HISTORY') {
      loadHistory();
    }
  }, [currentLevel, loadHistory]);

  // 4. Phát âm audio văn bản hoàn chỉnh bằng Web Speech API
  const playAudio = (rate = speechRate) => {
    if (!window.speechSynthesis || !exercise?.audioScript) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(exercise.audioScript);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David') || v.name.includes('US'))
    );
    if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  // 5. Nộp bài chấm điểm
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!exercise || submitting || result) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: targetDeckId,
          level: currentLevel,
          title: exercise.title,
          content: exercise.content,
          translation: exercise.translation,
          targetAnswers: exercise.targetAnswers,
          userAnswers: userInputs,
          explanation: exercise.explanation,
          audioScript: exercise.audioScript
        })
      });

      if (!res.ok) throw new Error('Lỗi nộp bài');
      const data = await res.json();
      setResult(data);

      if (data.scorePercent >= 70) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2ecc71', '#3498db', '#f1c40f', '#9b59b6']
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (index, value) => {
    setUserInputs(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // RENDER: Tách đoạn văn thành text và các input box thay thế [BLANK_X]
  const renderInteractiveContent = () => {
    if (!exercise || !exercise.content) return null;

    const parts = exercise.content.split(/(\[BLANK_\d+\])/g);

    return (
      <div className="text-lg md:text-xl leading-loose font-medium text-white/95 text-left bg-purple-950/40 p-6 md:p-8 rounded-3xl border border-purple-800/40 shadow-inner">
        {parts.map((part, pIdx) => {
          const match = part.match(/\[BLANK_(\d+)\]/);
          if (match) {
            const blankIndex = parseInt(match[1], 10) - 1;
            const evalItem = result?.evaluations?.find(ev => ev.blankIndex === (blankIndex + 1));
            const isCorrect = evalItem ? evalItem.isCorrect : null;
            const target = exercise.targetAnswers ? exercise.targetAnswers[blankIndex] : '';
            const hint = exercise.blankHints ? exercise.blankHints[blankIndex] : '';

            return (
              <span key={pIdx} className="inline-block mx-1.5 my-1 align-middle">
                {result ? (
                  // KHI ĐÃ CÓ KẾT QUẢ
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 font-mono font-bold text-base shadow-sm ${
                    isCorrect 
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                      : 'bg-rose-950/80 border-rose-500 text-rose-300'
                  }`}>
                    {isCorrect ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span>{userInputs[blankIndex] || target}</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="text-rose-400" />
                        <span className="line-through opacity-75 mr-1">{userInputs[blankIndex] || '(trống)'}</span>
                        <span className="text-emerald-400 font-extrabold underline">{target}</span>
                      </>
                    )}
                  </span>
                ) : (
                  // KHI ĐANG LÀM BÀI
                  <span className="inline-block relative">
                    <input
                      ref={el => inputRefs.current[blankIndex] = el}
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      disabled={submitting}
                      value={userInputs[blankIndex] || ''}
                      onChange={e => handleInputChange(blankIndex, e.target.value)}
                      placeholder={`(${blankIndex + 1}) gõ từ...`}
                      className="px-3 py-1.5 w-48 md:w-56 text-center rounded-xl bg-purple-900/90 border-2 border-purple-500/60 focus:border-amber-400 focus:bg-purple-950 text-white font-mono text-base placeholder-purple-400/50 focus:outline-none transition shadow-inner font-bold"
                    />
                    {hint && (
                      <span className="block text-[11px] text-amber-300/80 font-normal italic mt-0.5 text-center">
                        💡 {hint}
                      </span>
                    )}
                  </span>
                )}
              </span>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </div>
    );
  };

  // NẾU ĐANG TẢI TRẠNG THÁI MỞ KHÓA
  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-[#1f0d2b] text-white flex flex-col items-center justify-center p-4">
        <RefreshCw size={36} className="animate-spin text-purple-400 mb-3" />
        <div className="text-purple-300 font-bold">Đang kiểm tra dữ liệu bài tập...</div>
      </div>
    );
  }

  // NẾU CHƯA ĐỦ ĐIỀU KIỆN MỞ KHÓA
  if (status && !status.unlocked) {
    return (
      <div className="min-h-screen bg-[#1f0d2b] text-white flex flex-col items-center justify-center p-4 font-['Quicksand'] select-none">
        <div className="max-w-md w-full bg-[#321345] rounded-3xl p-8 border border-purple-800/40 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              {isComprehensive ? 'Luyện tập Tổng hợp chưa mở khóa' : 'Bài tập ứng dụng đang bị khóa'}
            </h2>
            <p className="text-purple-300 text-sm mt-2">
              {isComprehensive ? (
                <>Bạn cần có ít nhất <b className="text-amber-300">5 từ vựng đã học thuộc</b> (đạt trọng số 1) để mở khóa Lò luyện tập tổng hợp. Hiện tại bạn có: <b className="text-white">{status?.quizProgress || 0} từ</b>.</>
              ) : (
                <>Bạn cần hoàn thành <b className="text-amber-300">100%</b> cả 3 kỹ năng cơ bản của bộ thẻ <b className="text-white">"{status.deckName}"</b> để mở khóa AI sinh bài tập ứng dụng ngữ cảnh TOEIC.</>
              )}
            </p>
          </div>

          {!isComprehensive && (
            <div className="bg-purple-950/60 p-4 rounded-2xl border border-purple-800/40 space-y-3 text-left">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-purple-300">1. Anh &rarr; Việt (Nhận diện):</span>
                <span className="text-emerald-400 font-mono">{status.quizProgress?.toFixed(1)}% / 100%</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-purple-300">2. Việt &rarr; Anh (Gợi nhớ):</span>
                <span className="text-indigo-400 font-mono">{status.reverseProgress?.toFixed(1)}% / 100%</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-purple-300">3. Luyện nghe chính tả:</span>
                <span className="text-cyan-400 font-mono">{status.listeningProgress?.toFixed(1)}% / 100%</span>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            {!isComprehensive && (
              <button
                onClick={() => navigate(`/deck/${targetDeckId || 2}`)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg transition cursor-pointer"
              >
                Vào học hoàn thành các kỹ năng
              </button>
            )}
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
    <div className="min-h-screen bg-[#1f0d2b] text-white flex flex-col justify-between p-4 md:p-8 font-['Quicksand'] select-none">
      
      {/* HEADER TRANG BÀI TẬP */}
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row items-center justify-between py-4 px-6 bg-[#321345] rounded-3xl shadow-2xl border border-purple-800/40 gap-4">
          <div className="flex items-center space-x-3.5">
            <button 
              onClick={() => navigate('/')} 
              className="p-2.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-purple-300 hover:text-white transition cursor-pointer"
              title="Quay về trang chủ"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-wide">
                  {isComprehensive ? 'Luyện tập Tổng hợp' : 'Bài tập ứng dụng TOEIC'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold shadow-sm">
                  {isComprehensive ? `🏆 Kho ${status?.quizProgress || 48} từ đã thuộc` : (status?.deckName || 'Deck')}
                </span>
              </div>
              <p className="text-xs text-purple-300/80 font-medium">
                {isComprehensive 
                  ? 'AI bốc ngẫu nhiên từ toàn bộ các từ bạn đã học thuộc (trọng số 1) từ mọi bộ thẻ để làm bài kiểm tra TOEIC'
                  : 'AI sinh ngữ cảnh thực tế theo 3 cấp độ (550, 700, 850) • Kèm giải thích chi tiết & Lưu lịch sử'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-700/50 flex items-center space-x-2 text-purple-200">
              <Sparkles size={14} className="text-amber-400" />
              <span>Gemini AI Engine</span>
            </div>
          </div>
        </header>

        {/* THANH CHUYỂN ĐỔI CẤP ĐỘ (LEVEL TABS) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {LEVELS.map(lvl => {
            const Icon = lvl.icon;
            const isActive = currentLevel === lvl.id;

            return (
              <button
                key={lvl.id}
                onClick={() => setCurrentLevel(lvl.id)}
                className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  isActive 
                    ? `bg-gradient-to-br ${lvl.color} border-white/40 shadow-xl shadow-purple-950/60 scale-[1.02]` 
                    : 'bg-[#321345]/80 hover:bg-[#3d1854] border-purple-800/40 text-purple-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${lvl.badgeColor}`}>
                    {lvl.name}
                  </span>
                  <Icon size={16} className={isActive ? "text-white" : "text-purple-400"} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{lvl.subtitle}</div>
                  <div className="text-[10px] text-purple-200/70 mt-0.5 line-clamp-1">{lvl.desc}</div>
                </div>
              </button>
            );
          })}

          {/* TAB LỊCH SỬ BÀI TẬP */}
          <button
            onClick={() => setCurrentLevel('HISTORY')}
            className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              currentLevel === 'HISTORY'
                ? 'bg-gradient-to-br from-indigo-600 to-purple-800 border-white/40 shadow-xl scale-[1.02]'
                : 'bg-[#321345]/80 hover:bg-[#3d1854] border-purple-800/40 text-purple-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                Lịch sử
              </span>
              <History size={16} className={currentLevel === 'HISTORY' ? "text-white" : "text-purple-400"} />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Xem lại bài cũ</div>
              <div className="text-[10px] text-purple-200/70 mt-0.5">Lịch sử & Giải thích</div>
            </div>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* NỘI DUNG CHÍNH: KHU VỰC LÀM BÀI HOẶC XEM LỊCH SỬ                          */}
        {/* ========================================================================= */}

        {currentLevel === 'HISTORY' ? (
          /* TAB LỊCH SỬ BÀI TẬP */
          <div className="bg-[#321345] rounded-3xl p-6 md:p-8 border border-purple-800/40 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <History size={22} className="text-indigo-400" />
                  <span>Lịch sử các bài tập đã làm</span>
                </h2>
                <p className="text-xs text-purple-300 mt-1">Xem lại đề bài, câu trả lời bạn đã gõ và toàn bộ lời giải thích ngữ pháp</p>
              </div>
              <button
                onClick={loadHistory}
                className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} />
                <span>Tải lại</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw size={36} className="animate-spin text-purple-400 mx-auto" />
                <div className="text-purple-300 font-bold">Đang tải lịch sử bài tập...</div>
              </div>
            ) : historyList.length === 0 ? (
              <div className="py-16 text-center text-purple-400 space-y-2">
                <FileText size={42} className="mx-auto opacity-50" />
                <div className="text-lg font-bold text-white">Chưa có bài tập nào được lưu</div>
                <p className="text-xs text-purple-300">Hãy chọn một cấp độ ở trên để bắt đầu làm bài tập ứng dụng!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {historyList.map(item => (
                  <div 
                    key={item.id} 
                    className="p-5 rounded-2xl bg-purple-950/60 border border-purple-800/40 hover:border-purple-600 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-800 text-purple-200">
                          {item.level}
                        </span>
                        <span className="text-sm font-black text-white">{item.title || "Bài tập ứng dụng"}</span>
                        <span className="text-xs text-purple-400 font-mono">
                          • {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300 line-clamp-2 italic font-serif">
                        "{item.content}"
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 self-end md:self-auto">
                      <div className="text-right">
                        <div className={`text-base font-black font-mono ${item.scorePercent >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.scorePercent}%
                        </div>
                        <div className="text-[10px] text-purple-400 font-bold">
                          {item.isPassed ? 'ĐẠT' : 'CẦN ÔN LẠI'}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedHistoryItem(item)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center space-x-1"
                      >
                        <Eye size={14} />
                        <span>Xem chi tiết</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* KHU VỰC LÀM BÀI TẬP HIỆN TẠI (550, 700 ĐỌC, 700 NGHE, 850) */
          <div className="bg-[#321345] rounded-3xl p-6 md:p-8 border border-purple-800/40 shadow-2xl space-y-6">
            
            {/* TIÊU ĐỀ BÀI TẬP VÀ HÀNH ĐỘNG */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-purple-800/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-800 text-amber-300 border border-purple-600/40">
                    {LEVELS.find(l => l.id === currentLevel)?.name}
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    {exercise?.title || "Đang tạo bài tập..."}
                  </h2>
                </div>
                <p className="text-xs text-purple-300 mt-1">
                  {currentLevel === 'TOEIC_700_LISTENING' 
                    ? "Nghe audio đoạn văn bên dưới và gõ từ vào các chỗ trống."
                    : currentLevel === 'TOEIC_700_READING'
                    ? "Đọc đoạn văn và điền từ thích hợp vào các chỗ trống (Không có âm thanh)."
                    : "Điền từ hoặc cụm từ thích hợp vào chỗ trống trong ngữ cảnh."
                  }
                </p>
              </div>

              <button
                type="button"
                disabled={generating}
                onClick={() => fetchNewExercise(currentLevel)}
                className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-300 hover:text-white font-extrabold text-xs border border-purple-700/50 flex items-center space-x-1.5 transition cursor-pointer self-start md:self-auto disabled:opacity-50"
              >
                <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
                <span>✨ AI Sinh bài mới</span>
              </button>
            </div>

            {generating ? (
              <div className="py-24 text-center space-y-4">
                <Sparkles size={48} className="animate-bounce text-amber-400 mx-auto" />
                <div className="text-xl font-black text-white">AI đang biên soạn ngữ cảnh mới...</div>
                <p className="text-sm text-purple-300 max-w-md mx-auto">
                  Gemini đang phân tích 50 cụm từ của bộ thẻ và tạo câu hỏi theo chuẩn khảo thí TOEIC...
                </p>
              </div>
            ) : exercise ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* THANH PHÁT AUDIO (CHO CẤP ĐỘ 700 NGHE HOẶC NGHE LẠI KHI CÓ KẾT QUẢ) */}
                {(currentLevel === 'TOEIC_700_LISTENING' || result) && exercise.audioScript && (
                  <div className="bg-purple-950/70 p-4 rounded-2xl border border-cyan-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={isPlayingAudio ? stopAudio : () => playAudio(speechRate)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition cursor-pointer shadow-md ${
                          isPlayingAudio 
                            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse' 
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                        }`}
                      >
                        {isPlayingAudio ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                      </button>
                      <div>
                        <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                          <Volume2 size={16} className="text-cyan-400" />
                          <span>{isPlayingAudio ? 'Đang phát âm đoạn văn...' : 'Bấm để nghe đoạn văn'}</span>
                        </div>
                        <div className="text-xs text-purple-300">Giọng đọc bản xứ US tự nhiên (Web Speech API)</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-purple-300 font-bold">Tốc độ:</span>
                      {[0.8, 1.0, 1.2].map(rate => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setSpeechRate(rate);
                            if (isPlayingAudio) playAudio(rate);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                            speechRate === rate 
                              ? 'bg-cyan-500 text-purple-950 shadow-md' 
                              : 'bg-purple-900/60 text-purple-300 hover:bg-purple-800'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* VĂN BẢN VÀ CÁC CHỖ TRỐNG ĐIỀN TỪ */}
                {renderInteractiveContent()}

                {/* NÚT NỘP BÀI CHẤM ĐIỂM */}
                {!result && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-purple-400/80">
                      Gõ chính xác từ hoặc cụm từ vào ô trống • Nhấn <b>Enter</b> hoặc bấm nút để nộp
                    </span>
                    <button
                      type="submit"
                      disabled={submitting || userInputs.every(txt => !txt || !txt.trim())}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl transition cursor-pointer flex items-center space-x-2"
                    >
                      <Send size={16} />
                      <span>{submitting ? 'Đang chấm điểm...' : 'Nộp bài & Chấm điểm ↵'}</span>
                    </button>
                  </div>
                )}

                {/* BẢNG KẾT QUẢ VÀ LỜI GIẢI THÍCH CHI TIẾT SAU KHI NỘP */}
                {result && (
                  <div className="space-y-6 pt-4 animate-fadeIn">
                    {/* BANNER ĐIỂM SỐ */}
                    <div className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl ${
                      result.scorePercent >= 70 
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200' 
                        : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                    }`}>
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${
                          result.scorePercent >= 70 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {result.scorePercent >= 70 ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                        </div>
                        <div>
                          <div className="text-xl font-black text-white">
                            {result.scorePercent === 100 
                              ? 'Xuất sắc! Chính xác tuyệt đối 100%!' 
                              : result.scorePercent >= 70 
                              ? 'Làm tốt lắm! Bạn đã vượt qua bài tập.' 
                              : 'Chưa đạt! Hãy xem kỹ phần giải thích bên dưới để ôn lại.'}
                          </div>
                          <div className="text-xs opacity-80 mt-0.5">
                            Kết quả bài làm đã được tự động lưu vào Lịch sử.
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-black font-mono">
                          {result.scorePercent}%
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider">
                          {result.passed ? 'ĐẠT YÊU CẦU' : 'CẦN LUYỆN LẠI'}
                        </div>
                      </div>
                    </div>

                    {/* DỊCH NGHĨA TIẾNG VIỆT TOÀN ĐOẠN */}
                    {exercise.translation && (
                      <div className="p-5 rounded-2xl bg-purple-950/70 border border-purple-800/40 text-purple-200 text-sm space-y-1">
                        <div className="text-xs uppercase font-extrabold text-purple-400 tracking-wider">Bản dịch tiếng Việt tham khảo:</div>
                        <p className="leading-relaxed font-serif italic text-purple-100">
                          "{exercise.translation}"
                        </p>
                      </div>
                    )}

                    {/* HỘP GIẢI THÍCH NGỮ PHÁP TỪ AI (EXPLANATION BOX) */}
                    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-purple-950/90 to-purple-900/70 border-2 border-indigo-500/40 shadow-2xl space-y-3">
                      <div className="flex items-center space-x-2 text-indigo-300 font-extrabold text-base border-b border-indigo-500/20 pb-2">
                        <BookOpen size={20} className="text-indigo-400" />
                        <span>Phân tích & Giải thích chi tiết từ AI:</span>
                      </div>

                      <div className="text-sm md:text-base text-purple-100/90 leading-relaxed whitespace-pre-line font-normal">
                        {exercise.explanation}
                      </div>
                    </div>

                    {/* HÀNH ĐỘNG TIẾP THEO */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentLevel('HISTORY')}
                        className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-300 font-bold text-xs transition cursor-pointer flex items-center space-x-1.5"
                      >
                        <History size={14} />
                        <span>Xem Lịch sử bài tập</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fetchNewExercise(currentLevel)}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl transition cursor-pointer flex items-center space-x-2"
                      >
                        <Sparkles size={16} />
                        <span>Làm câu tiếp theo ✨</span>
                      </button>
                    </div>
                  </div>
                )}

              </form>
            ) : null}

          </div>
        )}

      </div>

      {/* MODAL XEM CHI TIẾT BÀI TẬP LỊCH SỬ CŨ */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#321345] w-full max-w-3xl rounded-3xl p-6 md:p-8 border border-purple-700/50 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-800/40 pb-3">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-800 text-amber-300 mr-2">
                  {selectedHistoryItem.level}
                </span>
                <span className="font-black text-lg text-white">{selectedHistoryItem.title}</span>
              </div>
              <button 
                onClick={() => setSelectedHistoryItem(null)} 
                className="text-purple-400 hover:text-white p-1 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-purple-950/60 p-5 rounded-2xl border border-purple-800/40 text-base leading-relaxed text-white">
              {selectedHistoryItem.content}
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase font-extrabold text-purple-400">Đáp án của bài:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {selectedHistoryItem.targetAnswers?.map((ans, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-purple-950/80 border border-purple-800/50 flex justify-between">
                    <span className="text-purple-300 font-bold">Ô ({idx + 1}):</span>
                    <span className="text-emerald-400 font-mono font-black">{ans}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedHistoryItem.translation && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs text-purple-200">
                <span className="font-bold text-purple-400 block mb-1">Bản dịch tiếng Việt:</span>
                <p className="italic font-serif">"{selectedHistoryItem.translation}"</p>
              </div>
            )}

            {selectedHistoryItem.explanation && (
              <div className="p-5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs md:text-sm text-purple-200 space-y-1">
                <span className="font-extrabold text-indigo-300 block mb-1">Giải thích ngữ pháp:</span>
                <p className="whitespace-pre-line leading-relaxed">{selectedHistoryItem.explanation}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-5 py-2 rounded-xl bg-purple-800 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-6xl mx-auto py-4 flex items-center justify-between text-xs text-purple-400/60 border-t border-purple-900/40 mt-8">
        <div>Vocabulary Mastery • Bài tập ứng dụng ngữ cảnh TOEIC (Part 4, 5, 6, 7)</div>
        <div>Hỗ trợ Google Gemini AI & Web Speech API</div>
      </footer>

    </div>
  );
}
