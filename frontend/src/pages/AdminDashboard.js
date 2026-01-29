import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import { LogOut, Plus, Edit, Trash2, Eye, Users, TrendingUp, BarChart3, Filter } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ admin, setAuth }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterYear, setFilterYear] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    register_number: "",
    department: "AI & DS",
    year: "1st Year",
    photo: ""
  });

  useEffect(() => {
    fetchStudents();
    fetchAnalytics();
  }, [filterYear, filterDept]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear) params.append('year', filterYear);
      if (filterDept) params.append('department', filterDept);
      
      const response = await axios.get(`${API}/students?${params}`);
      setStudents(response.data);
    } catch (error) {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/overview`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to fetch analytics");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    setAuth(null);
    navigate("/admin/login");
  };

  const handleAddStudent = async () => {
    if (!formData.name || !formData.age || !formData.register_number) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.post(`${API}/students`, {
        ...formData,
        age: parseInt(formData.age)
      });
      toast.success("Student added successfully");
      setShowAddDialog(false);
      resetForm();
      fetchStudents();
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add student");
    }
  };

  const handleEditStudent = async () => {
    if (!formData.name || !formData.age) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.put(`${API}/students/${selectedStudent.id}`, {
        name: formData.name,
        age: parseInt(formData.age),
        department: formData.department,
        year: formData.year,
        photo: formData.photo || null
      });
      toast.success("Student updated successfully");
      setShowEditDialog(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      toast.error("Failed to update student");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await axios.delete(`${API}/students/${studentId}`);
      toast.success("Student deleted successfully");
      fetchStudents();
      fetchAnalytics();
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };

  const openEditDialog = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      age: student.age.toString(),
      register_number: student.register_number,
      department: student.department,
      year: student.year,
      photo: student.photo || ""
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      register_number: "",
      department: "AI & DS",
      year: "1st Year",
      photo: ""
    });
    setSelectedStudent(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen subtle-gradient page-enter">
      {/* Header */}
      <header className="glass-effect border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>ACET Admin</h1>
            <Badge variant="outline" className="text-xs">Admin Portal</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Welcome, {admin.username}</span>
            <Button data-testid="admin-logout-button" variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger data-testid="overview-tab" value="overview">Overview</TabsTrigger>
            <TabsTrigger data-testid="students-tab" value="students">Students</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card data-testid="total-students-card" className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics?.total_students || 0}</p>
                </CardContent>
              </Card>

              <Card data-testid="active-students-card" className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{analytics?.active_students || 0}</p>
                </CardContent>
              </Card>

              <Card data-testid="avg-performance-card" className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Performance</CardTitle>
                    <BarChart3 className="w-5 h-5 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-accent">{analytics?.average_performance?.toFixed(1) || 0}%</p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Level Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analytics?.level_distribution && Object.entries(analytics.level_distribution).map(([level, count]) => (
                    <div key={level} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{level}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle style={{ fontFamily: 'Outfit' }}>Student Management</CardTitle>
                    <Badge variant="secondary">{students.length} students</Badge>
                  </div>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="add-student-button" className="gap-2 bg-primary hover:bg-primary/90 transition-all duration-200 active:scale-95">
                        <Plus className="w-4 h-4" />
                        Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle style={{ fontFamily: 'Outfit' }}>Add New Student</DialogTitle>
                        <DialogDescription>Enter student details below</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input data-testid="student-name-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Student name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Age *</Label>
                          <Input data-testid="student-age-input" type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} placeholder="Age" />
                        </div>
                        <div className="space-y-2">
                          <Label>Register Number *</Label>
                          <Input data-testid="student-register-input" value={formData.register_number} onChange={(e) => setFormData({...formData, register_number: e.target.value})} placeholder="720324243018" />
                        </div>
                        <div className="space-y-2">
                          <Label>Department *</Label>
                          <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val})}>
                            <SelectTrigger data-testid="student-department-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AI & DS">AI & DS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Year *</Label>
                          <Select value={formData.year} onValueChange={(val) => setFormData({...formData, year: val})}>
                            <SelectTrigger data-testid="student-year-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st Year">1st Year</SelectItem>
                              <SelectItem value="2nd Year">2nd Year</SelectItem>
                              <SelectItem value="3rd Year">3rd Year</SelectItem>
                              <SelectItem value="4th Year">4th Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Photo</Label>
                          <Input data-testid="student-photo-input" type="file" accept="image/*" onChange={handleImageUpload} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
                        <Button data-testid="save-student-button" onClick={handleAddStudent} className="bg-primary hover:bg-primary/90">Add Student</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex gap-3 mt-4">
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger data-testid="filter-year-select" className="w-[180px]">
                      <SelectValue placeholder="Filter by year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Years</SelectItem>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger data-testid="filter-dept-select" className="w-[180px]">
                      <SelectValue placeholder="Filter by dept" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">All Departments</SelectItem>
                      <SelectItem value="AI & DS">AI & DS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Register No</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                        </TableRow>
                      ) : students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No students found</TableCell>
                        </TableRow>
                      ) : (
                        students.map((student) => (
                          <TableRow key={student.id} data-testid={`student-row-${student.register_number}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={student.photo} />
                                  <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.age} years</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{student.register_number}</TableCell>
                            <TableCell><Badge variant="outline">{student.department}</Badge></TableCell>
                            <TableCell><Badge variant="outline">{student.year}</Badge></TableCell>
                            <TableCell><Badge className="bg-primary">{student.current_level}</Badge></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-secondary rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: `${student.completion_percentage}%` }}></div>
                                </div>
                                <span className="text-sm font-medium">{student.completion_percentage}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button data-testid={`view-student-${student.register_number}`} variant="ghost" size="sm" onClick={() => navigate(`/admin/student/${student.id}`)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button data-testid={`edit-student-${student.register_number}`} variant="ghost" size="sm" onClick={() => openEditDialog(student)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button data-testid={`delete-student-${student.register_number}`} variant="ghost" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit' }}>Edit Student</DialogTitle>
            <DialogDescription>Update student information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input data-testid="edit-student-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Age *</Label>
              <Input data-testid="edit-student-age" type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val})}>
                <SelectTrigger data-testid="edit-student-department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI & DS">AI & DS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year *</Label>
              <Select value={formData.year} onValueChange={(val) => setFormData({...formData, year: val})}>
                <SelectTrigger data-testid="edit-student-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Photo</Label>
              <Input data-testid="edit-student-photo" type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>Cancel</Button>
            <Button data-testid="update-student-button" onClick={handleEditStudent} className="bg-primary hover:bg-primary/90">Update Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="mt-12 pb-6 text-center text-xs text-muted-foreground">
        <p>Developed by Jana</p>
        <p>© Copyrights Claimed 2026</p>
      </footer>
    </div>
  );
}