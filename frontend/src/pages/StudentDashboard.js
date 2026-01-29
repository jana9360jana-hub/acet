import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Code, BookOpen, Trophy, LogOut, Clock } from "lucide-react";

export default function StudentDashboard({ student, setAuth }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('student');
    setAuth(null);
    navigate("/");
  };

  const getLevelColor = (level) => {
    const colors = {
      "Beginner": "bg-green-100 text-green-700 border-green-200",
      "Intermediate": "bg-blue-100 text-blue-700 border-blue-200",
      "Advanced": "bg-purple-100 text-purple-700 border-purple-200",
      "Master": "bg-orange-100 text-orange-700 border-orange-200"
    };
    return colors[level] || colors["Beginner"];
  };

  return (
    <div className="min-h-screen subtle-gradient page-enter">
      {/* Top navigation */}
      <header className="glass-effect border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>ACET</h1>
            <Badge variant="outline" className="text-xs">Student Portal</Badge>
          </div>
          <Button data-testid="logout-button" variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Hero card */}
          <Card data-testid="student-welcome-card" className="col-span-full md:col-span-8 row-span-2 border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 border-2 border-primary">
                    <AvatarImage src={student.photo} alt={student.name} />
                    <AvatarFallback className="text-xl font-bold bg-primary text-white">
                      {student.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>Welcome, {student.name}!</h2>
                    <p className="text-muted-foreground mt-1">Register: {student.register_number}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{student.department}</Badge>
                      <Badge variant="outline">{student.year}</Badge>
                    </div>
                  </div>
                </div>
                <Badge className={`${getLevelColor(student.current_level)} border px-3 py-1`}>
                  <Trophy className="w-3 h-3 mr-1" />
                  {student.current_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Performance Progress</span>
                  <span className="text-sm font-bold text-primary">{student.completion_percentage}%</span>
                </div>
                <Progress value={student.completion_percentage} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tasks Attempted</p>
                  <p className="text-2xl font-bold" data-testid="total-tasks-attempted">{student.total_tasks_attempted}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Current Level</p>
                  <p className="text-2xl font-bold">{student.current_level}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card className="col-span-full md:col-span-4 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Outfit' }}>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-lg font-bold text-primary">{student.completion_percentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium">Rank</span>
                <Badge variant="secondary">Top 10%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coding task */}
          <Card data-testid="coding-task-card" className="border-border shadow-lg hover-lift hover:border-primary/50 cursor-pointer group" onClick={() => navigate("/student/coding")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-200">
                  <Code className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl" style={{ fontFamily: 'Outfit' }}>Coding Challenge</CardTitle>
                  <CardDescription>Fix errors in code snippets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Analyze code with intentional errors, identify the issues, and fix them within the time limit.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>5 minutes per task</span>
              </div>
              <Button data-testid="start-coding-button" className="w-full mt-4 h-11 bg-primary hover:bg-primary/90 transition-all duration-200 active:scale-95" onClick={() => navigate("/student/coding")}>
                Start Coding Task
              </Button>
            </CardContent>
          </Card>

          {/* MCQ task */}
          <Card data-testid="mcq-task-card" className="border-border shadow-lg hover-lift hover:border-primary/50 cursor-pointer group" onClick={() => navigate("/student/mcq")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-200">
                  <BookOpen className="w-6 h-6 text-accent group-hover:text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl" style={{ fontFamily: 'Outfit' }}>MCQ Challenge</CardTitle>
                  <CardDescription>Choose the best answer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test your programming knowledge with multiple choice questions across different difficulty levels.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>30 seconds per question</span>
              </div>
              <Button data-testid="start-mcq-button" className="w-full mt-4 h-11 bg-accent hover:bg-accent/90 text-white transition-all duration-200 active:scale-95" onClick={() => navigate("/student/mcq")}>
                Start MCQ Challenge
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-12 pb-6 text-center text-xs text-muted-foreground">
        <p>Developed by Jana</p>
        <p>© Copyrights Claimed 2026</p>
      </footer>
    </div>
  );
}