import { useState, useEffect, useRef } from 'react';

/**
 * Hook tự động đếm thời gian học khi người dùng ở trong các trang Quizz / Luyện tập
 * Chỉ đếm thời gian khi tab đang mở (Page Visibility) và người dùng có hoạt động (không idle > 90s).
 * Tự động gửi batch thời gian học về Backend mỗi 20 giây và khi rời trang.
 */
export function useStudyTracker({ mode = 'QUIZ', deckId = null, enabled = true } = {}) {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const unflushedSecondsRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Gửi số giây đã tích lũy lên Backend
  const flushStudyTime = (duration) => {
    if (!enabled || !duration || duration <= 0) return;

    const payload = JSON.stringify({
      deckId: deckId ? Number(deckId) : null,
      mode: mode,
      durationSeconds: duration
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/study/log', blob);
      } else {
        fetch('/api/study/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      // Fallback thông thường
      fetch('/api/study/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Cập nhật timestamp khi có tương tác
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Khi tab ẩn (chuyển tab khác) -> flush ngay số giây đang có và tạm dừng
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
        if (unflushedSecondsRef.current > 0) {
          flushStudyTime(unflushedSecondsRef.current);
          unflushedSecondsRef.current = 0;
        }
      } else {
        lastActivityRef.current = Date.now();
        setIsActive(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Khi đóng cửa sổ hoặc reload trang -> flush ngay lập tức
    const handleBeforeUnload = () => {
      if (unflushedSecondsRef.current > 0) {
        flushStudyTime(unflushedSecondsRef.current);
        unflushedSecondsRef.current = 0;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Vòng lặp đếm giây mỗi giây
    timerRef.current = setInterval(() => {
      // Không đếm nếu tab ẩn
      if (document.hidden) {
        setIsActive(false);
        return;
      }

      // Kiểm tra xem có âm thanh nào đang phát không (audio track hoặc Web Speech)
      let isAudioPlaying = false;
      try {
        const audios = document.querySelectorAll('audio');
        for (const a of audios) {
          if (!a.paused && !a.ended && a.currentTime > 0) {
            isAudioPlaying = true;
            break;
          }
        }
        if (!isAudioPlaying && typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
          isAudioPlaying = true;
        }
      } catch (e) {}

      if (isAudioPlaying) {
        lastActivityRef.current = Date.now();
      }

      // Không đếm nếu không tương tác quá 300 giây (5 phút) và không phát audio
      const now = Date.now();
      const idleTime = (now - lastActivityRef.current) / 1000;
      if (idleTime > 300) {
        setIsActive(false);
        return;
      }

      setIsActive(true);
      setSessionSeconds((prev) => prev + 1);
      unflushedSecondsRef.current += 1;

      // Mỗi 20 giây học tích lũy -> tự động gửi batch lên server
      if (unflushedSecondsRef.current >= 20) {
        flushStudyTime(unflushedSecondsRef.current);
        unflushedSecondsRef.current = 0;
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Flush số giây còn lại khi thoát trang
      if (unflushedSecondsRef.current > 0) {
        flushStudyTime(unflushedSecondsRef.current);
        unflushedSecondsRef.current = 0;
      }
    };
  }, [mode, deckId, enabled]);

  // Định dạng thời gian phiên học hiện tại: "05:20" hoặc "01:15:30"
  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const resetActivity = () => {
    lastActivityRef.current = Date.now();
    setIsActive(true);
  };

  return {
    sessionSeconds,
    formattedSessionTime: formatTime(sessionSeconds),
    isActive,
    resetActivity
  };
}
