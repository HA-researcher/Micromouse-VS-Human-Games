import React, { useState } from 'react';
import type { Lesson } from '../types/tutorial';
import { translations, type Language } from '../i18n/translations';

interface TutorialCardProps {
  lesson: Lesson;
  stepIndex: number;
  lang: Language;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onJumpToStep: (index: number) => void;
}

const TutorialCard: React.FC<TutorialCardProps> = ({ 
  lesson, stepIndex, lang, onNext, onBack, onClose, onJumpToStep 
}) => {
  const step = lesson.steps[stepIndex];
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const getTranslation = (key: string) => {
    const keys = key.split('.');
    let obj: any = translations[lang];
    for (const k of keys) {
      if (obj && obj[k]) obj = obj[k];
      else return key; // Fallback to key
    }
    return obj;
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    onNext();
  };

  const isLastStep = stepIndex === lesson.steps.length - 1;

  return (
    <div className="tutorial-overlay-card glass animate-slide-up">
      <div className="tutorial-header">
        <span className="lesson-badge">{getTranslation(lesson.title)}</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="tutorial-content">
        <h3>{getTranslation(step.title)}</h3>
        <p>{getTranslation(step.text)}</p>

        {step.quiz && (
          <div className="tutorial-quiz">
            <p className="quiz-question">{getTranslation(step.quiz.question)}</p>
            <div className="quiz-options">
              {step.quiz.options.map((opt, idx) => (
                <button 
                  key={idx} 
                  className={`quiz-option ${selectedOption === idx ? (opt.isCorrect ? 'correct' : 'wrong') : ''}`}
                  onClick={() => {
                    setSelectedOption(idx);
                    if (opt.isCorrect) setShowAnswer(true);
                  }}
                  disabled={showAnswer}
                >
                  {getTranslation(opt.text)}
                </button>
              ))}
            </div>
            {selectedOption !== null && (
               <p className="quiz-hint">
                 {showAnswer ? (lang === 'ja' ? '✨ 正解！' : '✨ Correct!') : `💡 ${getTranslation(step.quiz.hint)}`}
               </p>
            )}
          </div>
        )}
      </div>

      <div className="tutorial-footer">
        <div className="progress-dots">
          {lesson.steps.map((_, idx) => (
            <span 
              key={idx} 
              className={`dot ${idx === stepIndex ? 'active' : ''} ${idx < stepIndex ? 'completed' : ''}`}
              onClick={() => onJumpToStep(idx)}
            />
          ))}
        </div>
        <div className="nav-buttons">
          <button onClick={onBack} disabled={stepIndex === 0} className="btn-outline mini">
            {lang === 'ja' ? '戻る' : 'Back'}
          </button>
          <button 
            onClick={isLastStep ? onClose : handleNext} 
            className="btn-primary mini"
            disabled={step.quiz ? !showAnswer : false}
          >
            {isLastStep ? (lang === 'ja' ? '完了' : 'Finish') : (lang === 'ja' ? '次へ' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialCard;
