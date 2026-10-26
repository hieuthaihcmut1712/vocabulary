import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  ChevronLeft,
  Volume2,
  FileText,
  Check,
  RefreshCw,
  Eye,
  Send,
  Clock,
  History,
  Trash2,
  Filter,
  Calendar,
  ListFilter
} from 'lucide-react';
import { useStudyTracker } from '../hooks/useStudyTracker';
import DictationPractice from '../components/DictationPractice';
import ProfileSwitcher from '../components/ProfileSwitcher';
import { useProfile } from '../context/ProfileContext';

// Helper to normalize options from either array or map
const getOptionList = (options) => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map((opt, i) => {
      if (typeof opt === 'string') {
        const key = ['A', 'B', 'C', 'D'][i] || String(i);
        return { key, text: opt };
      }
      return {
        key: opt.key || ['A', 'B', 'C', 'D'][i] || String(i),
        text: opt.text || opt.label || ''
      };
    });
  }
  return Object.entries(options).map(([k, v]) => ({ key: k, text: v }));
};

export default function LessonStudyPage() {
  const { lessonId: paramLessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLessonId = parseInt(paramLessonId, 10) || 1;
  const { profile, isDTan } = useProfile();

  // Active Tab: 'exercise' (Words in Context) | 'test' (TOEIC Practice Test)
  const [activeTab, setActiveTab] = useState('exercise');

  useEffect(() => {
    if (isDTan && activeTab === 'dictation') {
      setActiveTab('exercise');
    }
  }, [isDTan, activeTab]);

  // Exercise State (Words in Context)
  const [exerciseData, setExerciseData] = useState(null);
  const [exerciseLoading, setExerciseLoading] = useState(true);
  const [exerciseAnswers, setExerciseAnswers] = useState({}); // { [index]: string }
  const [selectedBlank, setSelectedBlank] = useState(1);
  const [exerciseResult, setExerciseResult] = useState(null);
  const [exerciseSubmitting, setExerciseSubmitting] = useState(false);

  // Test State (Practice Test)
  const [testData, setTestData] = useState(null);
  const [testLoading, setTestLoading] = useState(true);
  const [testAnswers, setTestAnswers] = useState({}); // { [qNum]: 'A' | 'B' | 'C' | 'D' }
  const [testResult, setTestResult] = useState(null);
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [useColorImage, setUseColorImage] = useState(true);
  const [showPart3Transcript, setShowPart3Transcript] = useState(false);
  const [showPart4Transcript, setShowPart4Transcript] = useState(false);

  // Test History State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [historyTestData, setHistoryTestData] = useState(null);
  const [historyFilterAll, setHistoryFilterAll] = useState(false); // false: current lesson, true: all lessons
  const [historyQuestionFilter, setHistoryQuestionFilter] = useState('all'); // 'all', 'wrong', 'correct', 'listening', 'reading'
  const [historyViewMode, setHistoryViewMode] = useState('full'); // 'full' (đề thi đầy đủ & transcript) | 'list' (danh sách từng câu)
  const [historyUseColorImage, setHistoryUseColorImage] = useState(true);
  const [historyShowPart3Transcript, setHistoryShowPart3Transcript] = useState(true);
  const [historyShowPart4Transcript, setHistoryShowPart4Transcript] = useState(true);

  // Audio Player State
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Track study time automatically (disabled for DTan)
  const deckIdForLesson = Math.ceil(currentLessonId / 5) + 18; // Deck 19..28
  const { formattedSessionTime, isActive } = useStudyTracker({ mode: 'EXERCISE', deckId: deckIdForLesson, enabled: !isDTan });

  // Load Exercise
  const loadExercise = async (id) => {
    setExerciseLoading(true);
    setExerciseResult(null);
    setExerciseAnswers({});
    setSelectedBlank(1);
    try {
      const res = await fetch(`/api/lesson-practice/exercise/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.passage && data.passageTemplate) {
          data.passage = data.passageTemplate;
        }
        setExerciseData(data);
        return;
      }
      throw new Error('API error');
    } catch (err) {
      console.warn('Backend exercise fetch error, trying static json fallback:', err);
      try {
        const staticRes = await fetch('/lessons_practice_data.json');
        if (staticRes.ok) {
          const allData = await staticRes.json();
          const lessonData = allData[String(id)]?.exercise;
          if (lessonData) {
            if (!lessonData.passage && lessonData.passageTemplate) {
              lessonData.passage = lessonData.passageTemplate;
            }
            setExerciseData(lessonData);
            return;
          }
        }
      } catch (staticErr) {
        console.error('Static json fallback error:', staticErr);
      }
      setExerciseData(null);
    } finally {
      setExerciseLoading(false);
    }
  };

  // Load Test
  const loadTest = async (id) => {
    setTestLoading(true);
    setTestResult(null);
    setTestAnswers({});
    setShowPart3Transcript(false);
    setShowPart4Transcript(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    try {
      const res = await fetch(`/api/lesson-practice/test/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTestData(data);
        return;
      }
      throw new Error('API error');
    } catch (err) {
      console.warn('Backend test fetch error, trying static json fallback:', err);
      try {
        const staticRes = await fetch('/lessons_practice_data.json');
        if (staticRes.ok) {
          const allData = await staticRes.json();
          const testItem = allData[String(id)]?.test;
          if (testItem) {
            setTestData(testItem);
            return;
          }
        }
      } catch (staticErr) {
        console.error('Static fallback error for test:', staticErr);
      }
      setTestData(null);
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    loadExercise(currentLessonId);
    loadTest(currentLessonId);
  }, [currentLessonId]);

  // Audio Controls
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.log('Audio play error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds));
    }
  };

  const handleRateChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatAudioTime = (sec) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Load Test History
  const loadTestHistory = async (all = historyFilterAll) => {
    setHistoryLoading(true);
    try {
      const url = all
        ? '/api/lesson-practice/test/history'
        : `/api/lesson-practice/test/${currentLessonId}/history`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử test:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadTestHistory(historyFilterAll);
  }, [currentLessonId, historyFilterAll, profile]);

  // Load Full Test Data for History Review
  const loadHistoryLessonTestData = async (lessonId) => {
    if (testData && testData.lessonId === lessonId) {
      setHistoryTestData(testData);
      return;
    }
    try {
      const res = await fetch(`/api/lesson-practice/test/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryTestData(data);
        return;
      }
    } catch (e) {
      console.warn('API test fetch error for history:', e);
    }
    try {
      const staticRes = await fetch('/lessons_practice_data.json');
      if (staticRes.ok) {
        const allData = await staticRes.json();
        const item = allData[String(lessonId)]?.test;
        if (item) setHistoryTestData(item);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (selectedHistoryItem?.lessonId) {
      loadHistoryLessonTestData(selectedHistoryItem.lessonId);
    } else {
      setHistoryTestData(null);
    }
  }, [selectedHistoryItem?.lessonId]);

  // Support restoring test from navigation state
  useEffect(() => {
    if (location.state?.restoreTestHistory && location.state.restoreTestHistory.lessonId === currentLessonId) {
      const detail = location.state.restoreTestHistory;
      setTestAnswers(detail.userAnswers || {});
      setTestResult({
        score: detail.score,
        totalQuestions: detail.totalQuestions,
        percentage: detail.percentage,
        listeningScore: detail.listeningScore,
        listeningTotal: detail.listeningTotal,
        readingScore: detail.readingScore,
        readingTotal: detail.readingTotal,
        results: detail.results || []
      });
      setActiveTab('test');
    }
  }, [location.state, currentLessonId]);

  const getQuestionFromData = (qNum, hData) => {
    if (!hData) return null;
    if (qNum === 1) return { ...hData.part1, partName: 'Part 1: Photographs', isListening: true };
    const p2 = hData.part2?.find((q) => q.questionNumber === qNum);
    if (p2) return { ...p2, partName: 'Part 2: Question-Response', isListening: true };
    const p3 = hData.part3?.find((q) => q.questionNumber === qNum);
    if (p3) return { ...p3, partName: 'Part 3: Short Conversations', isListening: true, dialogueTranscript: hData.part3[0]?.transcript };
    const p4 = hData.part4?.find((q) => q.questionNumber === qNum);
    if (p4) return { ...p4, partName: 'Part 4: Short Talks', isListening: true, talkTranscript: hData.part4[0]?.transcript };
    const p5 = hData.part5?.find((q) => q.questionNumber === qNum);
    if (p5) return { ...p5, partName: 'Part 5: Incomplete Sentences', isListening: false };
    const p6 = hData.part6?.questions?.find((q) => q.questionNumber === qNum);
    if (p6) return { ...p6, partName: 'Part 6: Text Completion', isListening: false, passage: hData.part6?.passage, passageImage: hData.part6?.passageImage };
    const p7 = hData.part7?.questions?.find((q) => q.questionNumber === qNum);
    if (p7) return { ...p7, partName: 'Part 7: Reading Comprehension', isListening: false, passage: hData.part7?.passage, passageImage: hData.part7?.passageImage };
    return null;
  };

  const handleViewHistoryDetail = async (item) => {
    if (item.results && item.userAnswers) {
      setSelectedHistoryItem(item);
      setHistoryQuestionFilter('all');
      loadHistoryLessonTestData(item.lessonId);
      return;
    }
    try {
      const res = await fetch(`/api/lesson-practice/test/history/${item.id}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedHistoryItem(detail);
        setHistoryQuestionFilter('all');
        loadHistoryLessonTestData(detail.lessonId);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết lịch sử:', err);
    }
  };

  const handleRestoreToTestView = async (item) => {
    let detail = item;
    if (!item.results || !item.userAnswers) {
      try {
        const res = await fetch(`/api/lesson-practice/test/history/${item.id}`);
        if (res.ok) {
          detail = await res.json();
        }
      } catch (err) {}
    }

    if (detail.lessonId && detail.lessonId !== currentLessonId) {
      navigate(`/lesson/${detail.lessonId}`, { state: { restoreTestHistory: detail } });
      return;
    }

    setTestAnswers(detail.userAnswers || {});
    setTestResult({
      score: detail.score,
      totalQuestions: detail.totalQuestions,
      percentage: detail.percentage,
      listeningScore: detail.listeningScore,
      listeningTotal: detail.listeningTotal,
      readingScore: detail.readingScore,
      readingTotal: detail.readingTotal,
      results: detail.results || []
    });
    setActiveTab('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistoryItem = async (historyId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi lịch sử bài thi này không?')) return;
    try {
      const res = await fetch(`/api/lesson-practice/test/history/${historyId}`, {
        method: 'DELETE'
      });
      if (res.ok || res.status === 204) {
        if (selectedHistoryItem?.id === historyId) {
          setSelectedHistoryItem(null);
        }
        loadTestHistory(historyFilterAll);
      }
    } catch (err) {
      console.error('Lỗi xóa lịch sử:', err);
    }
  };

  // Word Bank Click Handler (English words only)
  const handleWordSelect = (word) => {
    if (exerciseResult) return; // Locked after grading
    const targetIdx = selectedBlank || 1;
    setExerciseAnswers((prev) => ({
      ...prev,
      [targetIdx]: word
    }));

    // Auto-advance to next empty blank
    if (exerciseData?.blanks) {
      const nextBlank = exerciseData.blanks.find(
        (b) => b.index > targetIdx && !exerciseAnswers[b.index]
      );
      if (nextBlank) {
        setSelectedBlank(nextBlank.index);
      } else {
        const anyEmpty = exerciseData.blanks.find(
          (b) => b.index !== targetIdx && !exerciseAnswers[b.index]
        );
        if (anyEmpty) setSelectedBlank(anyEmpty.index);
      }
    }
  };

  const handleClearBlank = (index) => {
    if (exerciseResult) return;
    setExerciseAnswers((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
    setSelectedBlank(index);
  };

  // Submit Exercise
  const handleSubmitExercise = async () => {
    if (exerciseSubmitting || !exerciseData) return;
    setExerciseSubmitting(true);
    try {
      const res = await fetch(`/api/lesson-practice/exercise/${currentLessonId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswers: exerciseAnswers })
      });
      if (res.ok) {
        const data = await res.json();
        setExerciseResult(data);
        if (data.percentage >= 80) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        return;
      }
      throw new Error('API non-200');
    } catch (err) {
      console.warn('Backend exercise submit error, falling back to local grading:', err);
      if (exerciseData?.blanks) {
        let score = 0;
        const results = exerciseData.blanks.map((b) => {
          const user = (exerciseAnswers[b.index] || '').trim().toLowerCase();
          const correct = (b.answer || '').trim().toLowerCase();
          const cleanUser = user.replace(/[^a-z0-9]/g, '');
          let isCorrect = cleanUser === correct.replace(/[^a-z0-9]/g, '');
          if (currentLessonId === 7 && (b.index === 2 || b.index === 3)) {
            if (cleanUser === 'durable' || cleanUser === 'affordable') {
              isCorrect = true;
            }
          }
          if (isCorrect) score++;
          return {
            index: b.index,
            userAnswer: exerciseAnswers[b.index] || '',
            correctAnswer: b.answer,
            isCorrect
          };
        });
        const maxScore = exerciseData.blanks.length;
        const percentage = Math.round((score / maxScore) * 1000) / 10;
        setExerciseResult({ score, maxScore, percentage, results });
        if (percentage >= 80) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        alert('Không thể chấm điểm bài tập. Vui lòng thử lại!');
      }
    } finally {
      setExerciseSubmitting(false);
    }
  };

  // Submit Test
  const handleSubmitTest = async () => {
    if (testSubmitting || !testData) return;
    const answeredCount = Object.keys(testAnswers).length;
    if (answeredCount < 23) {
      const confirmSubmit = window.confirm(
        `Bạn mới trả lời ${answeredCount}/23 câu hỏi. Bạn có chắc chắn muốn nộp bài để chấm điểm ngay bây giờ không?`
      );
      if (!confirmSubmit) return;
    }

    setTestSubmitting(true);
    try {
      const res = await fetch(`/api/lesson-practice/test/${currentLessonId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: testAnswers })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
        loadTestHistory(historyFilterAll);
        if (data.percentage >= 75) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      throw new Error('API non-200');
    } catch (err) {
      console.warn('Backend test submit error, falling back to local grading:', err);
      let totalQuestions = 0;
      let score = 0;
      let listeningScore = 0;
      let listeningTotal = 0;
      let readingScore = 0;
      let readingTotal = 0;
      const results = [];

      // Part 1
      if (testData.part1) {
        totalQuestions++; listeningTotal++;
        const correct = testData.part1.correctAnswer;
        const user = testAnswers[1];
        const isOk = correct && correct.toUpperCase() === (user || '').toUpperCase();
        if (isOk) { score++; listeningScore++; }
        results.push({ questionNumber: 1, userAnswer: user, correctAnswer: correct, isCorrect: isOk });
      }
      // Part 2
      (testData.part2 || []).forEach((q) => {
        totalQuestions++; listeningTotal++;
        const correct = q.correctAnswer;
        const user = testAnswers[q.questionNumber];
        const isOk = correct && correct.toUpperCase() === (user || '').toUpperCase();
        if (isOk) { score++; listeningScore++; }
        results.push({ questionNumber: q.questionNumber, userAnswer: user, correctAnswer: correct, isCorrect: isOk });
      });
      // Part 3
      (testData.part3 || []).forEach((q) => {
        totalQuestions++; listeningTotal++;
        const correct = q.correctAnswer;
        const user = testAnswers[q.questionNumber];
        const isOk = correct && correct.toUpperCase() === (user || '').toUpperCase();
        if (isOk) { score++; listeningScore++; }
        results.push({ questionNumber: q.questionNumber, userAnswer: user, correctAnswer: correct, isCorrect: isOk });
      });
      // Part 4
      (testData.part4 || []).forEach((q) => {
        totalQuestions++; listeningTotal++;
        const correct = q.correctAnswer;
        const user = testAnswers[q.questionNumber];
        const isOk = correct && correct.toUpperCase() === (user || '').toUpperCase();
        if (isOk) { score++; listeningScore++; }
        results.push({ questionNumber: q.questionNumber, userAnswer: user, correctAnswer: correct, isCorrect: isOk });
      });
      // Part 5
      (testData.part5 || []).forEach((q) => {
        totalQuestions++; readingTotal++;
        const correct = q.correctAnswer;
        const user = testAnswers[q.questionNumber];
        const isOk = correct && correct.toUpperCase() === (user || '').toUpperCase();
        if (isOk) { score++; readingScore++; }
        results.push({ questionNumber: q.questionNumber, userAnswer: user, correctAnswer: correct, isCorrect: isOk });
      });
      // Part 6
      (testData.part6?.questions || []).forEach((q) => {
        totalQuestions++; readingTotal++;
        const correct = q.correctAnswer;
        const user = testAnswers[q.questionNumber];
        const isOk = correct && correct.toUpperCase() === (user || '').toUpperCase();
        if (isOk) { score++; readingScore++; }
        results.push({ questionNumber: q.questionNumber, userAnswer: user, correctAnswer: correct, isCorrect: isOk });
      });
      // Part 7
      (testData.part7?.questions || []).forEach((q) => {
        totalQuestions++; readingTotal++;
        const correct = q.correctAnswer;
        const user = testAnswers[q.questionNumber];
        const isOk = correct && correct.toUpperCase() === (user || '').toUpperCase();
        if (isOk) { score++; readingScore++; }
        results.push({ questionNumber: q.questionNumber, userAnswer: user, correctAnswer: correct, isCorrect: isOk });
      });

      const percentage = totalQuestions > 0 ? Math.round((score * 1000) / totalQuestions) / 10 : 0;
      setTestResult({ score, totalQuestions, percentage, listeningScore, listeningTotal, readingScore, readingTotal, results });
      if (percentage >= 75) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setTestSubmitting(false);
    }
  };

  // Helper: check if a word from the Word Bank is used
  const isWordUsed = (word) => {
    return Object.values(exerciseAnswers).some(
      (val) => val?.trim().toLowerCase() === word?.trim().toLowerCase()
    );
  };

  // Parse Passage with Interactive Blanks
  const renderPassageWithBlanks = () => {
    const passageText = exerciseData?.passage || exerciseData?.passageTemplate || '';
    if (!passageText) {
      return (
        <div className="p-6 rounded-2xl bg-purple-950/40 border border-purple-800 text-purple-300 text-center text-sm">
          Không tìm thấy đoạn văn điền từ cho Lesson {currentLessonId}.
        </div>
      );
    }

    const parts = passageText.split(/(?:\[|\()(\d+)(?:\]|\))/g);

    return (
      <div className="text-purple-100 text-base md:text-lg leading-loose font-sans select-text">
        {parts.map((segment, i) => {
          if (i % 2 === 1) {
            const blankIdx = parseInt(segment, 10);
            const val = exerciseAnswers[blankIdx] || '';
            const isSelected = selectedBlank === blankIdx;
            const resultInfo = exerciseResult?.results?.find((r) => r.index === blankIdx);

            let blankStyle = 'border-purple-500/60 bg-purple-950/70 text-purple-100 hover:border-purple-400 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/50';
            if (isSelected && !exerciseResult) {
              blankStyle = 'border-amber-400 bg-amber-400/15 text-amber-200 ring-2 ring-amber-400/50 shadow-md shadow-amber-400/20';
            }
            if (resultInfo) {
              if (resultInfo.isCorrect) {
                blankStyle = 'border-emerald-500 bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/50 font-bold';
              } else {
                blankStyle = 'border-rose-500 bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/50 font-bold';
              }
            }

            return (
              <span key={`blank-${blankIdx}`} className="inline-flex items-center my-1.5 mx-1 align-middle relative group">
                <div className={`relative inline-flex items-center rounded-xl border-2 transition-all ${blankStyle}`}>
                  <input
                    type="text"
                    id={`blank-input-${blankIdx}`}
                    value={val}
                    disabled={!!exerciseResult}
                    onFocus={() => setSelectedBlank(blankIdx)}
                    onClick={() => setSelectedBlank(blankIdx)}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      setExerciseAnswers((prev) => ({ ...prev, [blankIdx]: newVal }));
                    }}
                    placeholder={`(${blankIdx})`}
                    className="px-3 py-1.5 bg-transparent font-mono text-sm font-bold text-center outline-none min-w-[110px] max-w-[160px] text-white placeholder:text-purple-400/50"
                  />

                  {/* Clear button if has value and not graded */}
                  {!exerciseResult && val && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearBlank(blankIdx);
                      }}
                      className="mr-2 text-purple-400 hover:text-white transition cursor-pointer text-sm font-bold"
                      title="Xóa từ ô này"
                    >
                      &times;
                    </button>
                  )}

                  {/* Status icon if graded */}
                  {resultInfo && (
                    <span className="mr-2">
                      {resultInfo.isCorrect ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <XCircle size={16} className="text-rose-400" />
                      )}
                    </span>
                  )}
                </div>

                {/* Show correct answer pill if graded and incorrect */}
                {resultInfo && !resultInfo.isCorrect && (
                  <span className="ml-1 text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 select-text">
                    &rarr; {resultInfo.correctAnswer}
                  </span>
                )}
              </span>
            );
          }
          return <span key={`text-${i}`}>{segment}</span>;
        })}
      </div>
    );
  };

  // Render Part 6 Passage with interactive or highlighted blanks
  const renderPart6Passage = (
    passageText,
    customAnswers = null,
    customResults = null,
    customQuestions = null,
    containerClass = 'p-5 rounded-2xl bg-purple-950/60 border border-purple-800/50 text-purple-100 text-sm md:text-base leading-loose whitespace-pre-line font-sans shadow-inner'
  ) => {
    if (!passageText) return null;
    const parts = passageText.split(/(?:\[|\()(\d+)(?:\]|\))/g);
    if (parts.length === 1) {
      return (
        <div className={containerClass}>
          {passageText}
        </div>
      );
    }

    const answersMap = customAnswers || testAnswers;
    const resultsList = customResults || testResult?.results || [];
    const questionsList = customQuestions || testData?.part6?.questions || [];

    return (
      <div className={containerClass}>
        {parts.map((segment, i) => {
          if (i % 2 === 1) {
            const qNum = parseInt(segment, 10);
            const userAns = answersMap[qNum];
            const resultInfo = resultsList.find((r) => r.questionNumber === qNum);
            const qData = questionsList.find((q) => q.questionNumber === qNum);
            const optionsList = getOptionList(qData?.options);
            const selectedOpt = optionsList.find((o) => o.key === userAns);

            let blankClass = 'bg-amber-400/20 text-amber-300 border-amber-400/50 hover:bg-amber-400/30';
            if (userAns) {
              blankClass = 'bg-orange-500/25 text-orange-200 border-orange-400 font-bold';
            }
            if (resultInfo) {
              blankClass = resultInfo.isCorrect
                ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 font-bold'
                : 'bg-rose-500/25 text-rose-200 border-rose-400 font-bold';
            }

            return (
              <span
                key={`p6-blank-${qNum}`}
                className={`inline-flex items-center px-2.5 py-0.5 mx-1 rounded-lg border text-xs md:text-sm transition cursor-pointer select-none ${blankClass}`}
                onClick={() => {
                  const el = document.getElementById(`part6-q-${qNum}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                title={`Ô trống [${qNum}]: Bấm để cuộn tới câu hỏi`}
              >
                <span className="font-mono font-bold mr-1">[{qNum}]</span>
                {selectedOpt ? (
                  <span>({selectedOpt.key}) {selectedOpt.text}</span>
                ) : (
                  <span className="font-mono tracking-wider opacity-60">______</span>
                )}
              </span>
            );
          }
          return <span key={`p6-txt-${i}`}>{segment}</span>;
        })}
      </div>
    );
  };

  // Render Part 5 Question with distinct blank styling
  const renderPart5Question = (questionText, userAns, qNum, resultInfo, optionsList) => {
    if (!questionText) return null;
    const blankRegex = /_{2,}/g;
    if (!blankRegex.test(questionText)) {
      return questionText;
    }

    const parts = questionText.split(/_{2,}/g);
    const selectedOpt = optionsList?.find((o) => o.key === userAns);

    let blankClass = 'bg-amber-400/20 text-amber-300 border-b-2 border-amber-400';
    if (userAns) {
      blankClass = 'bg-orange-500/25 text-orange-200 border-b-2 border-orange-400 font-bold';
    }
    if (resultInfo) {
      blankClass = resultInfo.isCorrect
        ? 'bg-emerald-500/25 text-emerald-200 border-b-2 border-emerald-400 font-bold'
        : 'bg-rose-500/25 text-rose-200 border-b-2 border-rose-400 font-bold';
    }

    return (
      <span>
        {parts.map((seg, i) => (
          <React.Fragment key={`p5-seg-${i}`}>
            {seg}
            {i < parts.length - 1 && (
              <span className={`inline-block px-2.5 py-0.5 mx-1 rounded font-mono text-xs md:text-sm tracking-wider ${blankClass}`}>
                {selectedOpt ? `(${selectedOpt.key}) ${selectedOpt.text}` : '_______'}
              </span>
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#180a24] text-white flex flex-col justify-between font-['Quicksand'] select-none">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & NAVIGATION                                                   */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#250d36]/95 backdrop-blur-md border-b border-purple-800/40 shadow-xl px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold border border-purple-700/40"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Trang chủ</span>
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px] border border-amber-500/40">
                  TOEIC 600 WORDS
                </span>
                <span className="text-xs text-purple-300 font-bold hidden md:inline">
                  Deck {deckIdForLesson} (Lessons {(deckIdForLesson - 19) * 5 + 1} - {(deckIdForLesson - 19) * 5 + 5})
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                <span>{exerciseData?.title || `Lesson ${currentLessonId}`}</span>
                {exerciseData?.subtitle && (
                  <span className="text-xs font-medium text-purple-300/80 hidden sm:inline">
                    — {exerciseData.subtitle}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Right Header Area: Live Study Timer & Lesson Switcher & Profile Switcher */}
          <div className="flex items-center space-x-2.5">
            {/* Live Study Timer Badge (Hidden for DTan) */}
            {!isDTan && (
              <div
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
                  isActive 
                    ? 'bg-purple-900/60 border-purple-700/60 text-purple-200' 
                    : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400 opacity-60'
                }`}
                title={isActive ? "Đang đếm thời gian học chủ động" : "Tạm dừng đếm giờ (tab ẩn hoặc nhàn rỗi)"}
              >
                <Clock size={14} className={isActive ? "text-cyan-400 animate-pulse" : "text-zinc-500"} />
                <span className="font-mono text-xs font-bold">{formattedSessionTime}</span>
              </div>
            )}

            {/* Lesson Switcher (1 - 50) */}
            <div className="flex items-center space-x-1.5">
              <button
                disabled={currentLessonId <= 1}
                onClick={() => navigate(`/lesson/${currentLessonId - 1}`)}
                className="p-2 rounded-xl bg-purple-900/50 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition border border-purple-700/40 cursor-pointer"
                title="Lesson trước"
              >
                <ChevronLeft size={18} />
              </button>

              <select
                value={currentLessonId}
                onChange={(e) => navigate(`/lesson/${e.target.value}`)}
                className="bg-[#311145] text-purple-100 font-bold text-xs md:text-sm px-3 py-2 rounded-xl border border-purple-700/60 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num} className="bg-[#291038] text-white">
                    Lesson {num} {num <= 5 ? '★' : ''}
                  </option>
                ))}
              </select>

              <button
                disabled={currentLessonId >= 50}
                onClick={() => navigate(`/lesson/${currentLessonId + 1}`)}
                className="p-2 rounded-xl bg-purple-900/50 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition border border-purple-700/40 cursor-pointer"
                title="Lesson sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Profile Switcher */}
            <div className="ml-1">
              <ProfileSwitcher />
            </div>
          </div>
        </div>

        {/* TAB BUTTONS */}
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 md:gap-3 mt-3 pt-2 border-t border-purple-800/30">
          <button
            onClick={() => setActiveTab('exercise')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition cursor-pointer ${
              activeTab === 'exercise'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <FileText size={16} />
            <span>1. Bài tập điền từ (Words in Context)</span>
            {exerciseResult && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {exerciseResult.score}/{exerciseResult.maxScore}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition cursor-pointer ${
              activeTab === 'test'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <Headphones size={16} />
            <span>2. Bài Test TOEIC (Listening & Reading)</span>
            {testResult && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {testResult.score}/{testResult.totalQuestions}
              </span>
            )}
          </button>

          {!isDTan && (
            <button
              onClick={() => setActiveTab('dictation')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition cursor-pointer ${
                activeTab === 'dictation'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
              }`}
            >
              <Headphones size={16} />
              <span>3. 🎧 Nghe chép chính tả (Part 1 - 4)</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedHistoryItem(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/25 ring-2 ring-pink-400/40'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <History size={16} />
            <span>4. 📜 Lịch sử làm bài test</span>
            {historyList.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono font-bold">
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT CONTAINER                                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        
        {/* ======================================================================= */}
        {/* TAB 1: WORDS IN CONTEXT (ĐIỀN TỪ)                                      */}
        {/* ======================================================================= */}
        {activeTab === 'exercise' && (
          <div className="space-y-6">
            
            {/* INSTRUCTION & WORD BANK BANNER */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#2e123f] to-[#220c2f] border border-purple-700/40 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Sparkles size={14} /> Words in Context — Word Bank
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-300 border border-purple-700/40">
                      Chỉ hiển thị Tiếng Anh
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                    Chọn từ thích hợp điền vào chỗ trống
                  </h2>
                  <p className="text-xs md:text-sm text-purple-300/80">
                    Bấm vào một ô trống trong đoạn văn, sau đó click vào từ tiếng Anh trong kho từ bên dưới để điền.
                  </p>
                </div>

                {/* Clear all / Reset */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có muốn xóa toàn bộ câu trả lời để làm lại từ đầu?')) {
                        setExerciseAnswers({});
                        setExerciseResult(null);
                        setSelectedBlank(1);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-white text-xs font-bold border border-purple-800/40 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>Làm lại từ đầu</span>
                  </button>
                </div>
              </div>

              {/* WORD BANK (ONLY ENGLISH WORDS - NO VIETNAMESE) */}
              <div className="bg-[#1b0928] p-4 rounded-2xl border border-purple-800/50">
                <div className="text-xs font-bold text-purple-300 mb-2.5 flex items-center justify-between">
                  <span>Kho từ vựng của Lesson (12 từ tiếng Anh):</span>
                  <span className="text-purple-300">
                    Đang chọn: <b className="font-mono text-cyan-300 text-sm">Ô ({selectedBlank})</b>
                  </span>
                </div>

                {exerciseLoading ? (
                  <div className="py-4 text-center text-purple-400 text-sm">Đang tải kho từ vựng...</div>
                ) : exerciseData?.wordBank ? (
                  <div className="flex flex-wrap gap-2.5">
                    {exerciseData.wordBank.map((word, idx) => {
                      const used = isWordUsed(word);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleWordSelect(word)}
                          disabled={!!exerciseResult}
                          className={`px-4 py-2 rounded-xl text-sm font-bold font-mono transition-all duration-200 cursor-pointer flex items-center space-x-1.5 border shadow-sm ${
                            used
                              ? 'bg-purple-950/40 text-purple-400/50 border-purple-900/40 line-through opacity-70'
                              : 'bg-gradient-to-r from-purple-800/80 to-indigo-800/80 hover:from-amber-500 hover:to-orange-500 text-white border-purple-600/50 hover:border-amber-400 hover:scale-105 active:scale-95 shadow-purple-900/30'
                          }`}
                        >
                          <span>{word}</span>
                          {used && <Check size={13} className="text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-purple-400 text-sm">
                    Chưa có bài tập cho Lesson này. Vui lòng chọn Lesson 1 - 5.
                  </div>
                )}
              </div>
            </div>

            {/* PASSAGE CARD */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#270f36] border border-purple-700/40 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-purple-800/40 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center text-amber-400">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg">Đoạn văn hoàn chỉnh</h3>
                    <p className="text-xs text-purple-300">Đọc kỹ ngữ cảnh và điền 12 từ vào đúng vị trí</p>
                  </div>
                </div>

                <div className="text-xs font-mono text-purple-300">
                  Đã điền: <b className="text-amber-400">{Object.keys(exerciseAnswers).length}</b>/12 ô
                </div>
              </div>

              {/* RENDER PASSAGE WITH INTERACTIVE BLANKS */}
              {exerciseLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw size={28} className="animate-spin text-purple-400" />
                  <span className="text-purple-300 text-sm">Đang tải đoạn văn...</span>
                </div>
              ) : exerciseData ? (
                renderPassageWithBlanks()
              ) : null}

              {/* RESULT SUMMARY & SUBMIT BUTTON */}
              <div className="pt-6 border-t border-purple-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                {exerciseResult ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">
                      {exerciseResult.score}/{exerciseResult.maxScore}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-1.5">
                        <Award size={18} className="text-yellow-400" />
                        <span>Kết quả bài làm: {exerciseResult.percentage}% chính xác!</span>
                      </div>
                      <p className="text-xs text-purple-300 mt-0.5">
                        {exerciseResult.score === exerciseResult.maxScore
                          ? '🎉 Xuất sắc! Bạn đã điền chính xác toàn bộ 12 từ.'
                          : 'Xem các ô màu đỏ ở trên để biết đáp án đúng và làm lại.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-purple-400">
                    Hãy kiểm tra kỹ các ô trống trước khi bấm nộp bài chấm điểm.
                  </div>
                )}

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {exerciseResult ? (
                    <button
                      onClick={() => {
                        setExerciseResult(null);
                        setExerciseAnswers({});
                        setSelectedBlank(1);
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-white font-extrabold text-sm border border-purple-700/50 transition cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <RotateCcw size={16} />
                      <span>Làm lại bài này</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExercise}
                      disabled={exerciseSubmitting || !exerciseData}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-sm shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {exerciseSubmitting ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      <span>Chấm điểm bài tập</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: TOEIC PRACTICE TEST (LISTENING & READING)                       */}
        {/* ======================================================================= */}
        {activeTab === 'test' && (
          <div className="space-y-6">

            {/* AUDIO PLAYER BAR (STICKY AT TOP OF TEST) */}
            <div className="sticky top-[108px] z-30 p-4 md:p-5 rounded-3xl bg-gradient-to-r from-[#2c113d] via-[#1f0c2d] to-[#2c113d] border-2 border-cyan-500/40 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Audio Info */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                    <Headphones size={24} className={isPlaying ? 'animate-bounce' : ''} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {currentLessonId <= 25 ? 'CD 1' : 'CD 2'} TRACK {currentLessonId <= 25 ? currentLessonId : currentLessonId - 25}
                      </span>
                      <span className="text-xs text-purple-300 font-medium">Băng nghe TOEIC chuẩn</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {testData?.title || `Lesson ${currentLessonId} Practice Test`}
                    </h3>
                  </div>

                  {/* Nút bấm kế bên để mở luyện nghe chép chính tả & xem lịch sử */}
                  <button
                    onClick={() => setActiveTab('dictation')}
                    className="ml-2 hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition cursor-pointer shadow-sm shrink-0"
                    title="Luyện nghe chép chính tả Part 1-4 của đề này"
                  >
                    <Headphones size={14} />
                    <span>🎧 Nghe chép chính tả</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('history');
                      setSelectedHistoryItem(null);
                    }}
                    className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition cursor-pointer shadow-sm shrink-0"
                    title="Xem lại lịch sử các lần làm bài test TOEIC"
                  >
                    <History size={14} />
                    <span>📜 Lịch sử {historyList.length > 0 ? `(${historyList.length})` : ''}</span>
                  </button>
                </div>

                {/* Audio Controls */}
                <div className="flex-1 max-w-xl flex flex-col space-y-2">
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      onClick={() => handleSkip(-5)}
                      className="p-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-300 hover:text-white transition text-xs font-bold"
                      title="Lùi 5 giây"
                    >
                      -5s
                    </button>

                    <button
                      onClick={togglePlayAudio}
                      className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition cursor-pointer"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>

                    <button
                      onClick={() => handleSkip(5)}
                      className="p-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-300 hover:text-white transition text-xs font-bold"
                      title="Tua 5 giây"
                    >
                      +5s
                    </button>

                    {/* Speed selector */}
                    <div className="flex items-center space-x-1 bg-purple-950/70 px-2 py-1 rounded-xl border border-purple-800/40 text-xs">
                      {[0.75, 1.0, 1.25].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleRateChange(rate)}
                          className={`px-1.5 py-0.5 rounded-lg font-mono font-bold transition ${
                            playbackRate === rate
                              ? 'bg-cyan-500 text-white'
                              : 'text-purple-300 hover:text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrubber */}
                  <div className="flex items-center space-x-2.5 text-xs font-mono text-purple-300">
                    <span>{formatAudioTime(currentTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="flex-1 h-1.5 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <span>{formatAudioTime(duration)}</span>
                  </div>
                </div>

              </div>

              {/* Hidden HTML Audio element */}
              <audio
                ref={audioRef}
                src={testData?.audioUrl || (currentLessonId <= 25 ? `/audio/cd1/TRACK ${currentLessonId}.mp3` : `/audio/cd2/TRACK ${currentLessonId - 25}.mp3`)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                preload="metadata"
              />
            </div>

            {/* TEST SCORE REPORT (IF SUBMITTED) */}
            {testResult && (
              <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#2c1543] via-[#1f0d2f] to-[#2c1543] border-2 border-emerald-500/50 shadow-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-emerald-500/30">
                      {testResult.score}/{testResult.totalQuestions}
                    </div>
                    <div>
                      <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 flex items-center gap-1">
                        <Award size={16} /> Báo cáo kết quả bài kiểm tra TOEIC
                      </div>
                      <h2 className="text-2xl font-black text-white">
                        {testResult.percentage}% Điểm đạt được
                      </h2>
                      <p className="text-xs text-purple-300 mt-0.5">
                        Xem đáp án chi tiết, giải thích và transcript lời thoại bên dưới.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-950/70 p-3 rounded-2xl border border-purple-800/40 text-center min-w-[100px]">
                      <div className="text-[11px] text-purple-300 font-bold">Listening</div>
                      <div className="text-lg font-black text-cyan-400 font-mono">
                        {testResult.listeningScore}/{testResult.listeningTotal}
                      </div>
                    </div>
                    <div className="bg-purple-950/70 p-3 rounded-2xl border border-purple-800/40 text-center min-w-[100px]">
                      <div className="text-[11px] text-purple-300 font-bold">Reading</div>
                      <div className="text-lg font-black text-amber-400 font-mono">
                        {testResult.readingScore}/{testResult.readingTotal}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BANNER GỢI Ý LUYỆN NGHE CHÉP CHÍNH TẢ SAU KHI NỘP BÀI TEST */}
                <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-purple-950/80 p-4 md:p-5 rounded-2xl border-2 border-cyan-400/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                      <Headphones size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <span>Luyện Nghe Chép Chính Tả (Part 1 - 4)</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-400/30">
                          Khuyên dùng
                        </span>
                      </h4>
                      <p className="text-xs text-purple-200 mt-0.5">
                        Luyện chép từng câu audio của Part 1, 2, 3, 4 để nhớ sâu 100% transcript & phản xạ nghe!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('dictation');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center justify-center space-x-2 shrink-0 animate-pulse"
                  >
                    <Sparkles size={16} />
                    <span>Luyện Chép Chính Tả Ngay</span>
                  </button>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    onClick={() => {
                      setActiveTab('history');
                      setSelectedHistoryItem(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-700/60 hover:bg-purple-600 text-white font-extrabold text-xs border border-purple-500/50 transition cursor-pointer flex items-center space-x-2"
                  >
                    <History size={14} />
                    <span>📜 Xem lại lịch sử các lần thi ({historyList.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setTestResult(null);
                      setTestAnswers({});
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-white font-extrabold text-xs border border-purple-700/50 transition cursor-pointer flex items-center space-x-2"
                  >
                    <RotateCcw size={14} />
                    <span>Làm lại bài kiểm tra</span>
                  </button>
                </div>
              </div>
            )}

            {/* TEST LOADING / NOT FOUND */}
            {testLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RefreshCw size={36} className="animate-spin text-cyan-400" />
                <span className="text-purple-300 font-bold">Đang tải bài kiểm tra TOEIC...</span>
              </div>
            ) : !testData ? (
              <div className="p-8 text-center bg-purple-950/30 rounded-3xl border border-purple-800/40 space-y-2">
                <p className="text-white font-bold">Chưa có bài kiểm tra cho Lesson này.</p>
                <p className="text-purple-300 text-sm">Vui lòng chọn Lesson 1 - 5 để làm bài test TOEIC đầy đủ.</p>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* =============================================================== */}
                {/* SECTION 1: LISTENING COMPREHENSION (PART 1 - 4)                 */}
                {/* =============================================================== */}
                <div className="p-6 md:p-8 rounded-3xl bg-[#260f34] border border-cyan-500/30 shadow-2xl space-y-6">
                  <div className="flex items-center space-x-3 border-b border-purple-800/40 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Headphones size={22} />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase text-cyan-400 tracking-wider">
                        Phần 1: Listening Comprehension
                      </span>
                      <h3 className="text-xl font-black text-white">
                        Part 1, 2, 3, 4 (Questions 1 - 9)
                      </h3>
                    </div>
                  </div>

                  {/* PART 1: PHOTO QUESTION (QUESTION 1) */}
                  {testData.part1 && (
                    <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/30">
                            Part 1: Photographs — Question 1
                          </span>
                        </div>

                        {/* Image Switcher Toggle (Color vs Enhanced B&W) */}
                        <div className="flex items-center space-x-1.5 bg-purple-950/80 p-1 rounded-xl border border-purple-800/40 text-xs">
                          <button
                            type="button"
                            onClick={() => setUseColorImage(true)}
                            className={`px-3 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                              useColorImage
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                                : 'text-purple-300 hover:text-white'
                            }`}
                          >
                            <Sparkles size={12} className="text-yellow-300" />
                            <span>Ảnh màu chi tiết cao</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setUseColorImage(false)}
                            className={`px-3 py-1 rounded-lg font-bold transition ${
                              !useColorImage
                                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-sm'
                                : 'text-purple-300 hover:text-white'
                            }`}
                          >
                            <span>Ảnh gốc tăng nét</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-purple-300/90 italic">
                        {testData.part1.instruction || 'Look at the picture and listen to the sentences. Choose the sentence that best describes the picture.'}
                      </p>

                      {/* PHOTO DISPLAY */}
                      <div className="flex flex-col lg:flex-row items-center gap-6 pt-2">
                        <div className="relative group max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-700/60 bg-purple-950">
                          <img
                            src={useColorImage ? testData.part1.imageUrl : (testData.part1.bwImageUrl || testData.part1.imageUrl)}
                            alt="TOEIC Part 1 Photo"
                            className="w-full h-auto object-cover rounded-xl transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-[11px] font-bold text-white flex items-center space-x-1">
                            <Eye size={12} />
                            <span>{useColorImage ? 'AI Remastered Color' : 'Enhanced Original'}</span>
                          </div>
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="flex-1 w-full space-y-2.5">
                          <div className="text-sm font-bold text-purple-200">
                            Nghe đoạn băng và chọn phương án đúng nhất:
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {['A', 'B', 'C', 'D'].map((opt) => {
                              const isChecked = testAnswers[1] === opt;
                              const resultInfo = testResult?.results?.find((r) => r.questionNumber === 1);
                              let btnStyle = 'bg-purple-950/60 hover:bg-purple-900/80 border-purple-800 text-purple-200';
                              if (isChecked) {
                                btnStyle = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/40';
                              }
                              if (resultInfo) {
                                if (opt === resultInfo.correctAnswer) {
                                  btnStyle = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400';
                                } else if (isChecked && !resultInfo.isCorrect) {
                                  btnStyle = 'bg-rose-500/30 border-rose-400 text-rose-200 ring-2 ring-rose-400';
                                }
                              }

                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setTestAnswers((prev) => ({ ...prev, 1: opt }))}
                                  className={`py-3.5 px-4 rounded-2xl border-2 font-black text-base transition-all cursor-pointer flex items-center justify-center space-x-2 ${btnStyle}`}
                                >
                                  <span>({opt})</span>
                                  {resultInfo && opt === resultInfo.correctAnswer && (
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* PART 1 TRANSCRIPT REVEAL */}
                          {testResult && testData.part1.transcript && (
                            <div className="mt-3 p-3.5 rounded-xl bg-purple-950/80 border border-purple-800 text-xs space-y-1.5">
                              <div className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                                <Volume2 size={14} /> Lời thoại Audio (Part 1 Transcript):
                              </div>
                              {Object.entries(testData.part1.transcript).map(([key, text]) => (
                                <div
                                  key={key}
                                  className={`${
                                    key === testData.part1.correctAnswer
                                      ? 'text-emerald-300 font-bold'
                                      : 'text-purple-300/80'
                                  }`}
                                >
                                  <b>({key})</b> {text} {key === testData.part1.correctAnswer && '✔ (Đáp án đúng)'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PART 2: QUESTION-RESPONSE (QUESTIONS 2 & 3) */}
                  {testData.part2 && (
                    <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-black text-xs border border-indigo-500/30">
                          Part 2: Question-Response — Questions 2 &amp; 3
                        </span>
                        <span className="text-xs text-purple-400 italic">Chọn 1 trong 3 đáp án (A, B, C)</span>
                      </div>

                      <div className="space-y-4">
                        {testData.part2.map((q) => {
                          const qNum = q.questionNumber;
                          const resultInfo = testResult?.results?.find((r) => r.questionNumber === qNum);

                          return (
                            <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-white text-sm">
                                  Câu {qNum}. (Nghe câu hỏi trong đoạn băng)
                                </span>
                                {resultInfo && (
                                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                    resultInfo.isCorrect
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  }`}>
                                    {resultInfo.isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                    {resultInfo.isCorrect ? 'Đúng' : `Sai (Đáp án: ${resultInfo.correctAnswer})`}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                {['A', 'B', 'C'].map((opt) => {
                                  const isChecked = testAnswers[qNum] === opt;
                                  let btnStyle = 'bg-purple-950/60 hover:bg-purple-900 border-purple-800 text-purple-200';
                                  if (isChecked) {
                                    btnStyle = 'bg-indigo-500/20 border-indigo-400 text-indigo-200 ring-2 ring-indigo-400/40';
                                  }
                                  if (resultInfo) {
                                    if (opt === resultInfo.correctAnswer) {
                                      btnStyle = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400';
                                    } else if (isChecked && !resultInfo.isCorrect) {
                                      btnStyle = 'bg-rose-500/30 border-rose-400 text-rose-200 ring-2 ring-rose-400';
                                    }
                                  }

                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setTestAnswers((prev) => ({ ...prev, [qNum]: opt }))}
                                      className={`py-2.5 px-3 rounded-xl border-2 font-black text-sm transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${btnStyle}`}
                                    >
                                      <span>({opt})</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Part 2 Transcript */}
                              {testResult && q.transcript && (
                                <div className="mt-2 p-3 rounded-lg bg-purple-950/80 border border-purple-800 text-xs space-y-1">
                                  <div className="text-cyan-300 font-bold">
                                    Câu hỏi: <i>&ldquo;{q.spokenQuestion}&rdquo;</i>
                                  </div>
                                  {Object.entries(q.transcript).map(([key, text]) => (
                                    <div
                                      key={key}
                                      className={`${
                                        key === q.correctAnswer
                                          ? 'text-emerald-300 font-bold'
                                          : 'text-purple-300/80'
                                      }`}
                                    >
                                      <b>({key})</b> {text}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PART 3: SHORT CONVERSATIONS (QUESTIONS 4 - 6) */}
                  {testData.part3 && (
                    <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-black text-xs border border-purple-500/30">
                          Part 3: Short Conversations — Questions 4 - 6
                        </span>
                        {testData.part3[0]?.transcript && (
                          <button
                            type="button"
                            onClick={() => setShowPart3Transcript((prev) => !prev)}
                            className="px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Volume2 size={14} className="text-cyan-400" />
                            <span>{showPart3Transcript || testResult ? 'Ẩn lời thoại ▲' : 'Xem lời thoại (Transcript) ▼'}</span>
                          </button>
                        )}
                      </div>

                      {/* Part 3 Audio Transcript */}
                      {testData.part3[0]?.transcript && (showPart3Transcript || testResult) && (
                        <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-800/60 text-xs space-y-2">
                          <div className="text-cyan-400 font-bold flex items-center space-x-1.5">
                            <Headphones size={15} />
                            <span>🎧 Lời thoại đoạn hội thoại (Audioscript):</span>
                          </div>
                          <p className="text-purple-100 whitespace-pre-line leading-relaxed font-sans bg-black/20 p-3 rounded-lg border border-purple-900/40">
                            {testData.part3[0].transcript}
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        {testData.part3.map((q) => {
                          const qNum = q.questionNumber;
                          const resultInfo = testResult?.results?.find((r) => r.questionNumber === qNum);
                          const optionsList = getOptionList(q.options);

                          return (
                            <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">
                                  {qNum}. {q.question || q.questionText}
                                </span>
                                {resultInfo && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    resultInfo.isCorrect ? 'text-emerald-300 bg-emerald-500/20' : 'text-rose-300 bg-rose-500/20'
                                  }`}>
                                    {resultInfo.isCorrect ? '✔ Đúng' : `✘ Đáp án: ${resultInfo.correctAnswer}`}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {optionsList.map(({ key, text }) => {
                                  const isChecked = testAnswers[qNum] === key;
                                  let optClass = 'bg-purple-950/60 hover:bg-purple-900 border-purple-800/60 text-purple-200';
                                  if (isChecked) {
                                    optClass = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold';
                                  }
                                  if (resultInfo) {
                                    if (key === resultInfo.correctAnswer) {
                                      optClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold';
                                    } else if (isChecked && !resultInfo.isCorrect) {
                                      optClass = 'bg-rose-500/30 border-rose-400 text-rose-200';
                                    }
                                  }

                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => setTestAnswers((prev) => ({ ...prev, [qNum]: key }))}
                                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2 ${optClass}`}
                                    >
                                      <span className="font-mono font-bold">({key})</span>
                                      <span>{text}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Part 3 AI Explanation & Translation */}
                              {testResult && (resultInfo?.explanation || q.explanation) && (
                                <div className="mt-3 p-3.5 rounded-xl bg-purple-900/40 border border-purple-500/30 text-xs space-y-2">
                                  <div className="text-cyan-300 font-bold flex items-center space-x-1.5">
                                    <span>💡 Giải thích chi tiết (AI):</span>
                                  </div>
                                  <p className="text-purple-100 leading-relaxed pl-1">
                                    {resultInfo?.explanation || q.explanation}
                                  </p>
                                  {(resultInfo?.translation || q.translation) && (
                                    <div className="pt-2 border-t border-purple-700/30 text-purple-300 pl-1">
                                      <span className="font-semibold text-cyan-400">🌐 Dịch câu hỏi: </span>
                                      <span>{resultInfo?.translation || q.translation}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PART 4: SHORT TALKS (QUESTIONS 7 - 9) */}
                  {testData.part4 && (
                    <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-black text-xs border border-purple-500/30">
                          Part 4: Short Talks — Questions 7 - 9
                        </span>
                        {testData.part4[0]?.transcript && (
                          <button
                            type="button"
                            onClick={() => setShowPart4Transcript((prev) => !prev)}
                            className="px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Volume2 size={14} className="text-cyan-400" />
                            <span>{showPart4Transcript || testResult ? 'Ẩn lời thoại ▲' : 'Xem lời thoại (Transcript) ▼'}</span>
                          </button>
                        )}
                      </div>

                      {/* Part 4 Audio Transcript */}
                      {testData.part4[0]?.transcript && (showPart4Transcript || testResult) && (
                        <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-800/60 text-xs space-y-2">
                          <div className="text-cyan-400 font-bold flex items-center space-x-1.5">
                            <Headphones size={15} />
                            <span>🎧 Lời thoại bài nói (Audioscript):</span>
                          </div>
                          <p className="text-purple-100 whitespace-pre-line leading-relaxed font-sans bg-black/20 p-3 rounded-lg border border-purple-900/40">
                            {testData.part4[0].transcript}
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        {testData.part4.map((q) => {
                          const qNum = q.questionNumber;
                          const resultInfo = testResult?.results?.find((r) => r.questionNumber === qNum);
                          const optionsList = getOptionList(q.options);

                          return (
                            <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">
                                  {qNum}. {q.question || q.questionText}
                                </span>
                                {resultInfo && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    resultInfo.isCorrect ? 'text-emerald-300 bg-emerald-500/20' : 'text-rose-300 bg-rose-500/20'
                                  }`}>
                                    {resultInfo.isCorrect ? '✔ Đúng' : `✘ Đáp án: ${resultInfo.correctAnswer}`}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {optionsList.map(({ key, text }) => {
                                  const isChecked = testAnswers[qNum] === key;
                                  let optClass = 'bg-purple-950/60 hover:bg-purple-900 border-purple-800/60 text-purple-200';
                                  if (isChecked) {
                                    optClass = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold';
                                  }
                                  if (resultInfo) {
                                    if (key === resultInfo.correctAnswer) {
                                      optClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold';
                                    } else if (isChecked && !resultInfo.isCorrect) {
                                      optClass = 'bg-rose-500/30 border-rose-400 text-rose-200';
                                    }
                                  }

                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => setTestAnswers((prev) => ({ ...prev, [qNum]: key }))}
                                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2 ${optClass}`}
                                    >
                                      <span className="font-mono font-bold">({key})</span>
                                      <span>{text}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Part 4 AI Explanation & Translation */}
                              {testResult && (resultInfo?.explanation || q.explanation) && (
                                <div className="mt-3 p-3.5 rounded-xl bg-purple-900/40 border border-purple-500/30 text-xs space-y-2">
                                  <div className="text-cyan-300 font-bold flex items-center space-x-1.5">
                                    <span>💡 Giải thích chi tiết (AI):</span>
                                  </div>
                                  <p className="text-purple-100 leading-relaxed pl-1">
                                    {resultInfo?.explanation || q.explanation}
                                  </p>
                                  {(resultInfo?.translation || q.translation) && (
                                    <div className="pt-2 border-t border-purple-700/30 text-purple-300 pl-1">
                                      <span className="font-semibold text-cyan-400">🌐 Dịch câu hỏi: </span>
                                      <span>{resultInfo?.translation || q.translation}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* =============================================================== */}
                {/* SECTION 2: READING COMPREHENSION (PART 5, 6, 7)                 */}
                {/* =============================================================== */}
                <div className="p-6 md:p-8 rounded-3xl bg-[#260f34] border border-amber-500/30 shadow-2xl space-y-6">
                  <div className="flex items-center space-x-3 border-b border-purple-800/40 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                        Phần 2: Reading Comprehension
                      </span>
                      <h3 className="text-xl font-black text-white">
                        Part 5, 6, 7 (Questions 10 - 23)
                      </h3>
                    </div>
                  </div>

                  {/* PART 5: INCOMPLETE SENTENCES (QUESTIONS 10 - 15) */}
                  {testData.part5 && (
                    <div className="space-y-4">
                      <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30">
                        Part 5: Incomplete Sentences — Questions 10 - 15
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testData.part5.map((q) => {
                          const qNum = q.questionNumber;
                          const resultInfo = testResult?.results?.find((r) => r.questionNumber === qNum);
                          const optionsList = getOptionList(q.options);

                          return (
                            <div key={qNum} className="p-4 rounded-2xl bg-[#1d0a27] border border-purple-800/40 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-amber-400 text-xs">
                                  Câu {qNum}
                                </span>
                                {resultInfo && (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    resultInfo.isCorrect ? 'text-emerald-300 bg-emerald-500/20' : 'text-rose-300 bg-rose-500/20'
                                  }`}>
                                    {resultInfo.isCorrect ? '✔ Đúng' : `✘ Đáp án: ${resultInfo.correctAnswer}`}
                                  </span>
                                )}
                              </div>

                              <p className="text-sm font-medium text-purple-100 leading-relaxed">
                                {renderPart5Question(q.question || q.questionText, testAnswers[qNum], qNum, resultInfo, optionsList)}
                              </p>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {optionsList.map(({ key, text }) => {
                                  const isChecked = testAnswers[qNum] === key;
                                  let optClass = 'bg-purple-950/60 hover:bg-purple-900 border-purple-800/60 text-purple-200';
                                  if (isChecked) {
                                    optClass = 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold';
                                  }
                                  if (resultInfo) {
                                    if (key === resultInfo.correctAnswer) {
                                      optClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold';
                                    } else if (isChecked && !resultInfo.isCorrect) {
                                      optClass = 'bg-rose-500/30 border-rose-400 text-rose-200';
                                    }
                                  }

                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => setTestAnswers((prev) => ({ ...prev, [qNum]: key }))}
                                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center space-x-1.5 ${optClass}`}
                                    >
                                      <span className="font-mono font-bold">({key})</span>
                                      <span>{text}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Part 5 AI Explanation & Translation */}
                              {testResult && (resultInfo?.explanation || q.explanation) && (
                                <div className="mt-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-2">
                                  <div className="text-amber-300 font-bold flex items-center space-x-1.5">
                                    <span>💡 Giải thích chi tiết (AI):</span>
                                  </div>
                                  <p className="text-purple-200 leading-relaxed pl-1">
                                    {resultInfo?.explanation || q.explanation}
                                  </p>
                                  {(resultInfo?.translation || q.translation) && (
                                    <div className="pt-2 border-t border-amber-500/20 text-purple-300/90 pl-1">
                                      <span className="font-semibold text-amber-400/90">🌐 Dịch nghĩa: </span>
                                      <span>{resultInfo?.translation || q.translation}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PART 6: TEXT COMPLETION (QUESTIONS 16 - 18) */}
                  {testData.part6 && (
                    <div className="p-5 md:p-6 rounded-2xl bg-[#1d0a27] border border-purple-800/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-300 font-black text-xs border border-orange-500/30">
                          Part 6: Text Completion — Questions 16 - 18
                        </span>
                        {testData.part6.title && (
                          <span className="text-xs text-purple-300 font-medium hidden sm:inline">
                            {testData.part6.title}
                          </span>
                        )}
                      </div>

                      {testData.part6.passageImage ? (
                        <div className="rounded-2xl overflow-hidden border border-purple-800/50 bg-white shadow-xl flex justify-center p-3 md:p-5">
                          <img
                            src={testData.part6.passageImage}
                            alt="Part 6 Reading Passage"
                            className="max-w-full h-auto object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        testData.part6.passage && renderPart6Passage(testData.part6.passage)
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {testData.part6.questions?.map((q) => {
                          const qNum = q.questionNumber;
                          const resultInfo = testResult?.results?.find((r) => r.questionNumber === qNum);
                          const optionsList = getOptionList(q.options);

                          return (
                            <div key={qNum} id={`part6-q-${qNum}`} className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-300 text-xs">
                                  Ô trống [{qNum}]
                                </span>
                                {resultInfo && (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    resultInfo.isCorrect ? 'text-emerald-300 bg-emerald-500/20' : 'text-rose-300 bg-rose-500/20'
                                  }`}>
                                    {resultInfo.isCorrect ? '✔ Đúng' : `✘ ${resultInfo.correctAnswer}`}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 gap-1.5 text-xs">
                                {optionsList.map(({ key, text }) => {
                                  const isChecked = testAnswers[qNum] === key;
                                  let optClass = 'bg-purple-950/60 hover:bg-purple-900 border-purple-800/60 text-purple-200';
                                  if (isChecked) {
                                    optClass = 'bg-orange-500/20 border-orange-400 text-orange-200 font-bold';
                                  }
                                  if (resultInfo) {
                                    if (key === resultInfo.correctAnswer) {
                                      optClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold';
                                    } else if (isChecked && !resultInfo.isCorrect) {
                                      optClass = 'bg-rose-500/30 border-rose-400 text-rose-200';
                                    }
                                  }

                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => setTestAnswers((prev) => ({ ...prev, [qNum]: key }))}
                                      className={`p-2 rounded-lg border text-left transition cursor-pointer flex items-center space-x-1.5 ${optClass}`}
                                    >
                                      <span className="font-mono font-bold">({key})</span>
                                      <span>{text}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Part 6 AI Explanation & Translation */}
                              {testResult && (resultInfo?.explanation || q.explanation) && (
                                <div className="mt-2.5 p-3 rounded-lg bg-orange-950/40 border border-orange-500/30 text-xs space-y-1.5">
                                  <div className="text-orange-300 font-bold flex items-center space-x-1">
                                    <span>💡 Giải thích chi tiết (AI):</span>
                                  </div>
                                  <p className="text-purple-200 leading-relaxed">
                                    {resultInfo?.explanation || q.explanation}
                                  </p>
                                  {(resultInfo?.translation || q.translation) && (
                                    <div className="pt-1.5 border-t border-orange-500/20 text-purple-300/90">
                                      <span className="font-semibold text-orange-400/90">🌐 Dịch: </span>
                                      <span>{resultInfo?.translation || q.translation}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PART 7: READING COMPREHENSION (QUESTIONS 19 - 23) */}
                  {testData.part7 && (
                    <div className="p-5 md:p-6 rounded-2xl bg-[#1d0a27] border border-purple-800/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/30">
                          Part 7: Reading Comprehension — Questions 19 - 23
                        </span>
                        {testData.part7.title && (
                          <span className="text-xs text-purple-300 font-medium hidden sm:inline">
                            {testData.part7.title}
                          </span>
                        )}
                      </div>

                      {testData.part7.passageImage ? (
                        <div className="rounded-2xl overflow-hidden border border-purple-800/50 bg-white shadow-xl flex justify-center p-3 md:p-5">
                          <img
                            src={testData.part7.passageImage}
                            alt="Part 7 Reading Passage"
                            className="max-w-full h-auto object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        testData.part7.passage && (
                          <div className="p-5 rounded-2xl bg-purple-950/60 border border-purple-800/50 text-purple-100 text-sm md:text-base leading-relaxed whitespace-pre-line font-sans border-l-4 border-l-rose-500 shadow-inner">
                            {testData.part7.passage}
                          </div>
                        )
                      )}

                      <div className="space-y-4 pt-2">
                        {testData.part7.questions?.map((q) => {
                          const qNum = q.questionNumber;
                          const resultInfo = testResult?.results?.find((r) => r.questionNumber === qNum);
                          const optionsList = getOptionList(q.options);

                          return (
                            <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm">
                                  {qNum}. {q.question || q.questionText}
                                </span>
                                {resultInfo && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    resultInfo.isCorrect ? 'text-emerald-300 bg-emerald-500/20' : 'text-rose-300 bg-rose-500/20'
                                  }`}>
                                    {resultInfo.isCorrect ? '✔ Đúng' : `✘ Đáp án: ${resultInfo.correctAnswer}`}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {optionsList.map(({ key, text }) => {
                                  const isChecked = testAnswers[qNum] === key;
                                  let optClass = 'bg-purple-950/60 hover:bg-purple-900 border-purple-800/60 text-purple-200';
                                  if (isChecked) {
                                    optClass = 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold';
                                  }
                                  if (resultInfo) {
                                    if (key === resultInfo.correctAnswer) {
                                      optClass = 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold';
                                    } else if (isChecked && !resultInfo.isCorrect) {
                                      optClass = 'bg-rose-500/30 border-rose-400 text-rose-200';
                                    }
                                  }

                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => setTestAnswers((prev) => ({ ...prev, [qNum]: key }))}
                                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2 ${optClass}`}
                                    >
                                      <span className="font-mono font-bold">({key})</span>
                                      <span>{text}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Part 7 AI Explanation & Translation */}
                              {testResult && (resultInfo?.explanation || q.explanation) && (
                                <div className="mt-3 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2">
                                  <div className="text-rose-300 font-bold flex items-center space-x-1.5">
                                    <span>💡 Giải thích chi tiết (AI):</span>
                                  </div>
                                  <p className="text-purple-200 leading-relaxed pl-1">
                                    {resultInfo?.explanation || q.explanation}
                                  </p>
                                  {(resultInfo?.translation || q.translation) && (
                                    <div className="pt-2 border-t border-rose-500/20 text-purple-300/90 pl-1">
                                      <span className="font-semibold text-rose-400/90">🌐 Dịch nghĩa: </span>
                                      <span>{resultInfo?.translation || q.translation}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* BOTTOM SUBMIT BUTTON FOR TEST */}
                <div className="p-6 rounded-3xl bg-[#260f34] border border-purple-700/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="font-black text-white text-base">
                      Hoàn thành bài kiểm tra TOEIC Lesson {currentLessonId}
                    </div>
                    <div className="text-xs text-purple-300">
                      Đã trả lời: <b className="text-cyan-400 font-mono text-sm">{Object.keys(testAnswers).length}</b>/23 câu hỏi
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    {testResult ? (
                      <button
                        onClick={() => {
                          setTestResult(null);
                          setTestAnswers({});
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800 text-white font-extrabold text-sm border border-purple-700/50 transition cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <RotateCcw size={16} />
                        <span>Làm lại bài test</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitTest}
                        disabled={testSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center space-x-2.5 disabled:opacity-50"
                      >
                        {testSubmitting ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        <span>Nộp bài &amp; Chấm điểm Test</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: TOEIC DICTATION PRACTICE (PART 1 - 4)                          */}
        {/* ======================================================================= */}
        {activeTab === 'dictation' && (
          <DictationPractice
            testData={testData}
            lessonId={currentLessonId}
            onBackToTest={() => setActiveTab('test')}
          />
        )}

        {/* ======================================================================= */}
        {/* TAB 4: TOEIC TEST HISTORY & REVIEW                                      */}
        {/* ======================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fadeIn pb-16">
            
            {/* Top Toolbar / Filter Header */}
            <div className="bg-[#240b36]/90 border border-purple-800/60 p-5 md:p-6 rounded-3xl shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                    <History size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                      <span>Lịch Sử Làm Bài Test TOEIC</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        {historyList.length} lượt thi
                      </span>
                    </h2>
                    <p className="text-xs text-purple-300/80">
                      Theo dõi tiến độ, xem lại đáp án chi tiết và ôn tập các câu làm sai.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="bg-purple-950/80 p-1 rounded-2xl border border-purple-800/60 flex items-center space-x-1 text-xs font-bold">
                  <button
                    onClick={() => {
                      setHistoryFilterAll(false);
                      setSelectedHistoryItem(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                      !historyFilterAll
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
                    }`}
                  >
                    <span>Chỉ Lesson {currentLessonId}</span>
                  </button>
                  <button
                    onClick={() => {
                      setHistoryFilterAll(true);
                      setSelectedHistoryItem(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                      historyFilterAll
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'text-purple-300 hover:text-white hover:bg-purple-900/50'
                    }`}
                  >
                    <span>Tất cả các Lesson</span>
                  </button>
                </div>

                <button
                  onClick={() => loadTestHistory(historyFilterAll)}
                  disabled={historyLoading}
                  className="p-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-700/50 transition cursor-pointer disabled:opacity-50"
                  title="Tải lại danh sách"
                >
                  <RefreshCw size={16} className={historyLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* VIEW A: DETAIL OF A SPECIFIC TEST RUN */}
            {selectedHistoryItem ? (
              <div className="space-y-6 animate-fadeIn">
                {(() => {
                  const currentHData = historyTestData || (testData?.lessonId === selectedHistoryItem.lessonId ? testData : null);
                  const resultsList = selectedHistoryItem.results || [];

                  const getResultForQ = (num) => resultsList.find((r) => r.questionNumber === num);

                  return (
                    <>
                      {/* Detail Header & Summary Card */}
                      <div className="bg-gradient-to-br from-[#2a0e3f] via-[#1e0a2d] to-[#180724] border-2 border-purple-700/60 p-5 md:p-7 rounded-3xl shadow-2xl space-y-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-purple-800/50">
                          <button
                            onClick={() => setSelectedHistoryItem(null)}
                            className="px-4 py-2 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-purple-200 hover:text-white text-xs md:text-sm font-bold border border-purple-700/60 transition cursor-pointer flex items-center space-x-2"
                          >
                            <ArrowLeft size={16} />
                            <span>Quay lại danh sách lịch sử</span>
                          </button>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleRestoreToTestView(selectedHistoryItem)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs md:text-sm shadow-lg shadow-cyan-600/30 transition cursor-pointer flex items-center space-x-2"
                              title="Mở đề thi với đáp án lần này để cuộn xem tương tác trên đề gốc"
                            >
                              <Eye size={16} />
                              <span>Nạp vào bài thi chính</span>
                            </button>

                            <button
                              onClick={(e) => handleDeleteHistoryItem(selectedHistoryItem.id, e)}
                              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-rose-100 border border-rose-800/60 transition cursor-pointer text-xs"
                              title="Xóa bài thi này khỏi lịch sử"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Score & Lesson Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="md:col-span-2 space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs uppercase font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Lesson {selectedHistoryItem.lessonId}
                              </span>
                              <span className="text-xs text-purple-300/80 flex items-center space-x-1">
                                <Calendar size={13} />
                                <span>{formatDateTime(selectedHistoryItem.createdAt)}</span>
                              </span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white">
                              {selectedHistoryItem.lessonTitle || `Lesson ${selectedHistoryItem.lessonId} Practice Test`}
                            </h3>
                            <p className="text-xs text-purple-300">
                              {selectedHistoryItem.score >= 18
                                ? '🏆 Xuất sắc! Bạn nắm rất vững từ vựng bài này.'
                                : selectedHistoryItem.score >= 12
                                ? '👏 Khá tốt! Đọc kỹ transcript và lời giải thích bên dưới để ôn tập.'
                                : '💪 Cần xem kỹ toàn bộ transcript phần nghe và giải thích để khắc phục điểm yếu!'}
                            </p>
                          </div>

                          {/* Total Score */}
                          <div className={`p-4 rounded-2xl border text-center ${
                            (selectedHistoryItem.percentage || 0) >= 80
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                              : (selectedHistoryItem.percentage || 0) >= 60
                              ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                              : 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                          }`}>
                            <span className="text-[11px] font-black uppercase tracking-wider block opacity-80">Tổng Điểm</span>
                            <div className="text-2xl md:text-3xl font-black mt-0.5">
                              {selectedHistoryItem.score} <span className="text-sm font-semibold opacity-70">/ {selectedHistoryItem.totalQuestions || 23}</span>
                            </div>
                            <span className="text-xs font-bold font-mono">
                              {(selectedHistoryItem.percentage || ((selectedHistoryItem.score / (selectedHistoryItem.totalQuestions || 23)) * 100)).toFixed(1)}%
                            </span>
                          </div>

                          {/* Section Breakdown */}
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-800/60 flex items-center justify-between text-xs">
                              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                                <Headphones size={13} /> Listening (P1-4)
                              </span>
                              <span className="font-mono font-black text-white">
                                {selectedHistoryItem.listeningScore ?? '-'} / {selectedHistoryItem.listeningTotal || 13}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-800/60 flex items-center justify-between text-xs">
                              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                                <BookOpen size={13} /> Reading (P5-7)
                              </span>
                              <span className="font-mono font-black text-white">
                                {selectedHistoryItem.readingScore ?? '-'} / {selectedHistoryItem.readingTotal || 10}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mode Switcher & Filters */}
                        <div className="pt-3 border-t border-purple-800/40 flex flex-wrap items-center justify-between gap-3">
                          {/* View Mode Toggle */}
                          <div className="flex items-center space-x-1.5 bg-purple-950/90 p-1 rounded-2xl border border-purple-800/60 text-xs font-bold">
                            <button
                              onClick={() => setHistoryViewMode('full')}
                              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                                historyViewMode === 'full'
                                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                                  : 'text-purple-300 hover:text-white'
                              }`}
                            >
                              <BookOpen size={14} />
                              <span>📑 Cấu trúc Đề thi & Toàn bộ Transcript</span>
                            </button>
                            <button
                              onClick={() => setHistoryViewMode('list')}
                              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                                historyViewMode === 'list'
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                  : 'text-purple-300 hover:text-white'
                              }`}
                            >
                              <ListFilter size={14} />
                              <span>📋 Lọc theo từng câu hỏi</span>
                            </button>
                          </div>

                          {/* Question Filter Pills */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { key: 'all', label: 'Tất cả', count: resultsList.length || 23 },
                              { key: 'wrong', label: '❌ Làm sai', count: resultsList.filter(r => !r.isCorrect).length || 0 },
                              { key: 'correct', label: '✅ Làm đúng', count: resultsList.filter(r => r.isCorrect).length || 0 },
                              { key: 'listening', label: '🎧 Listening (P1-4)', count: resultsList.filter(r => r.questionNumber <= 13).length || 13 },
                              { key: 'reading', label: '📖 Reading (P5-7)', count: resultsList.filter(r => r.questionNumber >= 14).length || 10 },
                            ].map(f => (
                              <button
                                key={f.key}
                                onClick={() => setHistoryQuestionFilter(f.key)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 border ${
                                  historyQuestionFilter === f.key
                                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                                    : 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-800/60'
                                }`}
                              >
                                <span>{f.label}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono font-black">
                                  {f.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ================================================================= */}
                      {/* VIEW MODE 1: FULL TOEIC TEST PAPER WITH COMPLETE TRANSCRIPTS      */}
                      {/* ================================================================= */}
                      {historyViewMode === 'full' ? (
                        <div className="space-y-8 animate-fadeIn">
                          
                          {/* ------------------------------------------------------------- */}
                          {/* SECTION 1: LISTENING COMPREHENSION (PART 1 - 4)               */}
                          {/* ------------------------------------------------------------- */}
                          {(historyQuestionFilter === 'all' || historyQuestionFilter === 'listening' || historyQuestionFilter === 'wrong' || historyQuestionFilter === 'correct') && (
                            <div className="p-6 md:p-8 rounded-3xl bg-[#260f34] border border-cyan-500/30 shadow-2xl space-y-6">
                              <div className="flex items-center space-x-3 border-b border-purple-800/40 pb-4">
                                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                  <Headphones size={22} />
                                </div>
                                <div>
                                  <span className="text-[11px] font-black uppercase text-cyan-400 tracking-wider">
                                    Phần 1: Listening Comprehension
                                  </span>
                                  <h3 className="text-xl font-black text-white">
                                    Part 1, 2, 3, 4 (Questions 1 - 9) &bull; Toàn bộ Băng nghe &amp; Transcript
                                  </h3>
                                </div>
                              </div>

                              {/* PART 1: PHOTOGRAPHS (QUESTION 1) */}
                              {(() => {
                                const qRes = getResultForQ(1);
                                if (!qRes && historyQuestionFilter === 'wrong') return null;
                                if (historyQuestionFilter === 'wrong' && qRes?.isCorrect) return null;
                                if (historyQuestionFilter === 'correct' && !qRes?.isCorrect) return null;

                                const part1Data = currentHData?.part1;
                                const userAns = qRes?.userAnswer || selectedHistoryItem.userAnswers?.[1];
                                const isCorrect = qRes ? qRes.isCorrect : userAns === part1Data?.correctAnswer;
                                const correctAns = qRes?.correctAnswer || part1Data?.correctAnswer || 'B';

                                return (
                                  <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/30">
                                          Part 1: Photographs — Question 1
                                        </span>
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                          isCorrect
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                        }`}>
                                          {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                          <span>{isCorrect ? 'Đúng (+1)' : `Sai — Bạn chọn: ${userAns || '(Trống)'} / Đáp án: ${correctAns}`}</span>
                                        </span>
                                      </div>

                                      {/* Image Switcher Toggle */}
                                      {part1Data && (
                                        <div className="flex items-center space-x-1.5 bg-purple-950/80 p-1 rounded-xl border border-purple-800/40 text-xs">
                                          <button
                                            type="button"
                                            onClick={() => setHistoryUseColorImage(true)}
                                            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                                              historyUseColorImage
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                                                : 'text-purple-300 hover:text-white'
                                            }`}
                                          >
                                            <Sparkles size={12} className="text-yellow-300" />
                                            <span>Ảnh màu AI</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setHistoryUseColorImage(false)}
                                            className={`px-2.5 py-1 rounded-lg font-bold transition ${
                                              !historyUseColorImage
                                                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-sm'
                                                : 'text-purple-300 hover:text-white'
                                            }`}
                                          >
                                            <span>Ảnh gốc</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <p className="text-xs text-purple-300/90 italic">
                                      {part1Data?.instruction || 'Look at the picture and listen to the sentences. Choose the sentence that best describes the picture.'}
                                    </p>

                                    <div className="flex flex-col lg:flex-row items-center gap-6 pt-2">
                                      {/* PHOTO DISPLAY */}
                                      {(part1Data?.imageUrl || qRes?.imageUrl) && (
                                        <div className="relative group max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-700/60 bg-purple-950 shrink-0">
                                          <img
                                            src={historyUseColorImage ? (part1Data?.imageUrl || qRes?.imageUrl) : (part1Data?.bwImageUrl || part1Data?.imageUrl || qRes?.imageUrl)}
                                            alt="TOEIC Part 1 Photo"
                                            className="w-full h-auto object-cover rounded-xl"
                                          />
                                        </div>
                                      )}

                                      {/* PART 1 TRANSCRIPT REVEAL (TOÀN BỘ 4 CÂU) */}
                                      <div className="flex-1 w-full space-y-3">
                                        <div className="p-4 rounded-xl bg-purple-950/80 border border-purple-800 text-xs space-y-2">
                                          <div className="font-extrabold text-cyan-300 flex items-center gap-1.5 text-sm">
                                            <Volume2 size={16} /> Toàn bộ Lời thoại Audio (Part 1 Transcript):
                                          </div>

                                          {part1Data?.transcript ? (
                                            Object.entries(part1Data.transcript).map(([key, text]) => {
                                              const isUser = userAns === key;
                                              const isRight = correctAns === key;
                                              return (
                                                <div
                                                  key={key}
                                                  className={`p-2.5 rounded-lg border transition ${
                                                    isRight
                                                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                                      : isUser
                                                      ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold'
                                                      : 'bg-purple-900/20 border-purple-800/40 text-purple-300/90'
                                                  }`}
                                                >
                                                  <span className="font-mono font-black mr-1.5">({key})</span>
                                                  <span>{text}</span>
                                                  {isRight && <span className="ml-2 text-emerald-400 font-black">✔ (Đáp án đúng)</span>}
                                                  {isUser && !isRight && <span className="ml-2 text-rose-400 font-black">✖ (Bạn đã chọn câu này)</span>}
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <p className="whitespace-pre-line text-purple-200">{qRes?.transcript || qRes?.explanation}</p>
                                          )}
                                        </div>

                                        {qRes?.explanation && (
                                          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs text-purple-200">
                                            <span className="font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                                              <Sparkles size={13} /> Giải thích:
                                            </span>
                                            <p>{qRes.explanation}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* PART 2: QUESTION-RESPONSE (QUESTIONS 2 & 3) */}
                              <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-5">
                                <div className="flex items-center justify-between">
                                  <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-black text-xs border border-indigo-500/30">
                                    Part 2: Question-Response — Questions 2 &amp; 3
                                  </span>
                                  <span className="text-xs text-purple-400 italic">Chọn 1 trong 3 đáp án (A, B, C)</span>
                                </div>

                                <div className="space-y-4">
                                  {[2, 3].map((qNum) => {
                                    const qRes = getResultForQ(qNum);
                                    if (!qRes && historyQuestionFilter === 'wrong') return null;
                                    if (historyQuestionFilter === 'wrong' && qRes?.isCorrect) return null;
                                    if (historyQuestionFilter === 'correct' && !qRes?.isCorrect) return null;

                                    const qData = currentHData?.part2?.find((q) => q.questionNumber === qNum);
                                    const userAns = qRes?.userAnswer || selectedHistoryItem.userAnswers?.[qNum];
                                    const correctAns = qRes?.correctAnswer || qData?.correctAnswer || 'A';
                                    const isCorrect = qRes ? qRes.isCorrect : userAns === correctAns;

                                    return (
                                      <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <span className="font-mono font-bold text-white text-sm">
                                            Câu {qNum}. Câu hỏi: &ldquo;{qData?.spokenQuestion || qRes?.questionText}&rdquo;
                                          </span>
                                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            isCorrect
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                          }`}>
                                            {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            <span>{isCorrect ? 'Đúng (+1)' : `Sai — Bạn chọn: ${userAns || '(Trống)'} / Đáp án: ${correctAns}`}</span>
                                          </span>
                                        </div>

                                        {/* Part 2 Full Transcripts */}
                                        <div className="p-3.5 rounded-xl bg-purple-950/80 border border-purple-800 text-xs space-y-1.5">
                                          <div className="text-cyan-300 font-bold flex items-center gap-1 mb-1">
                                            <Volume2 size={14} /> Toàn bộ Lời thoại Audio (Part 2 Transcript):
                                          </div>
                                          {qData?.transcript ? (
                                            Object.entries(qData.transcript).map(([key, text]) => {
                                              const isUser = userAns === key;
                                              const isRight = correctAns === key;
                                              return (
                                                <div
                                                  key={key}
                                                  className={`p-2 rounded-lg border ${
                                                    isRight
                                                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 font-bold'
                                                      : isUser
                                                      ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 font-bold'
                                                      : 'bg-purple-900/20 border-purple-800/30 text-purple-300/80'
                                                  }`}
                                                >
                                                  <b>({key})</b> {text}
                                                  {isRight && <span className="ml-2 text-emerald-400 font-black">✔ (Đáp án đúng)</span>}
                                                  {isUser && !isRight && <span className="ml-2 text-rose-400 font-black">✖ (Bạn chọn)</span>}
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <p className="whitespace-pre-line text-purple-200">{qRes?.transcript || qRes?.explanation}</p>
                                          )}
                                        </div>

                                        {qRes?.explanation && (
                                          <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-800/40 text-xs text-purple-200">
                                            <span className="font-bold text-amber-300">💡 Giải thích: </span>
                                            <span>{qRes.explanation}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* PART 3: SHORT CONVERSATIONS (QUESTIONS 4 - 6) */}
                              <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-black text-xs border border-purple-500/30">
                                    Part 3: Short Conversations — Questions 4 - 6
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setHistoryShowPart3Transcript(prev => !prev)}
                                    className="px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition flex items-center space-x-1.5 cursor-pointer"
                                  >
                                    <Volume2 size={14} className="text-cyan-400" />
                                    <span>{historyShowPart3Transcript ? 'Ẩn lời thoại hội thoại ▲' : 'Xem toàn bộ lời thoại (Transcript) ▼'}</span>
                                  </button>
                                </div>

                                {/* Part 3 TOÀN BỘ TRANSCRIPT ĐOẠN HỘI THOẠI */}
                                {historyShowPart3Transcript && (
                                  <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-800/60 text-xs space-y-2">
                                    <div className="text-cyan-400 font-bold flex items-center space-x-1.5 text-sm">
                                      <Volume2 size={16} />
                                      <span>Toàn bộ Lời thoại Đoạn hội thoại (Part 3 Full Conversation Transcript):</span>
                                    </div>
                                    <div className="text-purple-200 whitespace-pre-line leading-relaxed font-sans bg-[#13061c] p-3.5 rounded-lg border border-purple-800/40">
                                      {currentHData?.part3?.[0]?.transcript || getResultForQ(4)?.transcript || 'Đang tải transcript hội thoại...'}
                                    </div>
                                  </div>
                                )}

                                {/* Questions 4, 5, 6 */}
                                <div className="space-y-4">
                                  {[4, 5, 6].map((qNum) => {
                                    const qRes = getResultForQ(qNum);
                                    if (!qRes && historyQuestionFilter === 'wrong') return null;
                                    if (historyQuestionFilter === 'wrong' && qRes?.isCorrect) return null;
                                    if (historyQuestionFilter === 'correct' && !qRes?.isCorrect) return null;

                                    const qData = currentHData?.part3?.find((q) => q.questionNumber === qNum);
                                    const userAns = qRes?.userAnswer || selectedHistoryItem.userAnswers?.[qNum];
                                    const correctAns = qRes?.correctAnswer || qData?.correctAnswer || 'A';
                                    const isCorrect = qRes ? qRes.isCorrect : userAns === correctAns;
                                    const optionsList = getOptionList(qData?.options || qRes?.options || ['A', 'B', 'C', 'D']);

                                    return (
                                      <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <span className="font-mono font-bold text-white text-sm">
                                            Câu {qNum}. {qData?.question || qRes?.questionText}
                                          </span>
                                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            isCorrect
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                          }`}>
                                            {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            <span>{isCorrect ? 'Đúng (+1)' : `Sai — Bạn chọn: ${userAns || '(Trống)'} / Đáp án: ${correctAns}`}</span>
                                          </span>
                                        </div>

                                        {/* Options */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                          {optionsList.map((opt) => {
                                            const isUser = userAns === opt.key;
                                            const isRight = correctAns === opt.key;
                                            return (
                                              <div
                                                key={opt.key}
                                                className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                                                  isRight
                                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                                    : isUser
                                                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold'
                                                    : 'bg-purple-950/50 border-purple-800/40 text-purple-300/80'
                                                }`}
                                              >
                                                <span className="font-mono font-black">({opt.key})</span>
                                                <span className="flex-1">{opt.text}</span>
                                                {isRight && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                                                {isUser && !isRight && <XCircle size={14} className="text-rose-400 shrink-0" />}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Translation & Explanation */}
                                        {(qRes?.translation || qData?.translation) && (
                                          <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-800/40 text-xs text-purple-200">
                                            <span className="font-bold text-amber-300">🇻🇳 Dịch nghĩa: </span>
                                            <span>{qRes?.translation || qData?.translation}</span>
                                          </div>
                                        )}

                                        {(qRes?.explanation || qData?.explanation) && (
                                          <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-800/50 text-xs text-purple-200">
                                            <span className="font-bold text-cyan-300 flex items-center gap-1 mb-0.5">
                                              <Sparkles size={13} className="text-amber-400" /> Giải thích chi tiết:
                                            </span>
                                            <p className="whitespace-pre-line">{qRes?.explanation || qData?.explanation}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* PART 4: SHORT TALKS (QUESTIONS 7 - 9) */}
                              <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="px-3 py-1 rounded-xl bg-pink-500/20 text-pink-300 font-black text-xs border border-pink-500/30">
                                    Part 4: Short Talks — Questions 7 - 9
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setHistoryShowPart4Transcript(prev => !prev)}
                                    className="px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition flex items-center space-x-1.5 cursor-pointer"
                                  >
                                    <Volume2 size={14} className="text-cyan-400" />
                                    <span>{historyShowPart4Transcript ? 'Ẩn lời thoại bài nói ▲' : 'Xem toàn bộ lời thoại (Transcript) ▼'}</span>
                                  </button>
                                </div>

                                {/* Part 4 TOÀN BỘ TRANSCRIPT BÀI NÓI NGẮN */}
                                {historyShowPart4Transcript && (
                                  <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-800/60 text-xs space-y-2">
                                    <div className="text-cyan-400 font-bold flex items-center space-x-1.5 text-sm">
                                      <Volume2 size={16} />
                                      <span>Toàn bộ Lời thoại Bài nói ngắn (Part 4 Full Short Talk Transcript):</span>
                                    </div>
                                    <div className="text-purple-200 whitespace-pre-line leading-relaxed font-sans bg-[#13061c] p-3.5 rounded-lg border border-purple-800/40">
                                      {currentHData?.part4?.[0]?.transcript || getResultForQ(7)?.transcript || 'Đang tải transcript bài nói...'}
                                    </div>
                                  </div>
                                )}

                                {/* Questions 7, 8, 9 */}
                                <div className="space-y-4">
                                  {[7, 8, 9].map((qNum) => {
                                    const qRes = getResultForQ(qNum);
                                    if (!qRes && historyQuestionFilter === 'wrong') return null;
                                    if (historyQuestionFilter === 'wrong' && qRes?.isCorrect) return null;
                                    if (historyQuestionFilter === 'correct' && !qRes?.isCorrect) return null;

                                    const qData = currentHData?.part4?.find((q) => q.questionNumber === qNum);
                                    const userAns = qRes?.userAnswer || selectedHistoryItem.userAnswers?.[qNum];
                                    const correctAns = qRes?.correctAnswer || qData?.correctAnswer || 'A';
                                    const isCorrect = qRes ? qRes.isCorrect : userAns === correctAns;
                                    const optionsList = getOptionList(qData?.options || qRes?.options || ['A', 'B', 'C', 'D']);

                                    return (
                                      <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <span className="font-mono font-bold text-white text-sm">
                                            Câu {qNum}. {qData?.question || qRes?.questionText}
                                          </span>
                                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            isCorrect
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                          }`}>
                                            {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            <span>{isCorrect ? 'Đúng (+1)' : `Sai — Bạn chọn: ${userAns || '(Trống)'} / Đáp án: ${correctAns}`}</span>
                                          </span>
                                        </div>

                                        {/* Options */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                          {optionsList.map((opt) => {
                                            const isUser = userAns === opt.key;
                                            const isRight = correctAns === opt.key;
                                            return (
                                              <div
                                                key={opt.key}
                                                className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                                                  isRight
                                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                                    : isUser
                                                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold'
                                                    : 'bg-purple-950/50 border-purple-800/40 text-purple-300/80'
                                                }`}
                                              >
                                                <span className="font-mono font-black">({opt.key})</span>
                                                <span className="flex-1">{opt.text}</span>
                                                {isRight && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                                                {isUser && !isRight && <XCircle size={14} className="text-rose-400 shrink-0" />}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Translation & Explanation */}
                                        {(qRes?.translation || qData?.translation) && (
                                          <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-800/40 text-xs text-purple-200">
                                            <span className="font-bold text-amber-300">🇻🇳 Dịch nghĩa: </span>
                                            <span>{qRes?.translation || qData?.translation}</span>
                                          </div>
                                        )}

                                        {(qRes?.explanation || qData?.explanation) && (
                                          <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-800/50 text-xs text-purple-200">
                                            <span className="font-bold text-cyan-300 flex items-center gap-1 mb-0.5">
                                              <Sparkles size={13} className="text-amber-400" /> Giải thích chi tiết:
                                            </span>
                                            <p className="whitespace-pre-line">{qRes?.explanation || qData?.explanation}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          )}

                          {/* ------------------------------------------------------------- */}
                          {/* SECTION 2: READING COMPREHENSION (PART 5 - 7)                 */}
                          {/* ------------------------------------------------------------- */}
                          {(historyQuestionFilter === 'all' || historyQuestionFilter === 'reading' || historyQuestionFilter === 'wrong' || historyQuestionFilter === 'correct') && (
                            <div className="p-6 md:p-8 rounded-3xl bg-[#260f34] border border-amber-500/30 shadow-2xl space-y-6">
                              <div className="flex items-center space-x-3 border-b border-purple-800/40 pb-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                  <BookOpen size={22} />
                                </div>
                                <div>
                                  <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                                    Phần 2: Reading Comprehension
                                  </span>
                                  <h3 className="text-xl font-black text-white">
                                    Part 5, 6, 7 (Questions 10 - 23) &bull; Toàn bộ Đề bài &amp; Bài đọc
                                  </h3>
                                </div>
                              </div>

                              {/* PART 5: INCOMPLETE SENTENCES (QUESTIONS 10 - 15) */}
                              <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-5">
                                <div className="flex items-center justify-between">
                                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30">
                                    Part 5: Incomplete Sentences — Questions 10 - 15
                                  </span>
                                  <span className="text-xs text-purple-400 italic">Chọn 1 trong 4 đáp án (A, B, C, D)</span>
                                </div>

                                <div className="space-y-4">
                                  {[10, 11, 12, 13, 14, 15].map((qNum) => {
                                    const qRes = getResultForQ(qNum);
                                    if (!qRes && historyQuestionFilter === 'wrong') return null;
                                    if (historyQuestionFilter === 'wrong' && qRes?.isCorrect) return null;
                                    if (historyQuestionFilter === 'correct' && !qRes?.isCorrect) return null;

                                    const qData = currentHData?.part5?.find((q) => q.questionNumber === qNum);
                                    const userAns = qRes?.userAnswer || selectedHistoryItem.userAnswers?.[qNum];
                                    const correctAns = qRes?.correctAnswer || qData?.correctAnswer || 'A';
                                    const isCorrect = qRes ? qRes.isCorrect : userAns === correctAns;
                                    const optionsList = getOptionList(qData?.options || qRes?.options || ['A', 'B', 'C', 'D']);

                                    return (
                                      <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <span className="font-mono font-bold text-white text-sm">
                                            Câu {qNum}. {qData?.question || qRes?.questionText}
                                          </span>
                                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            isCorrect
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                          }`}>
                                            {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            <span>{isCorrect ? 'Đúng (+1)' : `Sai — Bạn chọn: ${userAns || '(Trống)'} / Đáp án: ${correctAns}`}</span>
                                          </span>
                                        </div>

                                        {/* Options */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                                          {optionsList.map((opt) => {
                                            const isUser = userAns === opt.key;
                                            const isRight = correctAns === opt.key;
                                            return (
                                              <div
                                                key={opt.key}
                                                className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                                                  isRight
                                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                                    : isUser
                                                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold'
                                                    : 'bg-purple-950/50 border-purple-800/40 text-purple-300/80'
                                                }`}
                                              >
                                                <span className="font-mono font-black">({opt.key})</span>
                                                <span className="flex-1">{opt.text}</span>
                                                {isRight && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                                                {isUser && !isRight && <XCircle size={14} className="text-rose-400 shrink-0" />}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Translation & Explanation */}
                                        {(qRes?.translation || qData?.translation) && (
                                          <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-800/40 text-xs text-purple-200">
                                            <span className="font-bold text-amber-300">🇻🇳 Dịch nghĩa: </span>
                                            <span>{qRes?.translation || qData?.translation}</span>
                                          </div>
                                        )}

                                        {(qRes?.explanation || qData?.explanation) && (
                                          <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-800/50 text-xs text-purple-200">
                                            <span className="font-bold text-cyan-300 flex items-center gap-1 mb-0.5">
                                              <Sparkles size={13} className="text-amber-400" /> Giải thích chi tiết:
                                            </span>
                                            <p className="whitespace-pre-line">{qRes?.explanation || qData?.explanation}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* PART 6: TEXT COMPLETION (QUESTIONS 16 - 19) */}
                              <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-4">
                                <span className="px-3 py-1 rounded-xl bg-orange-500/20 text-orange-300 font-black text-xs border border-orange-500/30">
                                  Part 6: Text Completion — Questions 16 - 19
                                </span>

                                {/* TOÀN BỘ ĐOẠN VĂN ĐIỀN TỪ PART 6 */}
                                <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-800/60 text-xs space-y-2">
                                  <div className="text-amber-400 font-bold flex items-center space-x-1.5 text-sm">
                                    <BookOpen size={16} />
                                    <span>Toàn bộ Đoạn văn Bài đọc Điền từ (Part 6 Full Passage):</span>
                                  </div>
                                  <div className="text-purple-100 whitespace-pre-line leading-relaxed font-sans bg-[#13061c] p-4 rounded-lg border border-purple-800/40 text-sm">
                                    {(currentHData?.part6?.passageImage || getResultForQ(16)?.passageImage) ? (
                                      <div className="flex justify-center bg-white p-2 md:p-4 rounded-xl shadow-md overflow-hidden">
                                        <img
                                          src={currentHData?.part6?.passageImage || getResultForQ(16)?.passageImage}
                                          alt="Part 6 Reading Passage"
                                          className="max-w-full h-auto object-contain rounded-lg"
                                        />
                                      </div>
                                    ) : (
                                      currentHData?.part6?.passage || getResultForQ(16)?.passage || 'Đang tải bài đọc Part 6...'
                                    )}
                                  </div>
                                </div>

                                {/* Questions 16, 17, 18, 19 */}
                                <div className="space-y-4">
                                  {[16, 17, 18, 19].map((qNum) => {
                                    const qRes = getResultForQ(qNum);
                                    if (!qRes && historyQuestionFilter === 'wrong') return null;
                                    if (historyQuestionFilter === 'wrong' && qRes?.isCorrect) return null;
                                    if (historyQuestionFilter === 'correct' && !qRes?.isCorrect) return null;

                                    const qData = currentHData?.part6?.questions?.find((q) => q.questionNumber === qNum);
                                    const userAns = qRes?.userAnswer || selectedHistoryItem.userAnswers?.[qNum];
                                    const correctAns = qRes?.correctAnswer || qData?.correctAnswer || 'A';
                                    const isCorrect = qRes ? qRes.isCorrect : userAns === correctAns;
                                    const optionsList = getOptionList(qData?.options || qRes?.options || ['A', 'B', 'C', 'D']);

                                    return (
                                      <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <span className="font-mono font-bold text-white text-sm">
                                            Câu {qNum}. {qData?.question || `Điền từ vào vị trí [${qNum}]`}
                                          </span>
                                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            isCorrect
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                          }`}>
                                            {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            <span>{isCorrect ? 'Đúng (+1)' : `Sai — Bạn chọn: ${userAns || '(Trống)'} / Đáp án: ${correctAns}`}</span>
                                          </span>
                                        </div>

                                        {/* Options */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                                          {optionsList.map((opt) => {
                                            const isUser = userAns === opt.key;
                                            const isRight = correctAns === opt.key;
                                            return (
                                              <div
                                                key={opt.key}
                                                className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                                                  isRight
                                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                                    : isUser
                                                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold'
                                                    : 'bg-purple-950/50 border-purple-800/40 text-purple-300/80'
                                                }`}
                                              >
                                                <span className="font-mono font-black">({opt.key})</span>
                                                <span className="flex-1">{opt.text}</span>
                                                {isRight && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                                                {isUser && !isRight && <XCircle size={14} className="text-rose-400 shrink-0" />}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Translation & Explanation */}
                                        {(qRes?.translation || qData?.translation) && (
                                          <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-800/40 text-xs text-purple-200">
                                            <span className="font-bold text-amber-300">🇻🇳 Dịch nghĩa: </span>
                                            <span>{qRes?.translation || qData?.translation}</span>
                                          </div>
                                        )}

                                        {(qRes?.explanation || qData?.explanation) && (
                                          <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-800/50 text-xs text-purple-200">
                                            <span className="font-bold text-cyan-300 flex items-center gap-1 mb-0.5">
                                              <Sparkles size={13} className="text-amber-400" /> Giải thích chi tiết:
                                            </span>
                                            <p className="whitespace-pre-line">{qRes?.explanation || qData?.explanation}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* PART 7: READING COMPREHENSION (QUESTIONS 20 - 23) */}
                              <div className="bg-[#1d0a27] p-5 md:p-6 rounded-2xl border border-purple-800/40 space-y-4">
                                <span className="px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 font-black text-xs border border-teal-500/30">
                                  Part 7: Reading Comprehension — Questions 20 - 23
                                </span>

                                {/* TOÀN BỘ BÀI ĐỌC HIỂU PART 7 */}
                                <div className="p-4 rounded-xl bg-purple-950/70 border border-purple-800/60 text-xs space-y-2">
                                  <div className="text-amber-400 font-bold flex items-center space-x-1.5 text-sm">
                                    <BookOpen size={16} />
                                    <span>Toàn bộ Bài đọc Hiểu (Part 7 Full Reading Document):</span>
                                  </div>
                                  <div className="text-purple-100 whitespace-pre-line leading-relaxed font-sans bg-[#13061c] p-4 rounded-lg border border-purple-800/40 text-sm">
                                    {(currentHData?.part7?.passageImage || getResultForQ(20)?.passageImage || getResultForQ(19)?.passageImage) ? (
                                      <div className="flex justify-center bg-white p-2 md:p-4 rounded-xl shadow-md overflow-hidden">
                                        <img
                                          src={currentHData?.part7?.passageImage || getResultForQ(20)?.passageImage || getResultForQ(19)?.passageImage}
                                          alt="Part 7 Reading Passage"
                                          className="max-w-full h-auto object-contain rounded-lg"
                                        />
                                      </div>
                                    ) : (
                                      currentHData?.part7?.passage || getResultForQ(20)?.passage || 'Đang tải bài đọc Part 7...'
                                    )}
                                  </div>
                                </div>

                                {/* Questions 20, 21, 22, 23 */}
                                <div className="space-y-4">
                                  {[20, 21, 22, 23].map((qNum) => {
                                    const qRes = getResultForQ(qNum);
                                    if (!qRes && historyQuestionFilter === 'wrong') return null;
                                    if (historyQuestionFilter === 'wrong' && qRes?.isCorrect) return null;
                                    if (historyQuestionFilter === 'correct' && !qRes?.isCorrect) return null;

                                    const qData = currentHData?.part7?.questions?.find((q) => q.questionNumber === qNum);
                                    const userAns = qRes?.userAnswer || selectedHistoryItem.userAnswers?.[qNum];
                                    const correctAns = qRes?.correctAnswer || qData?.correctAnswer || 'A';
                                    const isCorrect = qRes ? qRes.isCorrect : userAns === correctAns;
                                    const optionsList = getOptionList(qData?.options || qRes?.options || ['A', 'B', 'C', 'D']);

                                    return (
                                      <div key={qNum} className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/30 space-y-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <span className="font-mono font-bold text-white text-sm">
                                            Câu {qNum}. {qData?.question || qRes?.questionText}
                                          </span>
                                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                            isCorrect
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                          }`}>
                                            {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            <span>{isCorrect ? 'Đúng (+1)' : `Sai — Bạn chọn: ${userAns || '(Trống)'} / Đáp án: ${correctAns}`}</span>
                                          </span>
                                        </div>

                                        {/* Options */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                          {optionsList.map((opt) => {
                                            const isUser = userAns === opt.key;
                                            const isRight = correctAns === opt.key;
                                            return (
                                              <div
                                                key={opt.key}
                                                className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                                                  isRight
                                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                                    : isUser
                                                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold'
                                                    : 'bg-purple-950/50 border-purple-800/40 text-purple-300/80'
                                                }`}
                                              >
                                                <span className="font-mono font-black">({opt.key})</span>
                                                <span className="flex-1">{opt.text}</span>
                                                {isRight && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                                                {isUser && !isRight && <XCircle size={14} className="text-rose-400 shrink-0" />}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Translation & Explanation */}
                                        {(qRes?.translation || qData?.translation) && (
                                          <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-800/40 text-xs text-purple-200">
                                            <span className="font-bold text-amber-300">🇻🇳 Dịch nghĩa: </span>
                                            <span>{qRes?.translation || qData?.translation}</span>
                                          </div>
                                        )}

                                        {(qRes?.explanation || qData?.explanation) && (
                                          <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-800/50 text-xs text-purple-200">
                                            <span className="font-bold text-cyan-300 flex items-center gap-1 mb-0.5">
                                              <Sparkles size={13} className="text-amber-400" /> Giải thích chi tiết:
                                            </span>
                                            <p className="whitespace-pre-line">{qRes?.explanation || qData?.explanation}</p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          )}

                        </div>
                      ) : (
                        /* =============================================================== */
                        /* VIEW MODE 2: FILTERED QUESTIONS LIST VIEW                      */
                        /* =============================================================== */
                        <div className="space-y-4 animate-fadeIn">
                          {resultsList
                            .filter(q => {
                              if (historyQuestionFilter === 'wrong') return !q.isCorrect;
                              if (historyQuestionFilter === 'correct') return q.isCorrect;
                              if (historyQuestionFilter === 'listening') return q.questionNumber <= 13;
                              if (historyQuestionFilter === 'reading') return q.questionNumber >= 14;
                              return true;
                            })
                            .map((q) => {
                              const qNum = q.questionNumber;
                              const qData = getQuestionFromData(qNum, currentHData);
                              const optionsList = getOptionList(qData?.options || q.options || ['A', 'B', 'C', 'D']);
                              const userAns = q.userAnswer || selectedHistoryItem.userAnswers?.[qNum];

                              return (
                                <div
                                  key={`history-card-q-${qNum}`}
                                  className={`p-5 rounded-2xl border transition-all ${
                                    q.isCorrect
                                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                                      : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                                  }`}
                                >
                                  {/* Top Bar */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center space-x-2.5">
                                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs font-mono border ${
                                        q.isCorrect
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                      }`}>
                                        #{qNum}
                                      </span>
                                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                                        {qData?.partName || q.part || `Part ${qNum <= 1 ? 1 : qNum <= 3 ? 2 : qNum <= 6 ? 3 : qNum <= 9 ? 4 : qNum <= 15 ? 5 : qNum <= 19 ? 6 : 7}`}
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      {q.isCorrect ? (
                                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold">
                                          <CheckCircle2 size={13} />
                                          <span>Đúng (+1)</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-extrabold">
                                          <XCircle size={13} />
                                          <span>Chưa đúng (0/1)</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Question Text */}
                                  <div className="text-sm font-bold text-white mb-3">
                                    {qData?.question || qData?.spokenQuestion || q.questionText || (qNum === 1 ? 'Look at the picture and choose the best statement.' : `Câu hỏi số ${qNum}`)}
                                  </div>

                                  {/* Photo if Part 1 */}
                                  {qNum === 1 && (qData?.imageUrl || q.imageUrl) && (
                                    <div className="mb-3 max-w-xs rounded-xl overflow-hidden border border-purple-800">
                                      <img
                                        src={qData?.imageUrl || q.imageUrl}
                                        alt="TOEIC Part 1 Photo"
                                        className="w-full h-auto"
                                      />
                                    </div>
                                  )}

                                  {/* Passage snippet if Part 6 or 7 */}
                                  {(qData?.passage || q.passage) && (
                                    <div className="mb-3 p-3 rounded-xl bg-[#13061c] border border-purple-800/40 text-xs text-purple-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                                      <span className="font-bold text-amber-300 block mb-1">📄 Bài đọc:</span>
                                      {qData?.passage || q.passage}
                                    </div>
                                  )}

                                  {/* Options */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                                    {optionsList.map((opt) => {
                                      const isUser = userAns === opt.key;
                                      const isRight = q.correctAnswer === opt.key;
                                      return (
                                        <div
                                          key={opt.key}
                                          className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                                            isRight
                                              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                              : isUser
                                              ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-bold'
                                              : 'bg-purple-950/50 border-purple-800/40 text-purple-300/80'
                                          }`}
                                        >
                                          <span className="font-mono font-black">({opt.key})</span>
                                          <span className="flex-1">{opt.text}</span>
                                          {isRight && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                                          {isUser && !isRight && <XCircle size={14} className="text-rose-400 shrink-0" />}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Transcript if listening */}
                                  {(q.transcript || qData?.dialogueTranscript || qData?.talkTranscript) && (
                                    <div className="mb-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200">
                                      <div className="font-bold flex items-center space-x-1.5 text-cyan-300 mb-1">
                                        <Headphones size={13} />
                                        <span>Băng nghe / Transcript:</span>
                                      </div>
                                      <p className="whitespace-pre-line leading-relaxed font-sans">
                                        {q.transcript || qData?.dialogueTranscript || qData?.talkTranscript}
                                      </p>
                                    </div>
                                  )}

                                  {/* Translation */}
                                  {(q.translation || qData?.translation) && (
                                    <div className="mb-3 p-3 rounded-xl bg-purple-900/30 border border-purple-800/40 text-xs text-purple-200">
                                      <div className="font-bold text-amber-300 mb-1">
                                        🇻🇳 Dịch nghĩa tiếng Việt:
                                      </div>
                                      <p className="whitespace-pre-line leading-relaxed">{q.translation || qData?.translation}</p>
                                    </div>
                                  )}

                                  {/* Explanation */}
                                  {(q.explanation || qData?.explanation) && (
                                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/50 text-xs text-purple-200">
                                      <div className="font-bold text-purple-300 flex items-center space-x-1.5 mb-1">
                                        <Sparkles size={13} className="text-amber-400" />
                                        <span>Giải thích chi tiết:</span>
                                      </div>
                                      <p className="whitespace-pre-line leading-relaxed">{q.explanation || qData?.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </>
                  );
                })()}

              </div>
            ) : (
              /* VIEW B: LIST OF TEST HISTORY ATTEMPTS */
              <div>
                {historyLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-3 text-purple-300">
                    <RefreshCw size={32} className="animate-spin text-purple-400" />
                    <p className="text-sm font-semibold">Đang tải danh sách lịch sử thi...</p>
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#240b36]/60 border-2 border-dashed border-purple-800/60 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center mx-auto text-purple-400">
                      <History size={32} />
                    </div>
                    <div className="max-w-md mx-auto space-y-1.5">
                      <h3 className="text-lg font-bold text-white">Chưa có lịch sử làm bài nào</h3>
                      <p className="text-xs text-purple-300 leading-relaxed">
                        {historyFilterAll
                          ? 'Bạn chưa hoàn thành bài Test TOEIC nào trên toàn bộ 50 Lesson.'
                          : `Bạn chưa làm bài Test cho Lesson ${currentLessonId}. Mỗi khi bạn bấm "Nộp bài & Chấm điểm", kết quả sẽ được tự động lưu lại tại đây!`}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('test')}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
                    >
                      Bắt đầu làm bài Test ngay
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {historyList.map((item) => {
                      const pct = item.percentage ?? ((item.score / (item.totalQuestions || 23)) * 100);
                      const isHigh = pct >= 80;
                      const isMid = pct >= 60;

                      return (
                        <div
                          key={`history-card-${item.id}`}
                          onClick={() => handleViewHistoryDetail(item)}
                          className="group relative p-5 rounded-3xl bg-[#260c38]/90 hover:bg-[#2e0e44] border-2 border-purple-800/60 hover:border-purple-600/80 shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                        >
                          {/* Card Header */}
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Lesson {item.lessonId}
                              </span>
                              <span className="text-[11px] text-purple-300/80 flex items-center space-x-1 font-mono">
                                <Calendar size={12} />
                                <span>{formatDateTime(item.createdAt)}</span>
                              </span>
                            </div>

                            <h4 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition line-clamp-1">
                              {item.lessonTitle || `Lesson ${item.lessonId} Practice Test`}
                            </h4>
                          </div>

                          {/* Score Box */}
                          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                            isHigh
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : isMid
                              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                          }`}>
                            <div>
                              <span className="text-[10px] font-bold uppercase opacity-80 block">Kết quả</span>
                              <div className="text-xl font-black font-mono mt-0.5">
                                {item.score} <span className="text-xs font-semibold opacity-70">/ {item.totalQuestions || 23}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-lg font-black font-mono">
                                {pct.toFixed(0)}%
                              </span>
                              <span className="text-[10px] block opacity-80 font-bold">
                                {isHigh ? 'Xuất sắc' : isMid ? 'Khá' : 'Cần cố gắng'}
                              </span>
                            </div>
                          </div>

                          {/* Listening & Reading mini stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-800/50 flex items-center justify-between">
                              <span className="text-cyan-300 text-[11px] font-bold flex items-center gap-1">
                                <Headphones size={12} /> Nghe
                              </span>
                              <span className="font-mono font-black text-white text-[11px]">
                                {item.listeningScore ?? '-'}/{item.listeningTotal || 13}
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-800/50 flex items-center justify-between">
                              <span className="text-amber-300 text-[11px] font-bold flex items-center gap-1">
                                <BookOpen size={12} /> Đọc
                              </span>
                              <span className="font-mono font-black text-white text-[11px]">
                                {item.readingScore ?? '-'}/{item.readingTotal || 10}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-2 border-t border-purple-800/40 flex items-center justify-between gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewHistoryDetail(item);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-purple-800/60 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                            >
                              <ListFilter size={13} />
                              <span>Xem chi tiết</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreToTestView(item);
                              }}
                              className="py-2 px-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1"
                              title="Nạp vào đề thi chính"
                            >
                              <Eye size={13} />
                              <span>Nạp đề</span>
                            </button>

                            <button
                              onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition cursor-pointer"
                              title="Xóa bài thi này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto py-6 px-4 text-center text-xs text-purple-400/60 border-t border-purple-900/30">
        Barron's 600 Essential Words for the TOEIC &bull; CD 1 (Lessons 1-25) &bull; CD 2 (Lessons 26-50) &bull; Audio &amp; Interactive Tests
      </footer>

    </div>
  );
}
