# Library Management CRM - Developer Documentation

## Overview
This CRM is a highly customized, front-end-heavy application powered entirely by Firebase. It features a robust role-based access control (RBAC) system, real-time analytics, and comprehensive lifecycle management for library students—from admission and attendance to payments and complaints.

## Technology Stack
- **Frontend**: Vanilla HTML5, CSS3 (Custom Variables/Tokens), and ES6 JavaScript.
- **Backend/Database**: Firebase Authentication and Cloud Firestore.
- **Hosting**: Firebase Hosting (intended).
- **Libraries Loaded Dynamically (CDN)**:
  - `jsPDF` & `jsPDF-AutoTable` (PDF Exports)
  - `SheetJS / xlsx` (Excel Exports)
  - `Chart.js` (Live Analytics Charts)

## Folder Structure

```
/
├── index.html                 # Master UI template and logical entry point
├── style.css                  # Global CSS token system and components
├── firebase-entry.js          # Core initializer for all JS modules
├── firestore.rules            # Security rules for production
├── firestore.indexes.json     # Compound indexes for fast querying
├── /admin
├── /manager
├── /employee
├── /student                   # Dashboard shells (propagated from index.html)
│
├── /firebase
│   ├── firebase.js            # Firebase app initialization and SDK imports
│   └── testConnection.js      # Sandbox script for testing reads/writes
│
├── /auth
│   ├── login.js               # Authentication & session creation
│   ├── logout.js              # Session termination
│   ├── guard.js               # Client-side router protecting unauthorized access
│   └── middleware.js          # Client-side module-level role enforcement
│
└── /services
    ├── admissionService.js    # Student onboarding
    ├── attendanceService.js   # Student check-in/out logic
    ├── studentProfile.js      # Admin view of student profiles
    ├── studentPortalUI.js     # Student-facing dashboard logic
    ├── paymentService.js      # Ledger operations
    ├── renewalService.js      # Atomic transactions for memberships
    ├── reportDataEngine.js    # Master analytics generator
    ├── chartService.js        # Dynamic Chart.js injection
    └── exportService.js       # Dynamic SheetJS and jsPDF injection
```

## Security & Access Control
### 1. Client-Side Enforcement
The UI adapts itself dynamically. When a user logs in, their role (`Owner/Admin`, `Manager`, `Employee`, or `Student`) is stored in `localStorage`. 
- `auth/guard.js` ensures unauthenticated users cannot view the dashboards.
- `auth/middleware.js` dynamically hides UI buttons, tabs, and actions based on the stored role (e.g., hiding "Delete Student" from Employees).

### 2. Server-Side Enforcement (Firestore Rules)
Client-side UI hiding is not enough for production. The `firestore.rules` file enforces strict backend security:
- **Students** can only read/write documents where `studentId == request.auth.uid`.
- **Managers** can update profiles and payments, but cannot modify global settings like Membership Plans.
- **Owner/Admin** have unrestricted access.

## Data Lifecycle Example: The Renewal Flow
To understand the architecture, follow the `Renewals` workflow:
1. Admin opens a student profile and clicks **Renew**.
2. `renewalAdminUI.js` calculates the new date and price.
3. Upon submission, `renewalService.js` executes an **atomic Firestore Transaction**:
   - Updates the main `students` document.
   - Logs the historical change in `renewals`.
   - Creates a new approved entry in `payments`.
4. Because the student's `paymentDueDate` was pushed forward, the snapshot listener in `dashboardReminderUI.js` instantly drops the student from the "Overdue" panel without requiring a page refresh.

## Production Deployment Checklist
Before deploying via `firebase deploy`:
1. **Initialize Firebase**: Run `firebase init` and select Hosting and Firestore.
2. **Deploy Rules**: Run `firebase deploy --only firestore:rules` to deploy `firestore.rules`.
3. **Deploy Indexes**: Run `firebase deploy --only firestore:indexes` to deploy `firestore.indexes.json`.
4. **Deploy Application**: Run `firebase deploy --only hosting`.
5. **Security Check**: Open the live site, log in as a Student, and open Chrome DevTools. Attempt to query `collection(db, 'students')` directly. The query should fail with "Missing or insufficient permissions."
