import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft, Trophy, Code, BookOpen, CheckCircle, XCircle, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StudentProfile({ admin }) {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [studentRes, tasksRes] = await Promise.all([
        axios.get(`${API}/students/${studentId}`),
        axios.get(`${API}/tasks/student/${studentId}`)
      ]);
      setStudent(studentRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      toast.error("Failed to fetch student data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen subtle-gradient flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen subtle-gradient flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Student not found</p>
      </div>
    );
  }

  const codingTasks = tasks.filter(t => t.task_type === "coding");
  const mcqTasks = tasks.filter(t => t.task_type === "mcq");
  const correctTasks = tasks.filter(t => t.is_correct).length;
  const incorrectTasks = tasks.length - correctTasks;

  return (
    <div className="min-h-screen subtle-gradient page-enter">
      {/* Header */}
      <header className="glass-effect border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button data-testid="back-to-admin" variant="outline" onClick={() => navigate("/admin/dashboard")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Student Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Student Bio */}
        <Card data-testid="student-bio-card" className="border-border shadow-lg">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Outfit' }}>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage src={student.photo} />
                <AvatarFallback className="text-3xl font-bold bg-primary text-white">{student.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>{student.name}</h2>
                  <p className="text-muted-foreground mt-1">Register: {student.register_number}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-lg font-semibold">{student.age} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <Badge variant="outline" className="mt-1">{student.department}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Year</p>
                    <Badge variant="outline" className="mt-1">{student.year}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Level</p>
                    <Badge className="bg-primary mt-1">
                      <Trophy className="w-3 h-3 mr-1" />
                      {student.current_level}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tasks.length}</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Correct</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{correctTasks}</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Incorrect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{incorrectTasks}</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{student.completion_percentage}%</p>
              <Progress value={student.completion_percentage} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Task History */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Outfit' }}>Task History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger data-testid="all-tasks-tab" value="all">All Tasks ({tasks.length})</TabsTrigger>
                <TabsTrigger data-testid="coding-tasks-tab" value="coding">Coding ({codingTasks.length})</TabsTrigger>
                <TabsTrigger data-testid="mcq-tasks-tab" value="mcq">MCQ ({mcqTasks.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <TaskTable tasks={tasks} />
              </TabsContent>

              <TabsContent value="coding">
                <TaskTable tasks={codingTasks} />
              </TabsContent>

              <TabsContent value="mcq">
                <TaskTable tasks={mcqTasks} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-12 pb-6 text-center text-xs text-muted-foreground">
        <p>Developed by Jana</p>
        <p>© Copyrights Claimed 2026</p>
      </footer>
    </div>
  );
}

function TaskTable({ tasks }) {
  if (tasks.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">No tasks found</p>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time Taken</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {task.task_type === "coding" ? (
                    <Code className="w-4 h-4 text-primary" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-accent" />
                  )}
                  <span className="capitalize">{task.task_type}</span>
                </div>
              </TableCell>
              <TableCell><Badge variant="outline">{task.level}</Badge></TableCell>
              <TableCell>
                {task.is_correct ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Correct
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Incorrect
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{task.time_taken}s</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(task.timestamp).toLocaleDateString()} {new Date(task.timestamp).toLocaleTimeString()}
              </TableCell>
              <TableCell>
                {task.error_explanation && (
                  <p className="text-xs text-muted-foreground max-w-xs truncate">{task.error_explanation}</p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}