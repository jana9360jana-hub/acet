import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import StudentLogin from "@/pages/StudentLogin";
import AdminLogin from "@/pages/AdminLogin";
import StudentDashboard from "@/pages/StudentDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import CodingTask from "@/pages/CodingTask";
import MCQTask from "@/pages/MCQTask";
import StudentProfile from "@/pages/StudentProfile";
import { useState, useEffect } from "react";

function App() {
  const [studentAuth, setStudentAuth] = useState(null);
  const [adminAuth, setAdminAuth] = useState(null);

  useEffect(() => {
    const student = localStorage.getItem('student');
    const admin = localStorage.getItem('admin');
    if (student) setStudentAuth(JSON.parse(student));
    if (admin) setAdminAuth(JSON.parse(admin));
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StudentLogin setAuth={setStudentAuth} />} />
          <Route path="/admin/login" element={<AdminLogin setAuth={setAdminAuth} />} />
          <Route 
            path="/student/dashboard" 
            element={studentAuth ? <StudentDashboard student={studentAuth} setAuth={setStudentAuth} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/student/coding" 
            element={studentAuth ? <CodingTask student={studentAuth} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/student/mcq" 
            element={studentAuth ? <MCQTask student={studentAuth} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/dashboard" 
            element={adminAuth ? <AdminDashboard admin={adminAuth} setAuth={setAdminAuth} /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/student/:studentId" 
            element={adminAuth ? <StudentProfile admin={adminAuth} /> : <Navigate to="/admin/login" />} 
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;