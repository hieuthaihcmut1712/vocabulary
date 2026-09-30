import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import QuizPage from './pages/QuizPage';
import PracticePage from './pages/PracticePage';
import ReverseQuizPage from './pages/ReverseQuizPage';
import ReversePracticePage from './pages/ReversePracticePage';
import ListeningDrillPage from './pages/ListeningDrillPage';
import ListeningPracticePage from './pages/ListeningPracticePage';
import AppliedExercisePage from './pages/AppliedExercisePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Kỹ năng 1: Quizziz Anh -> Việt (Đọc từ tiếng Anh, chọn nghĩa tiếng Việt) */}
        <Route path="/deck/:deckId" element={<QuizPage />} />
        <Route path="/deck/:deckId/practice" element={<PracticePage />} />

        {/* Kỹ năng 2: Quizziz Việt -> Anh (Đọc nghĩa tiếng Việt, chọn từ tiếng Anh) */}
        <Route path="/deck/:deckId/reverse" element={<ReverseQuizPage />} />
        <Route path="/deck/:deckId/reverse-practice" element={<ReversePracticePage />} />

        {/* Kỹ năng 3: Luyện nghe chính tả (Nghe phát âm, gõ chính tả tiếng Anh) */}
        <Route path="/deck/:deckId/listening" element={<ListeningDrillPage />} />
        <Route path="/deck/:deckId/listening-practice" element={<ListeningPracticePage />} />

        {/* Giai đoạn 2: Bài tập ứng dụng ngữ cảnh TOEIC (550, 700 Đọc, 700 Nghe, 850) */}
        <Route path="/deck/:deckId/exercises" element={<AppliedExercisePage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
