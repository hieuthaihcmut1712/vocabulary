import React, { useState } from 'react';
import { 
  Clock, 
  Flame, 
  Trophy, 
  BarChart2, 
  Sparkles, 
  Calendar, 
  Zap, 
  Headphones, 
  BookOpen, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';

export default function StudyChart({ stats, loading, onRangeChange, currentDays = 7 }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  if (loading) {
    return (
      <div className="w-full bg-[#2a133d]/80 rounded-3xl p-6 border border-purple-800/40 shadow-xl backdrop-blur-md animate-pulse flex flex-col items-center justify-center min-h-[300px]">
        <Clock size={36} className="text-purple-400 animate-spin mb-3" />
        <span className="text-purple-300 font-bold text-sm">Đang tải thống kê thời gian học...</span>
      </div>
    );
  }

  const dailyList = stats?.dailyStats || [];
  const maxMinutes = Math.max(30, ...dailyList.map((d) => d.durationMinutes || 0));

  // Mục tiêu học tập hàng ngày (mặc định 20 phút)
  const DAILY_GOAL_MINUTES = 20;
  const todayMinutes = stats?.todayMinutes || 0;
  const goalPercent = Math.min(100, Math.round((todayMinutes / DAILY_GOAL_MINUTES) * 100));

  // Tính tổng phân bổ kỹ năng cho tuần này
  const totalQuizSec = dailyList.reduce((acc, d) => acc + (d.quizSeconds || 0), 0);
  const totalReverseSec = dailyList.reduce((acc, d) => acc + (d.reverseSeconds || 0), 0);
  const totalListeningSec = dailyList.reduce((acc, d) => acc + (d.listeningSeconds || 0), 0);
  const totalExerciseSec = dailyList.reduce((acc, d) => acc + (d.exerciseSeconds || 0), 0);
  const grandTotalSec = totalQuizSec + totalReverseSec + totalListeningSec + totalExerciseSec || 1;

  const formatMinSec = (secs) => {
    if (!secs || secs <= 0) return '0p';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0 && s > 0) return `${m}p ${s}s`;
    if (m > 0) return `${m}p`;
    return `${s}s`;
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#2e1244]/95 via-[#230d35]/95 to-[#1a0828]/95 rounded-3xl p-5 md:p-7 border border-purple-700/40 shadow-2xl backdrop-blur-xl">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-purple-800/40">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
            <Clock size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
                Biểu đồ thời gian học
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Tự động đếm
              </span>
            </div>
            <p className="text-xs md:text-sm text-purple-300/80 mt-0.5">
              Hệ thống chỉ tính giờ khi bạn đang thực sự làm Quizz hoặc luyện tập (tự dừng khi chuyển tab)
            </p>
          </div>
        </div>

        {/* Bộ lọc 7 ngày / 14 ngày */}
        <div className="flex items-center space-x-1.5 bg-purple-950/80 p-1.5 rounded-2xl border border-purple-800/50 self-start md:self-auto">
          <button
            onClick={() => onRangeChange && onRangeChange(7)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentDays === 7 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            7 ngày
          </button>
          <button
            onClick={() => onRangeChange && onRangeChange(14)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentDays === 14 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            14 ngày
          </button>
        </div>
      </div>

      {/* 2. 4 THẺ THỐNG KÊ NHANH (CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 my-5">
        
        {/* Card 1: Thời gian học hôm nay */}
        <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/40 shadow-md relative overflow-hidden group hover:border-amber-500/50 transition duration-300">
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1.5">
            <span>⏱️ Hôm nay</span>
            <span className="text-[11px] text-amber-400 font-bold">{goalPercent}% mục tiêu</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-300 font-mono tracking-tight">
            {stats?.todayFormatted || '0 phút'}
          </div>
          {/* Thanh tiến độ mục tiêu 20p */}
          <div className="w-full bg-purple-900/60 h-2 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-purple-400 mt-1 flex justify-between">
            <span>Mục tiêu: 20p/ngày</span>
            <span>{todayMinutes}/{DAILY_GOAL_MINUTES}p</span>
          </div>
        </div>

        {/* Card 2: Chuỗi ngày học liên tục (Streak) */}
        <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/40 shadow-md relative overflow-hidden group hover:border-orange-500/50 transition duration-300">
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1.5">
            <span>🔥 Chuỗi liên tiếp</span>
            <Flame size={15} className="text-orange-400 animate-bounce" />
          </div>
          <div className="text-xl md:text-2xl font-black text-orange-400 font-mono tracking-tight">
            {stats?.streakDays || 0} ngày
          </div>
          <p className="text-[11px] text-purple-300/80 mt-2.5">
            {(stats?.streakDays || 0) > 0 ? 'Giữ vững chuỗi học mỗi ngày!' : 'Học hôm nay để bắt đầu chuỗi!'}
          </p>
        </div>

        {/* Card 3: Tổng thời gian tuần này */}
        <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/40 shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition duration-300">
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1.5">
            <span>🏆 Tổng tuần này</span>
            <Trophy size={14} className="text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono tracking-tight">
            {stats?.weeklyFormatted || '0 phút'}
          </div>
          <p className="text-[11px] text-purple-300/80 mt-2.5">
            Trung bình: <b>{stats?.dailyAverageMinutes || 0}p</b> / ngày
          </p>
        </div>

        {/* Card 4: Kỹ năng học nhiều nhất */}
        <div className="bg-purple-950/60 rounded-2xl p-4 border border-purple-700/40 shadow-md relative overflow-hidden group hover:border-cyan-500/50 transition duration-300">
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1.5">
            <span>⚡ Kỹ năng nổi bật</span>
            <TrendingUp size={14} className="text-cyan-400" />
          </div>
          <div className="text-base md:text-lg font-black text-cyan-300 truncate">
            {totalQuizSec >= totalListeningSec && totalQuizSec >= totalExerciseSec ? 'Quizziz Anh ➔ Việt' :
             totalReverseSec >= totalQuizSec && totalReverseSec >= totalListeningSec ? 'Quizziz Việt ➔ Anh' :
             totalListeningSec >= totalExerciseSec ? 'Luyện nghe chính tả' : 'Bài tập TOEIC'}
          </div>
          <p className="text-[11px] text-purple-300/80 mt-2.5">
            {formatMinSec(Math.max(totalQuizSec, totalReverseSec, totalListeningSec, totalExerciseSec))} đã rèn luyện
          </p>
        </div>

      </div>

      {/* 3. BIỂU ĐỒ CỘT THỜI GIAN THEO NGÀY (DAILY BAR CHART) */}
      <div className="bg-[#1c092c]/90 rounded-2xl p-5 border border-purple-800/50 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-xs md:text-sm font-bold text-purple-200">
            <BarChart2 size={16} className="text-purple-400" />
            <span>Biểu đồ thời lượng theo ngày (Phút)</span>
          </div>

          {hoveredDay && (
            <div className="text-xs font-bold text-amber-300 bg-purple-900/60 px-3 py-1 rounded-xl border border-purple-700/50 shadow animate-fade-in">
              {hoveredDay.dayOfWeek} ({hoveredDay.displayDate}): <b>{hoveredDay.formattedDuration}</b>
            </div>
          )}
        </div>

        {/* Container cột biểu đồ */}
        <div className="relative pt-6 pb-2">
          {/* Đường gióng ngang 20 phút mục tiêu */}
          <div 
            className="absolute left-0 right-0 border-b border-dashed border-amber-500/40 z-0 pointer-events-none flex justify-end pr-2"
            style={{ bottom: `${Math.min(90, Math.max(15, (DAILY_GOAL_MINUTES / maxMinutes) * 180 + 35))}px` }}
          >
            <span className="text-[10px] text-amber-400/90 font-mono -mt-4 bg-purple-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
              Mục tiêu: {DAILY_GOAL_MINUTES}p
            </span>
          </div>

          {/* Dãy các cột */}
          <div className="flex items-end justify-between gap-1.5 md:gap-3 h-48 md:h-52 relative z-10">
            {dailyList.map((day, idx) => {
              const heightPercent = Math.max(4, Math.min(100, (day.durationMinutes / maxMinutes) * 100));
              const isHovered = hoveredDay?.date === day.date;
              const hasStudied = day.durationSeconds > 0;

              let barGradient = 'from-purple-800/50 to-indigo-900/60';
              if (day.isToday) {
                barGradient = hasStudied 
                  ? 'from-emerald-400 via-teal-400 to-cyan-500' 
                  : 'from-purple-600/40 to-indigo-700/40 border-dashed';
              } else if (hasStudied) {
                barGradient = 'from-purple-500 via-indigo-500 to-purple-600';
              }

              return (
                <div 
                  key={day.date || idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Nhãn số phút trên đầu cột */}
                  <div className={`text-[10px] md:text-xs font-mono font-bold mb-1.5 transition-all duration-200 ${
                    isHovered 
                      ? 'text-amber-300 scale-125 font-black' 
                      : day.isToday ? 'text-emerald-300' : 'text-purple-400/80'
                  }`}>
                    {day.durationMinutes > 0 ? `${day.durationMinutes}p` : '0p'}
                  </div>

                  {/* Thân cột */}
                  <div className="w-full max-w-[42px] flex items-end justify-center">
                    <div 
                      className={`w-full rounded-t-xl transition-all duration-300 bg-gradient-to-t ${barGradient} ${
                        day.isToday ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30' : ''
                      } ${isHovered ? 'scale-105 brightness-125 shadow-lg' : 'hover:brightness-110'}`}
                      style={{ 
                        height: `${heightPercent}%`,
                        minHeight: '8px'
                      }}
                    />
                  </div>

                  {/* Nhãn Ngày bên dưới (T2, T3, ... hoặc dd/MM) */}
                  <div className="mt-2 text-center">
                    <span className={`text-[11px] md:text-xs font-black block transition ${
                      day.isToday ? 'text-emerald-300 font-extrabold' : 'text-purple-200'
                    }`}>
                      {day.dayOfWeek}
                    </span>
                    <span className="text-[9px] md:text-[10px] text-purple-400/70 font-mono block">
                      {day.displayDate}
                    </span>
                  </div>

                  {/* Badge "Hôm nay" */}
                  {day.isToday && (
                    <span className="mt-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md text-[9px] font-extrabold tracking-tight">
                      Hôm nay
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. PHÂN BỔ THEO KỸ NĂNG (SKILL BREAKDOWN BAR) */}
        <div className="mt-6 pt-4 border-t border-purple-800/40">
          <div className="flex items-center justify-between text-xs text-purple-300 font-bold mb-2">
            <span>Phân bổ thời gian theo kỹ năng ({currentDays} ngày qua):</span>
            <span className="text-purple-400 font-mono text-[11px]">{formatMinSec(grandTotalSec)}</span>
          </div>

          {/* Thanh phân chia nhiều màu */}
          <div className="w-full h-3 bg-purple-950/80 rounded-full overflow-hidden flex shadow-inner border border-purple-800/40">
            <div 
              className="bg-emerald-400 h-full transition-all duration-500" 
              style={{ width: `${(totalQuizSec / grandTotalSec) * 100}%` }}
              title={`Quizziz Anh -> Việt: ${formatMinSec(totalQuizSec)}`}
            />
            <div 
              className="bg-indigo-400 h-full transition-all duration-500" 
              style={{ width: `${(totalReverseSec / grandTotalSec) * 100}%` }}
              title={`Quizziz Việt -> Anh: ${formatMinSec(totalReverseSec)}`}
            />
            <div 
              className="bg-cyan-400 h-full transition-all duration-500" 
              style={{ width: `${(totalListeningSec / grandTotalSec) * 100}%` }}
              title={`Luyện nghe: ${formatMinSec(totalListeningSec)}`}
            />
            <div 
              className="bg-amber-400 h-full transition-all duration-500" 
              style={{ width: `${(totalExerciseSec / grandTotalSec) * 100}%` }}
              title={`Bài tập TOEIC: ${formatMinSec(totalExerciseSec)}`}
            />
          </div>

          {/* Chú thích màu sắc */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[11px] font-medium text-purple-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Quizziz Anh ➔ Việt ({formatMinSec(totalQuizSec)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              Quizziz Việt ➔ Anh ({formatMinSec(totalReverseSec)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Luyện nghe ({formatMinSec(totalListeningSec)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Bài tập TOEIC ({formatMinSec(totalExerciseSec)})
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
