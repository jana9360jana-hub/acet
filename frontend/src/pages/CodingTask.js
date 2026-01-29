import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft, Clock, RefreshCw, Send, AlertCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TASK_DURATION = 300; // 5 minutes in seconds

export default function CodingTask({ student }) {
  const navigate = useNavigate();
  const [level, setLevel] = useState(student.current_level);
  const [task, setTask] = useState(null);
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Disable copy-paste
    const preventCopy = (e) => {
      e.preventDefault();
      toast.error("Copy is disabled during the task");
    };

    const preventPaste = (e) => {
      e.preventDefault();
      toast.error("Paste is disabled during the task");
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
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

  const startTask = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/tasks/coding/generate`, { level });
      setTask(response.data);
      setCode("");
      setTimeLeft(TASK_DURATION);
      setIsRunning(true);
      toast.success("Task started! Fix the errors in the code.");
    } catch (error) {
      toast.error("Failed to generate task");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = async () => {
    setIsRunning(false);
    toast.error("Time's up! Task failed.");
    
    // Submit failed attempt
    await axios.post(`${API}/tasks/submit`, {
      student_id: student.id,
      task_type: "coding",
      level,
      question: task?.code_snippet || "",
      submitted_answer: code,
      is_correct: false,
      error_explanation: "Time limit exceeded",
      time_taken: TASK_DURATION
    });

    setTask(null);
    setCode("");
  };

  const handleRetry = async () => {
    await startTask();
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Please write your code before submitting");
      return;
    }

    setValidating(true);
    const timeTaken = TASK_DURATION - timeLeft;

    try {
      const validation = await axios.post(`${API}/tasks/coding/validate`, {
        level,
        original_code: task.code_snippet,
        submitted_code: code
      });

      // Submit task
      await axios.post(`${API}/tasks/submit`, {
        student_id: student.id,
        task_type: "coding",
        level,
        question: task.code_snippet,
        submitted_answer: code,
        is_correct: validation.data.is_correct,
        error_explanation: validation.data.explanation,
        time_taken: timeTaken
      });

      if (validation.data.is_correct) {
        toast.success("Correct! Well done! " + validation.data.explanation);
        setIsRunning(false);
        setTask(null);
        setCode("");
        
        // Refresh student data
        setTimeout(() => navigate("/student/dashboard"), 2000);
      } else {
        toast.error(validation.data.explanation);
      }
    } catch (error) {
      toast.error("Failed to validate code");
    } finally {
      setValidating(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <header className="glass-effect border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button data-testid="back-to-dashboard" variant="outline" onClick={() => navigate("/student/dashboard")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Coding Challenge</h1>
          </div>
          {isRunning && (
            <Badge data-testid="timer-badge" variant={timeLeft < 60 ? "destructive" : "default"} className="text-lg px-4 py-2 timer-pulse">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!task ? (
          <Card className="max-w-2xl mx-auto border-border shadow-lg">
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
                <p className="text-sm font-medium text-blue-900">Task Rules:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• 5 minutes time limit per task</li>
                  <li>• Copy and paste are disabled</li>
                  <li>• Auto-reset every 10 minutes</li>
                  <li>• Type your corrections manually</li>
                </ul>
              </div>
              <Button 
                data-testid="start-task-button"
                onClick={startTask} 
                disabled={loading} 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-lg transition-all duration-200 active:scale-95"
              >
                {loading ? "Generating Task..." : "Start Task"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem description */}
            <Card data-testid="problem-card" className="border-border shadow-lg">
              <CardHeader className="bg-secondary/50">
                <CardTitle style={{ fontFamily: 'Outfit' }}>Problem Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm">{task.description}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Code with Errors:</p>
                      <pre className="text-xs text-red-800 mt-2 p-3 bg-white rounded border border-red-200 overflow-x-auto code-editor">
                        {task.code_snippet}
                      </pre>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your Task:</p>
                  <p className="text-sm text-muted-foreground">Find and fix all errors in the code above. Type your corrected version in the editor.</p>
                </div>
              </CardContent>
            </Card>

            {/* Code editor */}
            <Card data-testid="code-editor-card" className="border-border shadow-lg">
              <CardHeader className="bg-secondary/50">
                <CardTitle style={{ fontFamily: 'Outfit' }}>Your Solution</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <Textarea
                  data-testid="code-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Type your corrected code here..."
                  className="min-h-[400px] font-mono text-sm no-copy-paste code-editor"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
                <div className="flex gap-3">
                  <Button 
                    data-testid="submit-code-button"
                    onClick={handleSubmit} 
                    disabled={validating || !code.trim()} 
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 transition-all duration-200 active:scale-95"
                  >
                    {validating ? "Validating..." : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Submit Solution
                      </span>
                    )}
                  </Button>
                  <Button 
                    data-testid="retry-button"
                    onClick={handleRetry} 
                    variant="outline" 
                    disabled={loading}
                    className="gap-2 h-11 transition-all duration-200 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="mt-12 pb-6 text-center text-xs text-muted-foreground">
        <p>Developed by Jana</p>
        <p>© Copyrights Claimed 2026</p>
      </footer>
    </div>
  );
}