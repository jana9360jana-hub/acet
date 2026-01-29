import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QUESTION_DURATION = 30; // 30 seconds per question
const QUESTIONS_PER_LEVEL = 10;

export default function MCQTask({ student }) {
  const navigate = useNavigate();
  const [level, setLevel] = useState(student.current_level);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return QUESTION_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/tasks/mcq/generate`, { level });
      setQuestions(response.data.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer("");
      setTimeLeft(QUESTION_DURATION);
      setIsRunning(true);
      setScore(0);
      setShowResult(false);
      toast.success("Quiz started! Answer as many questions as you can.");
    } catch (error) {
      toast.error("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    toast.error("Time's up for this question!");
    handleNextQuestion(false);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      toast.error("Please select an answer");
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    // Submit task
    const timeTaken = QUESTION_DURATION - timeLeft;
    await axios.post(`${API}/tasks/submit`, {
      student_id: student.id,
      task_type: "mcq",
      level,
      question: currentQuestion.question,
      submitted_answer: selectedAnswer,
      is_correct: isCorrect,
      error_explanation: isCorrect ? null : currentQuestion.explanation,
      time_taken: timeTaken
    });

    if (isCorrect) {
      toast.success("Correct! " + currentQuestion.explanation);
      setScore(score + 1);
    } else {
      toast.error(`Wrong! Correct answer: ${currentQuestion.correct_answer}. ${currentQuestion.explanation}`);
    }

    handleNextQuestion(isCorrect);
  };

  const handleNextQuestion = (wasCorrect) => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setTimeLeft(QUESTION_DURATION);
    } else {
      // Quiz completed
      setIsRunning(false);
      setShowResult(true);
      const finalScore = wasCorrect ? score + 1 : score;
      const percentage = (finalScore / questions.length) * 100;
      toast.success(`Quiz completed! You scored ${finalScore}/${questions.length} (${percentage.toFixed(0)}%)`);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen subtle-gradient page-enter">
      {/* Header */}
      <header className="glass-effect border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button data-testid="back-to-dashboard" variant="outline" onClick={() => navigate("/student/dashboard")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>MCQ Challenge</h1>
          </div>
          {isRunning && (
            <Badge data-testid="timer-badge" variant={timeLeft < 10 ? "destructive" : "default"} className="text-lg px-4 py-2 timer-pulse">
              <Clock className="w-4 h-4 mr-2" />
              {timeLeft}s
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!isRunning && !showResult ? (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl" style={{ fontFamily: 'Outfit' }} data-testid="select-level-title">Select Difficulty Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger data-testid="level-select" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">Quiz Rules:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• 10 questions per level</li>
                  <li>• 30 seconds per question</li>
                  <li>• Auto-reset after time expires</li>
                  <li>• Choose the best answer</li>
                </ul>
              </div>
              <Button 
                data-testid="start-quiz-button"
                onClick={startQuiz} 
                disabled={loading} 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-lg transition-all duration-200 active:scale-95"
              >
                {loading ? "Loading Questions..." : "Start Quiz"}
              </Button>
            </CardContent>
          </Card>
        ) : showResult ? (
          <Card data-testid="quiz-result-card" className="border-border shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                {score / questions.length >= 0.7 ? (
                  <CheckCircle className="w-20 h-20 text-green-500" />
                ) : (
                  <XCircle className="w-20 h-20 text-red-500" />
                )}
              </div>
              <CardTitle className="text-3xl" style={{ fontFamily: 'Outfit' }}>Quiz Completed!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-5xl font-bold text-primary">{score}/{questions.length}</p>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </div>
              <Progress value={(score / questions.length) * 100} className="h-3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{score}</p>
                  <p className="text-xs text-green-600">Correct</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{questions.length - score}</p>
                  <p className="text-xs text-red-600">Incorrect</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  data-testid="try-again-button"
                  onClick={startQuiz} 
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 transition-all duration-200 active:scale-95"
                >
                  Try Again
                </Button>
                <Button 
                  data-testid="back-to-dashboard-button"
                  onClick={() => navigate("/student/dashboard")} 
                  variant="outline" 
                  className="flex-1 h-11 transition-all duration-200 active:scale-95"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="question-card" className="border-border shadow-lg">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Question {currentQuestionIndex + 1}/{questions.length}</Badge>
                <Badge className="bg-primary">{level}</Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="min-h-[120px]">
                <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Outfit' }}>
                  {currentQuestion?.question}
                </h3>
              </div>
              <RadioGroup data-testid="answer-options" value={selectedAnswer} onValueChange={setSelectedAnswer}>
                <div className="space-y-3">
                  {currentQuestion?.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors duration-200 cursor-pointer">
                      <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                        <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
              <Button 
                data-testid="submit-answer-button"
                onClick={handleSubmitAnswer} 
                disabled={!selectedAnswer}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-lg transition-all duration-200 active:scale-95"
              >
                Submit Answer
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="mt-12 pb-6 text-center text-xs text-muted-foreground">
        <p>Developed by Jana</p>
        <p>© Copyrights Claimed 2026</p>
      </footer>
    </div>
  );
}