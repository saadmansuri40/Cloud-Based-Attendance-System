import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, StudentDetails, AdminNotification } from '../types';
import Camera from './Camera';
import BlinkCamera from './BlinkCamera';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import TimeTable from './Academics/TimeTable';
import Marks from './Academics/Marks';
import AttendanceCharts from './Academics/AttendanceCharts';
import HallTicket from './Academics/HallTicket';
import Fees from './Admin/Fees';
import Library from './Resources/Library';
import StudentAssignments from './Assignments/StudentAssignments';
import Careers from './Careers';
import { UserCircle, Menu, CheckCircle, AlertCircle } from 'lucide-react';
import { verifyFaceFromImage, registerStudentFace } from '../utils/faceApi';
import AvatarPicker, { getAvatar } from './AvatarPicker';

interface StudentDashboardProps {
  student: Student;
  onLogout: () => void;
}

export default function StudentDashboard({ student, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [dpUrl, setDpUrl] = useState<string | null>(getAvatar(student.id));

  // Editable display name
  const [displayName] = useState(student.name);
  const [nameEdit, setNameEdit] = useState(false);
  const [nameInput, setNameInput] = useState(student.name);

  // Attendance states
  const [isAttendanceActive, setIsAttendanceActive] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [showCamera, setShowCamera] = useState(false);

  // Load student details
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/student/${student.id}/details`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setStudentDetails(data); })
      .catch(err => console.warn("Student details endpoint not available", err));
  }, [student.id]);

  // Load attendance records
  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    setAttendanceRecords(records.filter((record: AttendanceRecord) => record.studentId === student.id));
  }, [student.id]);

  // Check attendance status
  useEffect(() => {
    const checkAttendanceStatus = () => {
      const status = localStorage.getItem('attendanceStatus');
      setIsAttendanceActive(status === 'active');
    };
    window.addEventListener('storage', checkAttendanceStatus);
    checkAttendanceStatus();
    return () => window.removeEventListener('storage', checkAttendanceStatus);
  }, []);

  const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Request name change approval from admin
  const requestNameChange = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === displayName) { setNameEdit(false); return; }

    // Create approval notification for admin
    const notifications: AdminNotification[] = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    const newRequest: AdminNotification = {
      id: crypto.randomUUID(),
      type: 'profile_change',
      userId: student.id,
      userName: student.name,
      userEmail: student.email,
      enrollmentNo: student.enrollmentNo,
      message: `User ${student.name} requested to change name to ${trimmed}`,
      requestedData: { name: trimmed },
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('adminNotifications', JSON.stringify([...notifications, newRequest]));

    alert("Name change request sent to admin for approval.");
    setNameEdit(false);
    setNameInput(displayName);
  };

  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    showMessage("Processing… this may take up to 30s on first use.", 'info');
    setShowCamera(false); // Hide camera while processing

    try {
      if (student.isFirstLogin) {
        // Registration Flow
        console.log("Registering face...");

        // Use the new register endpoint
        const regResult = await registerStudentFace(student.id, imageData);

        if (regResult.success && regResult.faceId) {
          const updatedStudent = {
            ...student,
            faceImage: imageData,
            faceId: regResult.faceId,
            isFirstLogin: false,
          };

          // Update BOTH users array AND currentUser so reload shows the dashboard
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const updatedUsers = users.map((u: Student) =>
            u.id === student.id ? updatedStudent : u
          );
          localStorage.setItem('users', JSON.stringify(updatedUsers));
          localStorage.setItem('currentUser', JSON.stringify(updatedStudent));

          showMessage("Face registered successfully! You can now mark attendance.", 'success');
          window.location.reload();
        } else {
          throw new Error(regResult.message || "Registration failed");
        }

      } else {
        // Attendance Flow
        if (!isAttendanceActive) {
          showMessage("Attendance is not currently active.", 'error');
          setIsProcessing(false);
          return;
        }

        // Single call: detect + verify (backend uses cached embedding for speed)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentStudent = users.find((u: Student) => u.id === student.id);

        if (!currentStudent || !currentStudent.faceId) {
          throw new Error("Registration data missing. Please contact admin.");
        }

        const result = await verifyFaceFromImage(currentStudent.faceId, imageData, student.id);

        if (result.success && result.isPresent) {
          const newRecord: AttendanceRecord = {
            date: new Date().toLocaleDateString(),
            studentId: student.id,
            studentName: student.name,
            status: 'present',
            timestamp: new Date().toISOString(),
          };

          const allRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
          // Check if already marked today
          const alreadyMarked = allRecords.some((r: AttendanceRecord) =>
            r.studentId === student.id && r.date === newRecord.date
          );

          if (alreadyMarked) {
            showMessage("Attendance already marked for today.", 'info');
          } else {
            const updatedRecords = [...allRecords, newRecord];
            localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
            setAttendanceRecords(updatedRecords.filter((r: AttendanceRecord) => r.studentId === student.id));
            showMessage("Attendance marked successfully!", 'success');
          }
        } else {
          showMessage(result.message || "Face verification failed. Please try again.", 'error');
        }
      }
    } catch (error) {
      console.error(error);
      showMessage(error instanceof Error ? error.message : "An error occurred", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render Attendance Content (kept from original for the 'attendance' tab)
  const renderAttendanceContent = () => (
    <div className="space-y-8">
      {/* Mark Attendance Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Mark Attendance</h3>
        </div>
        <div className="p-8 text-center bg-gray-50">
          {!isAttendanceActive ? (
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Attendance Inactive</h4>
              <p className="text-gray-500">Wait for your teacher to start the attendance session.</p>
            </div>
          ) : showCamera ? (
            /* ── Blink-to-verify camera ── */
            <div className="max-w-lg mx-auto space-y-3">
              {/* Instruction card above camera */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex items-start gap-3">
                <span className="text-2xl mt-0.5">👁️</span>
                <div>
                  <p className="font-semibold text-indigo-800 text-sm">Liveness Check Required</p>
                  <p className="text-indigo-600 text-xs mt-0.5">
                    Look straight at the camera, then <strong>blink once</strong>. Your attendance will be marked automatically when a blink is detected.
                  </p>
                </div>
              </div>

              {/* Steps */}
              <ol className="flex items-center justify-center gap-6 text-xs text-gray-500 font-medium">
                <li className="flex flex-col items-center gap-1">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">1</span>
                  Face camera
                </li>
                <li className="text-gray-300 text-lg mb-4">→</li>
                <li className="flex flex-col items-center gap-1">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">2</span>
                  Blink eyes
                </li>
                <li className="text-gray-300 text-lg mb-4">→</li>
                <li className="flex flex-col items-center gap-1">
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">3</span>
                  Auto capture
                </li>
              </ol>

              <BlinkCamera
                onBlink={handleCapture}
                onCancel={() => setShowCamera(false)}
              />
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Verifying identity…</p>
              <p className="text-gray-400 text-sm mt-1">This may take up to 30s on the first scan</p>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowCamera(true)}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-medium text-lg flex items-center mx-auto"
              >
                <UserCircle className="w-6 h-6 mr-3" />
                Mark Attendance Now
              </button>
              <p className="mt-4 text-sm text-gray-500">
                Ensure you are in a well-lit environment and facing the camera directly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Attendance Charts ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Attendance Analytics</h3>
        </div>
        <AttendanceCharts records={attendanceRecords} studentId={student.id} />
      </div>

      {/* History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No attendance records found.</td>
                </tr>
              ) : (
                attendanceRecords.slice().reverse().map((record, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome studentName={student.name} studentDetails={studentDetails} />;
      case 'attendance':
        return renderAttendanceContent();
      case 'timetable':
        return <TimeTable studentId={student.id} />;
      case 'marks':
        return (
          <Marks
            studentId={student.id}
            studentName={displayName}
            enrollmentNo={(student as any).enrollmentNo ?? student.id}
            course={(student as any).course ?? 'CSE'}
            joinYear={(student as any).joinYear ?? 2022}
          />
        );
      case 'fees':
        return <Fees studentId={student.id} />;
      case 'assignments':
        return (
          <StudentAssignments
            studentId={student.id}
            studentName={displayName}
            enrollmentNo={(student as any).enrollmentNo ?? student.id}
            studentCourse={(student as any).course ?? 'CSE'}
          />
        );
      case 'hall-ticket':
        return (
          <HallTicket
            studentName={displayName}
            enrollmentNo={(student as any).enrollmentNo ?? student.id}
            course={(student as any).course ?? 'CSE'}
            joinYear={(student as any).joinYear ?? 2022}
            photoUrl={(student as any).avatarUrl ?? null}
          />
        );
      case 'library':
        return <Library studentId={student.id} />;
      case 'careers':
        return <Careers />;
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Profile card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Cover banner */}
              <div className="h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="px-8 pb-8">
                {/* Avatar — overlaps the banner */}
                <div className="-mt-14 mb-4">
                  <AvatarPicker
                    userId={student.id}
                    name={student.name}
                    size="lg"
                    onAvatarChange={url => setDpUrl(url)}
                  />
                </div>

                <div className="mt-2">
                  {nameEdit ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') requestNameChange(); if (e.key === 'Escape') setNameEdit(false); }}
                        className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-400 focus:outline-none bg-transparent w-full max-w-xs"
                      />
                      <button onClick={requestNameChange} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition">Request</button>
                      <button onClick={() => { setNameEdit(false); setNameInput(displayName); }} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                      <button
                        onClick={() => { setNameEdit(true); setNameInput(displayName); }}
                        title="Edit name"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-indigo-600 p-1 rounded"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                  <p className="text-indigo-600 font-medium text-sm mt-0.5">Student</p>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Enrollment Number', value: (student as any).enrollmentNo ?? student.id },
                    { label: 'Course / Branch', value: (student as any).course ?? 'CSE' },
                    { label: 'Email', value: student.email },
                    { label: 'Program', value: studentDetails?.program ?? 'B.Tech Computer Science' },
                    { label: 'Batch', value: studentDetails?.batch ?? `${(student as any).joinYear ?? 2022}–${((student as any).joinYear ?? 2022) + 4}` },
                    { label: 'Semester', value: studentDetails?.semester != null ? `Semester ${studentDetails.semester}` : 'Semester 1' },
                    { label: 'CGPA', value: studentDetails?.cgpa ?? '8.4' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-base font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Password Change Section */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Security</h3>
                  <button
                    onClick={() => {
                      const newPass = prompt("Enter new password:");
                      if (newPass && newPass.length >= 6) {
                        const users = JSON.parse(localStorage.getItem('users') || '[]');
                        const updated = users.map((u: any) => u.id === student.id ? { ...u, password: newPass } : u);
                        localStorage.setItem('users', JSON.stringify(updated));
                        const cur = JSON.parse(localStorage.getItem('currentUser') || '{}');
                        localStorage.setItem('currentUser', JSON.stringify({ ...cur, password: newPass }));
                        alert("Password updated successfully!");
                      } else if (newPass) {
                        alert("Password must be at least 6 characters.");
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <DashboardHome studentName={student.name} studentDetails={studentDetails} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        studentName={displayName}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        avatarUrl={dpUrl}
        role="student"
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        {/* Header (Mobile Only) */}
        <div className="lg:hidden bg-white h-16 shadow-sm border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-indigo-600">Student Portal</span>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Status Messages (Overlay) */}
        {statusMessage && (
          <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4">
            <div className={`p-4 rounded-lg shadow-lg flex items-center border ${statusType === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
              statusType === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
              {statusType === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> :
                statusType === 'error' ? <AlertCircle className="w-5 h-5 mr-3" /> :
                  <AlertCircle className="w-5 h-5 mr-3" />}
              {statusMessage}
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {student.isFirstLogin && (activeTab === 'dashboard' || activeTab === 'attendance') ? (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto text-center mt-10">
              <div className="mb-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome, {student.name}!</h2>
                <p className="text-gray-600 mt-2">To get started, please register your face for the attendance system.</p>
              </div>

              <div className="space-y-6">
                {!showCamera && !isProcessing && (
                  <button
                    onClick={() => setShowCamera(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Start Face Registration
                  </button>
                )}

                {showCamera && (
                  <div className="bg-gray-900 rounded-lg p-1">
                    <Camera onCapture={handleCapture} />
                    <button
                      onClick={() => setShowCamera(false)}
                      className="mt-2 text-white text-sm hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="flex flex-col items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Processing registration...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}
