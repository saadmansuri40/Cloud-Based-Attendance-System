export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isFirstLogin?: boolean;
  profilePicture?: string; // Data URL or URL
}

export interface AdminNotification {
  id: string;
  type: 'password_reset' | 'profile_change';
  userId: string;
  userName: string;
  userEmail: string;
  enrollmentNo?: string;
  message: string;
  requestedData?: {
    name?: string;
    [key: string]: any;
  };
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface Student extends User {
  faceImage?: string;
  faceId?: string;
  isFirstLogin: boolean;
  enrollmentNo?: string;   // e.g. 22CSE0001
  course?: string;         // e.g. CSE, ECE, MECH
  joinYear?: number;       // e.g. 2022
}

export interface AttendanceRecord {
  date: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent';
  timestamp: string;
}

export interface TimetableEntry {
  time: string;
  subject: string;
  location: string;
}

export interface Timetable {
  [day: string]: TimetableEntry[];
}

export interface MarkRecord {
  semester: string;
  subject: string;
  marks: number;
  grade: string;
  credits: number;
}

export interface FeeRecord {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentDate: string | null;
}

export interface LibraryBook {
  id: string;
  title: string;
  confirmDate: string;
  returnDate: string;
  status: 'Borrowed' | 'Returned';
}

export interface StudentDetails {
  id: string;
  program: string;
  batch: string;
  semester: number;
  cgpa: number;
  attendance_percentage: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  sections: string[];
  dueDate: string;
  postedBy: string;
  postedAt: string;
  attachmentName?: string;
  attachmentData?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  submittedAt: string;      // ISO timestamp
  fileName: string;         // e.g. "solution.pdf"
  fileData: string;         // base64 data URL
  status?: 'pending' | 'approved';
}
