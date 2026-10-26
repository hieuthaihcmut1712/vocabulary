import React, { useState, useRef, useEffect } from 'react';
import { Crown, Sparkles, Check, ChevronDown, UserCheck } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

export default function ProfileSwitcher({ onProfileChange }) {
  const { profile, isDTan, setProfile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (targetProfile) => {
    if (targetProfile !== profile) {
      setProfile(targetProfile);
      if (onProfileChange) {
        onProfileChange(targetProfile);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl text-xs md:text-sm font-extrabold shadow-lg transition-all cursor-pointer border ${
          isDTan
            ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-teal-300/40 shadow-teal-500/20 ring-2 ring-teal-400/30'
            : 'bg-gradient-to-r from-amber-600 via-purple-700 to-indigo-700 hover:from-amber-500 hover:to-indigo-600 text-white border-amber-300/40 shadow-amber-500/20 ring-2 ring-amber-400/30'
        }`}
        title="Chuyển đổi giao diện giữa Bản gốc (Tôi) và DTan"
      >
        {isDTan ? (
          <>
            <Sparkles size={16} className="text-teal-200 animate-pulse" />
            <span className="tracking-wide">✨ DTan</span>
          </>
        ) : (
          <>
            <Crown size={16} className="text-amber-300" />
            <span className="tracking-wide">👑 Bản gốc (Tôi)</span>
          </>
        )}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#2a113a] border border-purple-600/50 shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-bold text-purple-300/80 uppercase tracking-wider border-b border-purple-800/40 mb-1">
            Chọn không gian học tập
          </div>

          {/* Option 1: Bản gốc (Hieu) */}
          <button
            onClick={() => handleSelect('hieu')}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-start space-x-3 cursor-pointer ${
              !isDTan
                ? 'bg-purple-900/70 border border-amber-400/40 text-white shadow-inner'
                : 'text-purple-200 hover:bg-purple-900/40'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Crown size={17} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-amber-200">Bản gốc (Tôi)</span>
                {!isDTan && <Check size={14} className="text-amber-300 shrink-0" />}
              </div>
              <p className="text-[11px] text-purple-300/80 leading-snug mt-0.5">
                Dữ liệu gốc của bạn, đầy đủ nghe chép chính tả &amp; biểu đồ học tập.
              </p>
            </div>
          </button>

          {/* Option 2: DTan */}
          <button
            onClick={() => handleSelect('dtan')}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-start space-x-3 cursor-pointer ${
              isDTan
                ? 'bg-teal-950/70 border border-teal-400/40 text-white shadow-inner'
                : 'text-purple-200 hover:bg-purple-900/40'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={17} className="text-teal-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-teal-200">Giao diện DTan</span>
                {isDTan && <Check size={14} className="text-teal-300 shrink-0" />}
              </div>
              <p className="text-[11px] text-purple-300/80 leading-snug mt-0.5">
                10 phần ôn 600 từ, 10 phần đọc điền, 50 Lesson TOEIC &amp; Lịch sử làm bài.
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
