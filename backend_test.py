import requests
import sys
import json
from datetime import datetime

class ACETAPITester:
    def __init__(self, base_url="https://acet-ailearn.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.student_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                return True, response.json() if response.content else {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code} - {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'id' in response:
            self.admin_token = response
            return True
        return False

    def test_student_login(self):
        """Test student login"""
        success, response = self.run_test(
            "Student Login",
            "POST", 
            "student/login",
            200,
            data={"register_number": "720324243018", "password": "720324243018"}
        )
        if success and 'id' in response:
            self.student_data = response
            return True
        return False

    def test_create_student(self):
        """Test creating a new student"""
        test_student = {
            "name": f"Test Student {datetime.now().strftime('%H%M%S')}",
            "age": 20,
            "register_number": f"TEST{datetime.now().strftime('%H%M%S')}",
            "department": "AI & DS",
            "year": "1st Year",
            "photo": None
        }
        
        success, response = self.run_test(
            "Create Student",
            "POST",
            "students",
            200,
            data=test_student
        )
        return success, response.get('id') if success else None

    def test_get_students(self):
        """Test getting all students"""
        success, response = self.run_test(
            "Get All Students",
            "GET",
            "students",
            200
        )
        return success

    def test_get_student_by_id(self, student_id):
        """Test getting student by ID"""
        success, response = self.run_test(
            "Get Student by ID",
            "GET",
            f"students/{student_id}",
            200
        )
        return success

    def test_update_student(self, student_id):
        """Test updating student"""
        update_data = {
            "name": "Updated Test Student",
            "age": 21
        }
        success, response = self.run_test(
            "Update Student",
            "PUT",
            f"students/{student_id}",
            200,
            data=update_data
        )
        return success

    def test_analytics_overview(self):
        """Test analytics overview"""
        success, response = self.run_test(
            "Analytics Overview",
            "GET",
            "analytics/overview",
            200
        )
        return success

    def test_coding_task_generation(self):
        """Test coding task generation"""
        success, response = self.run_test(
            "Generate Coding Task",
            "POST",
            "tasks/coding/generate",
            200,
            data={"level": "Beginner"}
        )
        if success and 'code_snippet' in response:
            return True, response
        return False, {}

    def test_coding_task_validation(self, original_code):
        """Test coding task validation"""
        success, response = self.run_test(
            "Validate Coding Task",
            "POST",
            "tasks/coding/validate",
            200,
            data={
                "level": "Beginner",
                "original_code": original_code,
                "submitted_code": "print('Hello World')"
            }
        )
        return success

    def test_mcq_generation(self):
        """Test MCQ generation"""
        success, response = self.run_test(
            "Generate MCQ Questions",
            "POST",
            "tasks/mcq/generate",
            200,
            data={"level": "Beginner"}
        )
        if success and 'questions' in response:
            return True, response
        return False, {}

    def test_mcq_validation(self):
        """Test MCQ validation"""
        success, response = self.run_test(
            "Validate MCQ Answer",
            "POST",
            "tasks/mcq/validate",
            200,
            data={
                "question": "What is Python?",
                "selected_answer": "A",
                "correct_answer": "A"
            }
        )
        return success

    def test_task_submission(self, student_id):
        """Test task submission"""
        success, response = self.run_test(
            "Submit Task",
            "POST",
            "tasks/submit",
            200,
            data={
                "student_id": student_id,
                "task_type": "coding",
                "level": "Beginner",
                "question": "Test question",
                "submitted_answer": "Test answer",
                "is_correct": True,
                "error_explanation": None,
                "time_taken": 120
            }
        )
        return success

    def test_get_student_tasks(self, student_id):
        """Test getting student tasks"""
        success, response = self.run_test(
            "Get Student Tasks",
            "GET",
            f"tasks/student/{student_id}",
            200
        )
        return success

    def test_delete_student(self, student_id):
        """Test deleting student"""
        success, response = self.run_test(
            "Delete Student",
            "DELETE",
            f"students/{student_id}",
            200
        )
        return success

def main():
    print("🚀 Starting ACET API Testing...")
    print("=" * 50)
    
    tester = ACETAPITester()
    
    # Test admin authentication
    print("\n📋 Testing Admin Authentication...")
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1

    # Test student authentication  
    print("\n👨‍🎓 Testing Student Authentication...")
    if not tester.test_student_login():
        print("❌ Student login failed, but continuing with other tests")

    # Test student management
    print("\n👥 Testing Student Management...")
    tester.test_get_students()
    
    success, student_id = tester.test_create_student()
    if success and student_id:
        tester.test_get_student_by_id(student_id)
        tester.test_update_student(student_id)
        
        # Test task functionality with created student
        print("\n📝 Testing Task Management...")
        tester.test_task_submission(student_id)
        tester.test_get_student_tasks(student_id)
        
        # Clean up - delete test student
        tester.test_delete_student(student_id)

    # Test analytics
    print("\n📊 Testing Analytics...")
    tester.test_analytics_overview()

    # Test AI-powered features
    print("\n🤖 Testing AI Features...")
    coding_success, coding_task = tester.test_coding_task_generation()
    if coding_success:
        tester.test_coding_task_validation(coding_task.get('code_snippet', ''))
    
    mcq_success, mcq_data = tester.test_mcq_generation()
    if mcq_success:
        tester.test_mcq_validation()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failed in tester.failed_tests:
            print(f"  - {failed['test']}: {failed['error']}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"✅ Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())