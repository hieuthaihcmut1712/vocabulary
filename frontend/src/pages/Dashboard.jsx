import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Sparkles, 
  Trophy, 
  Zap, 
  Layers,
  GraduationCap,
  RefreshCw,
  Lock,
  Target,
  Headphones,
  Languages
} from 'lucide-react';

export default function Dashboard() {
  const [decks, setDecks] = useState([]);
  const [comprehensiveStatus, setComprehensiveStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/decks');
      if (!res.ok) throw new Error('Không thể tải danh sách bộ thẻ');
      const data = await res.json();
      setDecks(data);

      const resComp = await fetch('/api/exercises/status?deckId=0');
      if (resComp.ok) {
        const compData = await resComp.json();
        setComprehensiveStatus(compData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const totalWordsAll = decks.reduce((acc, d) => acc + (d.totalWords || 0), 0);
  const avgQuizProgress = decks.length > 0 
    ? Math.round((decks.reduce((acc, d) => acc + (d.progressPercent || 0), 0) / decks.length) * 10) / 10 
    : 0;
  const avgReverseProgress = decks.length > 0 
    ? Math.round((decks.reduce((acc, d) => acc + (d.reverseProgressPercent || 0), 0) / decks.length) * 10) / 10 
    : 0;
  const avgListeningProgress = decks.length > 0 
    ? Math.round((decks.reduce((acc, d) => acc + (d.listeningProgressPercent || 0), 0) / decks.length) * 10) / 10 
    : 0;

  return (
    <div className="min-h-screen bg-[#1f0d2b] text-white flex flex-col justify-between p-4 md:p-8 font-['Quicksand'] select-none">
      
      {/* HEADER TRANG CHỦ */}
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between py-4 px-6 bg-[#321345] rounded-3xl shadow-2xl border border-purple-800/40 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <GraduationCap size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
                Vocabulary Mastery
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">Quizizz 3-Skills</span>
              </h1>
              <p className="text-xs text-purple-300 font-medium">Luyện phản xạ từ vựng 2 chiều (Anh-Việt, Việt-Anh) & Nghe chính tả ngắt quãng</p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center flex-wrap gap-2 text-xs md:text-sm">
            <div className="bg-purple-950/60 px-3 py-1.5 rounded-2xl border border-purple-800/40 flex items-center space-x-2">
              <Layers size={15} className="text-purple-400" />
              <span className="text-purple-300">Bộ thẻ:</span>
              <span className="font-extrabold text-white">{decks.length}</span>
            </div>

            <div className="bg-purple-950/60 px-3 py-1.5 rounded-2xl border border-purple-800/40 flex items-center space-x-2">
              <BookOpen size={15} className="text-teal-400" />
              <span className="text-purple-300">Tổng từ:</span>
              <span className="font-extrabold text-teal-300">{totalWordsAll}</span>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-2xl flex items-center space-x-2">
              <Zap size={15} className="text-emerald-400" />
              <span className="text-emerald-300">Anh &rarr; Việt:</span>
              <span className="font-extrabold text-emerald-300">{avgQuizProgress}%</span>
            </div>

            <div className="bg-indigo-950/40 border border-indigo-500/30 px-3 py-1.5 rounded-2xl flex items-center space-x-2">
              <Languages size={15} className="text-indigo-400" />
              <span className="text-indigo-300">Việt &rarr; Anh:</span>
              <span className="font-extrabold text-indigo-300">{avgReverseProgress}%</span>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-2xl flex items-center space-x-2">
              <Headphones size={15} className="text-cyan-400" />
              <span className="text-cyan-300">Nghe:</span>
              <span className="font-extrabold text-cyan-300">{avgListeningProgress}%</span>
            </div>
          </div>
        </header>

        {/* HERO TITLE & EXPLANATION */}
        <div className="my-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-wide flex items-center gap-3">
              <span>Các bộ thẻ của bạn</span>
              <Sparkles className="text-yellow-400" size={26} />
            </h2>
            <p className="text-purple-300/80 text-sm mt-1 max-w-3xl">
              Mỗi bộ thẻ gồm 3 kỹ năng riêng biệt: <b>Anh &rarr; Việt</b>, <b>Việt &rarr; Anh</b>, và <b>Nghe chính tả</b>. Mỗi kỹ năng đều có thanh tiến độ và phần luyện tập tự do riêng khi đạt 100%.
            </p>
          </div>

          <button 
            onClick={fetchDecks} 
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 text-xs font-bold border border-purple-700/40 transition cursor-pointer self-start md:self-auto"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* BANNER LUYỆN TẬP TỔNG HỢP: KHO TOÀN BỘ TỪ ĐÃ THUỘC (TRỌNG SỐ 1)          */}
        {/* ========================================================================= */}
        <div className="mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#44185c] via-[#311142] to-[#200c2c] border-2 border-amber-500/50 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

          <div className="flex items-start space-x-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 text-purple-950 font-black shrink-0">
              <Trophy size={32} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  CHỨC NĂNG MỚI
                </span>
                <h3 className="text-2xl font-black text-white tracking-wide">
                  Luyện tập Tổng hợp — Toàn bộ từ đã học thuộc
                </h3>
              </div>
              <p className="text-sm text-purple-200/80 max-w-2xl">
                AI tự động gom tất cả các từ vựng bạn đã thành thạo (đạt <b>trọng số 1</b>) từ mọi bộ thẻ để sinh bài tập ứng dụng ngữ cảnh TOEIC 4 cấp độ (<b>550</b>, <b>700 Đọc</b>, <b>700 Nghe</b>, <b>850</b>).
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="text-amber-300 font-extrabold flex items-center gap-1">
                  <Sparkles size={13} />
                  Kho hiện tại: <b className="text-white font-mono text-sm">{comprehensiveStatus?.quizProgress || 48}</b> từ đã thuộc
                </span>
                <span className="text-purple-400">• Đã làm: <b className="text-purple-200">{comprehensiveStatus?.totalCompletedExercises || 0}</b> bài test</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 z-10">
            <button
              onClick={() => navigate('/deck/0/exercises')}
              className="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2.5 border border-amber-300/40"
            >
              <Zap size={16} className="text-yellow-200" />
              <span>Vào Luyện tập Tổng hợp ➔</span>
            </button>
          </div>
        </div>

        {/* DANH SÁCH CÁC BỘ THẺ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw size={36} className="animate-spin text-purple-400" />
            <div className="text-purple-300 font-bold">Đang tải dữ liệu bộ thẻ...</div>
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-20 bg-purple-950/30 rounded-3xl border border-purple-900/40">
            <BookOpen size={48} className="mx-auto text-purple-400 mb-3 opacity-60" />
            <div className="text-xl font-bold text-white">Chưa có bộ thẻ nào</div>
            <p className="text-purple-300 text-sm mt-1">Hãy thêm bộ thẻ để bắt đầu học</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {decks.map((deck) => {
              const quizProg = deck.progressPercent || 0;
              const revProg = deck.reverseProgressPercent || 0;
              const listProg = deck.listeningProgressPercent || 0;

              return (
                <div 
                  key={deck.id}
                  className="bg-gradient-to-b from-[#341549] to-[#260f35] rounded-3xl p-6 border border-purple-700/30 shadow-xl hover:shadow-2xl hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden space-y-5"
                >
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

                  {/* THÔNG TIN BỘ THẺ */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-purple-900/70 text-purple-200 border border-purple-600/30">
                        {deck.totalWords} TỪ VỰNG
                      </span>
                      <span className="text-xs text-purple-400 font-medium">
                        ID: #{deck.id}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white group-hover:text-purple-200 transition mb-1">
                      {deck.name}
                    </h3>
                    <p className="text-sm text-purple-300/80 line-clamp-2 min-h-[40px]">
                      {deck.description || "Bộ thẻ từ vựng phản xạ nhanh"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* ========================================================= */}
                    {/* KỸ NĂNG 1: QUIZZIZ ANH -> VIỆT (TỪ TIẾNG ANH, CHỌN NGHĨA) */}
                    {/* ========================================================= */}
                    <div className="bg-[#291038] p-3.5 rounded-2xl border border-purple-800/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-emerald-300">
                          <Zap size={14} className="text-emerald-400" />
                          <span>1. Quizziz: Anh &rarr; Việt (Nhận diện nghĩa)</span>
                        </div>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {quizProg.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-800/40">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(quizProg > 0 ? 3 : 0, quizProg))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-purple-300">
                        <span>Thuộc: <b className="text-emerald-400">{deck.masteredWords || 0}</b></span>
                        <span>Đang nhớ: <b className="text-teal-300">{deck.learningWords || 0}</b></span>
                        <span>Cần học: <b className="text-purple-400">{deck.unlearnedWords || 0}</b></span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          onClick={() => navigate(`/deck/${deck.id}`)}
                          className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
                        >
                          <Zap size={13} className="text-yellow-300" />
                          <span>Vào Quizziz</span>
                        </button>

                        {(deck.quizPracticeUnlocked || quizProg >= 100) ? (
                          <button
                            onClick={() => navigate(`/deck/${deck.id}/practice`)}
                            className="py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer border border-teal-400/30"
                          >
                            <Target size={13} className="text-teal-200" />
                            <span>Luyện tập 🎯</span>
                          </button>
                        ) : (
                          <div 
                            title="Cần đạt 100% một lần để mở khóa vĩnh viễn"
                            className="py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-400/60 font-bold text-xs flex items-center justify-center space-x-1 cursor-not-allowed select-none"
                          >
                            <Lock size={12} className="text-amber-400/70" />
                            <span>Luyện tập (Khóa)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* KỸ NĂNG 2: QUIZZIZ VIỆT -> ANH (NGHĨA TIẾNG VIỆT, CHỌN TỪ)*/}
                    {/* ========================================================= */}
                    <div className="bg-[#291038] p-3.5 rounded-2xl border border-purple-800/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-indigo-300">
                          <Languages size={14} className="text-indigo-400" />
                          <span>2. Quizziz: Việt &rarr; Anh (Phản xạ từ vựng)</span>
                        </div>
                        <span className="font-mono font-black text-indigo-400 text-sm">
                          {revProg.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-800/40">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(revProg > 0 ? 3 : 0, revProg))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-purple-300">
                        <span>Thuộc: <b className="text-emerald-400">{deck.reverseMasteredWords || 0}</b></span>
                        <span>Đang nhớ: <b className="text-teal-300">{deck.reverseLearningWords || 0}</b></span>
                        <span>Cần học: <b className="text-purple-400">{deck.reverseUnlearnedWords || 0}</b></span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          onClick={() => navigate(`/deck/${deck.id}/reverse`)}
                          className="py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer border border-indigo-400/30"
                        >
                          <Languages size={13} className="text-indigo-200" />
                          <span>Vào Quizziz</span>
                        </button>

                        {(deck.reversePracticeUnlocked || revProg >= 100) ? (
                          <button
                            onClick={() => navigate(`/deck/${deck.id}/reverse-practice`)}
                            className="py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer border border-teal-400/30"
                          >
                            <Target size={13} className="text-teal-200" />
                            <span>Luyện tập 🎯</span>
                          </button>
                        ) : (
                          <div 
                            title="Cần đạt 100% một lần để mở khóa vĩnh viễn"
                            className="py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-400/60 font-bold text-xs flex items-center justify-center space-x-1 cursor-not-allowed select-none"
                          >
                            <Lock size={12} className="text-amber-400/70" />
                            <span>Luyện tập (Khóa)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* KỸ NĂNG 3: LUYỆN NGHE CHÍNH TẢ (PHÁT ÂM, GÕ CHÍNH TẢ)     */}
                    {/* ========================================================= */}
                    <div className="bg-[#291038] p-3.5 rounded-2xl border border-purple-800/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-bold text-xs text-cyan-300">
                          <Headphones size={14} className="text-cyan-400" />
                          <span>3. Luyện nghe chính tả (Nghe / Gõ)</span>
                        </div>
                        <span className="font-mono font-black text-cyan-400 text-sm">
                          {listProg.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden p-0.5 border border-purple-800/40">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(listProg > 0 ? 3 : 0, listProg))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-purple-300">
                        <span>Thuộc: <b className="text-cyan-400">{deck.listeningMasteredWords || 0}</b></span>
                        <span>Đang nhớ: <b className="text-blue-300">{deck.listeningLearningWords || 0}</b></span>
                        <span>Cần học: <b className="text-purple-400">{deck.listeningUnlearnedWords || 0}</b></span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          onClick={() => navigate(`/deck/${deck.id}/listening`)}
                          className="py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer border border-cyan-400/30"
                        >
                          <Headphones size={13} className="text-cyan-200" />
                          <span>Học nghe</span>
                        </button>

                        {(deck.listeningPracticeUnlocked || listProg >= 100) ? (
                          <button
                            onClick={() => navigate(`/deck/${deck.id}/listening-practice`)}
                            className="py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer border border-teal-400/30"
                          >
                            <Target size={13} className="text-teal-200" />
                            <span>Luyện tập 🎯</span>
                          </button>
                        ) : (
                          <div 
                            title="Cần đạt 100% một lần để mở khóa vĩnh viễn"
                            className="py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-400/60 font-bold text-xs flex items-center justify-center space-x-1 cursor-not-allowed select-none"
                          >
                            <Lock size={12} className="text-amber-400/70" />
                            <span>Luyện tập (Khóa)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* BÀI TẬP ỨNG DỤNG NGỮ CẢNH TOEIC (550, 700, 850)           */}
                    {/* ========================================================= */}
                    {(() => {
                      const isMasteredAll = 
                        (deck.quizPracticeUnlocked || quizProg >= 100) &&
                        (deck.reversePracticeUnlocked || revProg >= 100) &&
                        (deck.listeningPracticeUnlocked || listProg >= 100);

                      const finishedSkillsCount = 
                        (deck.quizPracticeUnlocked || quizProg >= 100 ? 1 : 0) +
                        (deck.reversePracticeUnlocked || revProg >= 100 ? 1 : 0) +
                        (deck.listeningPracticeUnlocked || listProg >= 100 ? 1 : 0);

                      return (
                        <div className="pt-3 border-t border-purple-800/40">
                          {isMasteredAll ? (
                            <div className="bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-rose-950/60 p-3.5 rounded-2xl border border-amber-500/50 space-y-2.5 shadow-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-300">
                                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                                  <span>Bài tập ứng dụng TOEIC (Mastery)</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/40">
                                  ✨ ĐÃ MỞ KHÓA
                                </span>
                              </div>

                              <p className="text-[11px] text-purple-200/90 leading-relaxed">
                                AI biên soạn ngữ cảnh thực tế theo 3 cấp độ: <b>550</b>, <b>700 (Đọc & Nghe)</b>, <b>850</b>.
                              </p>

                              <button
                                onClick={() => navigate(`/deck/${deck.id}/exercises`)}
                                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-extrabold text-xs shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
                              >
                                <GraduationCap size={15} />
                                <span>Vào làm Bài tập ứng dụng ➔</span>
                              </button>
                            </div>
                          ) : (
                            <div className="bg-[#210c2e] p-3 rounded-2xl border border-purple-900/50 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center space-x-2 text-purple-400">
                                <Lock size={14} className="text-amber-400/80 shrink-0" />
                                <div>
                                  <div className="font-bold text-purple-300 text-[11px]">
                                    Bài tập ứng dụng TOEIC (550, 700, 850)
                                  </div>
                                  <div className="text-[10px] text-purple-400/70">
                                    Cần 100% cả 3 kỹ năng để mở khóa AI sinh đề
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
                                {finishedSkillsCount}/3 kỹ năng
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto mt-12 py-4 text-center text-xs text-purple-400/60 border-t border-purple-900/40">
        Vocabulary Quizizz 3-Skills Platform &bull; Java Spring Boot &bull; PostgreSQL &bull; React Vite
      </footer>

    </div>
  );
}
