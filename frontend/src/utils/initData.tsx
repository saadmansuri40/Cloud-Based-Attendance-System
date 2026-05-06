import { User, Student, Assignment } from '../types';

// ── Dummy users ───────────────────────────────────────────────────────────────
const dummyUsers: (User | Student)[] = [
  {
    id: 'admin1',
    name: 'System Admin',
    email: 'admin@system.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '1',
    name: 'John Smith',
    email: 'john@teacher.com',
    password: 'teacher123',
    role: 'teacher',
  },
  {
    id: '2',
    name: 'Alice Johnson',
    email: 'alice@student.com',
    password: 'student123',
    role: 'student',
    isFirstLogin: true,
    enrollmentNo: '22CSE0001',
    course: 'CSE',
    joinYear: 2022,
  } as Student,
];

// ── Demo assignments ───────────────────────────────────────────────────────────
const dummyAssignments: Assignment[] = [
  {
    id: 'demo-a1',
    title: 'Linked List Implementation in C',
    description:
      'Implement a singly linked list with the following operations:\n' +
      '1. Insert at head\n2. Insert at tail\n3. Delete by value\n4. Reverse the list\n5. Print all nodes\n\n' +
      'Submit a single .c file or a PDF report with your code and output screenshots.\n' +
      'Use proper comments and variable names.',
    subject: 'Data Structures & Algorithms',
    sections: ['CSE', 'IT'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    postedBy: 'John Smith',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // posted 2 days ago
  },
  {
    id: 'demo-a2',
    title: 'Calculus — Integration Practice Sheet',
    description:
      'Solve the 20 integration problems in the attached PDF.\n' +
      'Show all working steps clearly. Final answers only will NOT be accepted.\n\n' +
      'Submission: Handwritten scan or typed PDF.',
    subject: 'Mathematics',
    sections: ['CSE', 'ECE', 'IT', 'EE'],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    postedBy: 'John Smith',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // posted 1 day ago
  },
  {
    id: 'demo-a3',
    title: 'OS Process Scheduling Report',
    description:
      'Write a detailed report (min. 8 pages) on the following scheduling algorithms:\n' +
      '• FCFS  • SJF (non-preemptive)  • Round Robin (RR)  • Priority Scheduling\n\n' +
      'Include: definition, Gantt chart example, advantages, disadvantages, and use-cases.\n' +
      'Format: IEEE double-column PDF.',
    subject: 'Operating Systems',
    sections: ['CSE'],
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day overdue
    postedBy: 'John Smith',
    postedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Init ───────────────────────────────────────────────────────────────────────
export const initializeLocalStorage = () => {
  const isInitialized = localStorage.getItem('appInitialized');
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const demoStudent = users.find((u: any) => u.email === 'alice@student.com');
  const adminUser = users.find((u: any) => u.email === 'admin@system.com');
  const needsReseed = !isInitialized || (demoStudent && !demoStudent.enrollmentNo) || !adminUser;

  if (needsReseed) {
    localStorage.clear();
    localStorage.setItem('users', JSON.stringify(dummyUsers));
    localStorage.setItem('attendanceRecords', JSON.stringify([]));
    localStorage.setItem('attendanceStatus', 'inactive');
    localStorage.setItem('assignments', JSON.stringify(dummyAssignments));
    localStorage.setItem('submissions', JSON.stringify([]));
    localStorage.setItem('adminNotifications', JSON.stringify([]));
    localStorage.setItem('appInitialized', 'true');
    console.log('Local storage initialized with dummy data + demo assignments.');
  } else {
    // Ensure assignments key always exists even for old sessions
    if (!localStorage.getItem('assignments')) {
      localStorage.setItem('assignments', JSON.stringify(dummyAssignments));
    }
    if (!localStorage.getItem('submissions')) {
      localStorage.setItem('submissions', JSON.stringify([]));
    }
  }
};