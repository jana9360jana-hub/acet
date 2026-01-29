from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
from passlib.context import CryptContext
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class AdminCreate(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str

class StudentLogin(BaseModel):
    register_number: str
    password: str

class StudentCreate(BaseModel):
    name: str
    age: int
    register_number: str
    department: str
    year: str
    photo: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    department: Optional[str] = None
    year: Optional[str] = None
    photo: Optional[str] = None

class StudentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    age: int
    register_number: str
    department: str
    year: str
    photo: Optional[str] = None
    current_level: str = "Beginner"
    completion_percentage: float = 0.0
    total_tasks_attempted: int = 0

class TaskSubmission(BaseModel):
    student_id: str
    task_type: str  # "coding" or "mcq"
    level: str
    question: str
    submitted_answer: str
    is_correct: bool
    error_explanation: Optional[str] = None
    time_taken: int  # in seconds

class TaskResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    student_id: str
    task_type: str
    level: str
    question: str
    submitted_answer: str
    is_correct: bool
    error_explanation: Optional[str] = None
    time_taken: int
    timestamp: str

class CodeTaskRequest(BaseModel):
    level: str

class CodeTaskResponse(BaseModel):
    code_snippet: str
    description: str

class CodeValidationRequest(BaseModel):
    level: str
    original_code: str
    submitted_code: str

class CodeValidationResponse(BaseModel):
    is_correct: bool
    explanation: str

class MCQRequest(BaseModel):
    level: str

class MCQResponse(BaseModel):
    questions: List[dict]

class MCQValidationRequest(BaseModel):
    question: str
    selected_answer: str
    correct_answer: str

class MCQValidationResponse(BaseModel):
    is_correct: bool
    explanation: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Initialize default admin account
async def create_default_admin():
    existing_admin = await db.admins.find_one({"username": "admin"})
    if not existing_admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": hash_password("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admins.insert_one(admin_doc)
        logger.info("Default admin account created")

@app.on_event("startup")
async def startup_event():
    await create_default_admin()

# Admin routes
@api_router.post("/admin/register", response_model=AdminResponse)
async def register_admin(admin: AdminCreate):
    existing = await db.admins.find_one({"username": admin.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "username": admin.username,
        "password": hash_password(admin.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    return AdminResponse(id=admin_doc["id"], username=admin_doc["username"])

@api_router.post("/admin/login", response_model=AdminResponse)
async def login_admin(admin: AdminLogin):
    admin_doc = await db.admins.find_one({"username": admin.username})
    if not admin_doc or not verify_password(admin.password, admin_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return AdminResponse(id=admin_doc["id"], username=admin_doc["username"])

# Student authentication routes
@api_router.post("/student/login", response_model=StudentResponse)
async def login_student(login: StudentLogin):
    student = await db.students.find_one({"register_number": login.register_number}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=401, detail="Student not found")
    
    # Password is same as register number
    if login.password != login.register_number:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Calculate stats
    tasks = await db.task_submissions.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
    total_tasks = len(tasks)
    correct_tasks = len([t for t in tasks if t["is_correct"]])
    completion_percentage = (correct_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
    
    return StudentResponse(
        id=student["id"],
        name=student["name"],
        age=student["age"],
        register_number=student["register_number"],
        department=student["department"],
        year=student["year"],
        photo=student.get("photo"),
        current_level=student.get("current_level", "Beginner"),
        completion_percentage=round(completion_percentage, 2),
        total_tasks_attempted=total_tasks
    )

# Student management routes
@api_router.post("/students", response_model=StudentResponse)
async def create_student(student: StudentCreate):
    existing = await db.students.find_one({"register_number": student.register_number})
    if existing:
        raise HTTPException(status_code=400, detail="Register number already exists")
    
    student_doc = {
        "id": str(uuid.uuid4()),
        "name": student.name,
        "age": student.age,
        "register_number": student.register_number,
        "department": student.department,
        "year": student.year,
        "photo": student.photo,
        "current_level": "Beginner",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.students.insert_one(student_doc)
    return StudentResponse(**student_doc, completion_percentage=0.0, total_tasks_attempted=0)

@api_router.get("/students", response_model=List[StudentResponse])
async def get_students(year: Optional[str] = None, department: Optional[str] = None):
    query = {}
    if year:
        query["year"] = year
    if department:
        query["department"] = department
    
    students = await db.students.find(query, {"_id": 0}).to_list(1000)
    
    result = []
    for student in students:
        tasks = await db.task_submissions.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
        total_tasks = len(tasks)
        correct_tasks = len([t for t in tasks if t["is_correct"]])
        completion_percentage = (correct_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
        
        result.append(StudentResponse(
            **student,
            completion_percentage=round(completion_percentage, 2),
            total_tasks_attempted=total_tasks
        ))
    
    return result

@api_router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    tasks = await db.task_submissions.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    total_tasks = len(tasks)
    correct_tasks = len([t for t in tasks if t["is_correct"]])
    completion_percentage = (correct_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
    
    return StudentResponse(
        **student,
        completion_percentage=round(completion_percentage, 2),
        total_tasks_attempted=total_tasks
    )

@api_router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, update: StudentUpdate):
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.students.update_one({"id": student_id}, {"$set": update_data})
    
    updated_student = await db.students.find_one({"id": student_id}, {"_id": 0})
    tasks = await db.task_submissions.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    total_tasks = len(tasks)
    correct_tasks = len([t for t in tasks if t["is_correct"]])
    completion_percentage = (correct_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
    
    return StudentResponse(
        **updated_student,
        completion_percentage=round(completion_percentage, 2),
        total_tasks_attempted=total_tasks
    )

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Delete all tasks for this student
    await db.task_submissions.delete_many({"student_id": student_id})
    return {"message": "Student deleted successfully"}

# AI task generation routes
@api_router.post("/tasks/coding/generate", response_model=CodeTaskResponse)
async def generate_coding_task(request: CodeTaskRequest):
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    system_message = f"""You are an expert programming instructor. Generate a {request.level} level Python code snippet (10-20 lines) that contains intentional errors. 
    The errors should be appropriate for the difficulty level:
    - Beginner: syntax errors, basic logic errors
    - Intermediate: logic errors, off-by-one errors, scope issues
    - Advanced: complex algorithm errors, edge case handling
    - Master: optimization issues, subtle bugs, architecture problems
    
    Return ONLY a JSON object with two keys:
    - "code_snippet": the erroneous code
    - "description": a brief description of what the code is supposed to do (not the errors)
    """
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"code-gen-{uuid.uuid4()}",
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=f"Generate a {request.level} level coding task")
    response = await chat.send_message(user_message)
    
    # Parse JSON response
    try:
        data = json.loads(response)
        return CodeTaskResponse(**data)
    except:
        # Fallback if JSON parsing fails
        return CodeTaskResponse(
            code_snippet="# Error generating task\nprint('Please try again')",
            description="Task generation failed"
        )

@api_router.post("/tasks/coding/validate", response_model=CodeValidationResponse)
async def validate_coding_task(request: CodeValidationRequest):
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    system_message = """You are an expert code reviewer. Analyze the submitted code against the original erroneous code.
    Determine if the student correctly fixed the errors. Return ONLY a JSON object with:
    - "is_correct": boolean (true if all errors are fixed)
    - "explanation": string (if incorrect, explain what errors remain; if correct, congratulate and explain what was fixed)
    """
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"code-val-{uuid.uuid4()}",
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(
        text=f"""Original code with errors:
{request.original_code}

Student's submitted code:
{request.submitted_code}

Validate if the errors are fixed."""
    )
    
    response = await chat.send_message(user_message)
    
    try:
        data = json.loads(response)
        return CodeValidationResponse(**data)
    except:
        return CodeValidationResponse(
            is_correct=False,
            explanation="Unable to validate code. Please try again."
        )

@api_router.post("/tasks/mcq/generate", response_model=MCQResponse)
async def generate_mcq_tasks(request: MCQRequest):
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    system_message = f"""You are an expert programming instructor. Generate 10 multiple choice questions for {request.level} level.
    Each question should have 4 options (A, B, C, D) with one correct answer.
    Return ONLY a JSON array with 10 objects, each having:
    - "question": the question text
    - "options": array of 4 strings
    - "correct_answer": the letter (A, B, C, or D)
    - "explanation": why the correct answer is correct
    """
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"mcq-gen-{uuid.uuid4()}",
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=f"Generate 10 {request.level} level MCQ questions about programming")
    response = await chat.send_message(user_message)
    
    try:
        questions = json.loads(response)
        return MCQResponse(questions=questions)
    except:
        return MCQResponse(questions=[])

@api_router.post("/tasks/mcq/validate", response_model=MCQValidationResponse)
async def validate_mcq(request: MCQValidationRequest):
    is_correct = request.selected_answer == request.correct_answer
    
    if is_correct:
        explanation = "Correct! Well done."
    else:
        explanation = f"Incorrect. The correct answer is {request.correct_answer}."
    
    return MCQValidationResponse(is_correct=is_correct, explanation=explanation)

# Task submission routes
@api_router.post("/tasks/submit", response_model=TaskResponse)
async def submit_task(submission: TaskSubmission):
    task_doc = {
        "id": str(uuid.uuid4()),
        "student_id": submission.student_id,
        "task_type": submission.task_type,
        "level": submission.level,
        "question": submission.question,
        "submitted_answer": submission.submitted_answer,
        "is_correct": submission.is_correct,
        "error_explanation": submission.error_explanation,
        "time_taken": submission.time_taken,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.task_submissions.insert_one(task_doc)
    
    # Update student level if correct
    if submission.is_correct:
        student = await db.students.find_one({"id": submission.student_id})
        if student:
            current_level = student.get("current_level", "Beginner")
            level_progression = {"Beginner": "Intermediate", "Intermediate": "Advanced", "Advanced": "Master"}
            if submission.level == current_level and current_level in level_progression:
                new_level = level_progression[current_level]
                await db.students.update_one(
                    {"id": submission.student_id},
                    {"$set": {"current_level": new_level}}
                )
    
    return TaskResponse(**task_doc)

@api_router.get("/tasks/student/{student_id}", response_model=List[TaskResponse])
async def get_student_tasks(student_id: str):
    tasks = await db.task_submissions.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return [TaskResponse(**task) for task in tasks]

# Analytics routes
@api_router.get("/analytics/overview")
async def get_analytics_overview():
    total_students = await db.students.count_documents({})
    
    # Active students (those with at least one task submission)
    active_student_ids = await db.task_submissions.distinct("student_id")
    active_students = len(active_student_ids)
    
    # Average performance
    all_tasks = await db.task_submissions.find({}, {"_id": 0}).to_list(10000)
    total_tasks = len(all_tasks)
    correct_tasks = len([t for t in all_tasks if t["is_correct"]])
    avg_performance = (correct_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
    
    # Level distribution
    levels = await db.students.aggregate([
        {"$group": {"_id": "$current_level", "count": {"$sum": 1}}}
    ]).to_list(100)
    level_distribution = {level["_id"]: level["count"] for level in levels}
    
    return {
        "total_students": total_students,
        "active_students": active_students,
        "average_performance": round(avg_performance, 2),
        "level_distribution": level_distribution
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()