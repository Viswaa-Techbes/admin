// ─── DATA ────────────────────────────────────────────────────────────────────

export const TREND_DATA = [
  { day: "Mon", requests: 18, completed: 14 },
  { day: "Tue", requests: 26, completed: 19 },
  { day: "Wed", requests: 22, completed: 17 },
  { day: "Thu", requests: 34, completed: 28 },
  { day: "Fri", requests: 29, completed: 23 },
  { day: "Sat", requests: 41, completed: 35 },
  { day: "Sun", requests: 15, completed: 12 },
];

export const MONTHLY_TREND = [
  { month: "Jan", requests: 120, completed: 98, revenue: 142000 },
  { month: "Feb", requests: 145, completed: 118, revenue: 168000 },
  { month: "Mar", requests: 132, completed: 109, revenue: 155000 },
  { month: "Apr", requests: 168, completed: 141, revenue: 198000 },
  { month: "May", requests: 155, completed: 130, revenue: 182000 },
  { month: "Jun", requests: 189, completed: 158, revenue: 221000 },
  { month: "Jul", requests: 201, completed: 172, revenue: 248000 },
  { month: "Aug", requests: 178, completed: 150, revenue: 209000 },
  { month: "Sep", requests: 215, completed: 188, revenue: 267000 },
  { month: "Oct", requests: 234, completed: 198, revenue: 289000 },
  { month: "Nov", requests: 220, completed: 192, revenue: 271000 },
  { month: "Dec", requests: 248, completed: 210, revenue: 312000 },
];

export const SERVICE_DIST = [
  { name: "CCTV Installation", value: 32, color: "#6366f1" },
  { name: "Laptop Repair", value: 28, color: "#06b6d4" },
  { name: "Desktop Service", value: 18, color: "#f59e0b" },
  { name: "Networking Setup", value: 14, color: "#10b981" },
  { name: "AMC Maintenance", value: 8, color: "#f43f5e" },
];

export const TECH_PERF = [
  { name: "Arjun M.", completed: 42, inProgress: 3, rating: 4.8 },
  { name: "Suresh K.", completed: 38, inProgress: 2, rating: 4.6 },
  { name: "Vikram R.", completed: 35, inProgress: 4, rating: 4.7 },
  { name: "Deepa T.", completed: 29, inProgress: 2, rating: 4.5 },
  { name: "Manoj P.", completed: 24, inProgress: 1, rating: 4.3 },
  { name: "Preethi S.", completed: 31, inProgress: 3, rating: 4.9 },
];

export const JOBS = [
  { id: "TBS-1042", customer: "Ravi Kumar", service: "CCTV Installation", tech: "Arjun M.", status: "In Progress", date: "09 Mar 2026", location: "Koramangala, BLR" },
  { id: "TBS-1041", customer: "Priya Nair", service: "Laptop Repair", tech: "Suresh K.", status: "Completed", date: "09 Mar 2026", location: "Indiranagar, BLR" },
  { id: "TBS-1040", customer: "Dinesh Patel", service: "Networking Setup", tech: "—", status: "Pending", date: "08 Mar 2026", location: "HSR Layout, BLR" },
  { id: "TBS-1039", customer: "Ananya Sharma", service: "AMC Maintenance", tech: "Vikram R.", status: "Assigned", date: "08 Mar 2026", location: "Whitefield, BLR" },
  { id: "TBS-1038", customer: "Sanjay Mehta", service: "Desktop Service", tech: "Arjun M.", status: "Completed", date: "07 Mar 2026", location: "BTM Layout, BLR" },
  { id: "TBS-1037", customer: "Lakshmi Rao", service: "CCTV Installation", tech: "—", status: "Cancelled", date: "07 Mar 2026", location: "Jayanagar, BLR" },
  { id: "TBS-1036", customer: "Harish Iyer", service: "Laptop Repair", tech: "Suresh K.", status: "In Progress", date: "06 Mar 2026", location: "Electronic City, BLR" },
  { id: "TBS-1035", customer: "Meena Krishnan", service: "Networking Setup", tech: "Preethi S.", status: "Assigned", date: "06 Mar 2026", location: "Marathahalli, BLR" },
];

export const CUSTOMERS = [
  { name: "Ravi Kumar", phone: "+91 98765 43210", email: "ravi.kumar@email.com", address: "Koramangala, Bangalore", totalServices: 5, lastService: "09 Mar 2026", status: "Active" },
  { name: "Priya Nair", phone: "+91 87654 32109", email: "priya.nair@email.com", address: "Indiranagar, Bangalore", totalServices: 3, lastService: "09 Mar 2026", status: "Active" },
  { name: "Dinesh Patel", phone: "+91 76543 21098", email: "dinesh.p@email.com", address: "HSR Layout, Bangalore", totalServices: 7, lastService: "08 Mar 2026", status: "Active" },
  { name: "Ananya Sharma", phone: "+91 65432 10987", email: "ananya.s@email.com", address: "Whitefield, Bangalore", totalServices: 2, lastService: "08 Mar 2026", status: "Active" },
  { name: "Sanjay Mehta", phone: "+91 54321 09876", email: "sanjay.m@email.com", address: "BTM Layout, Bangalore", totalServices: 9, lastService: "07 Mar 2026", status: "VIP" },
  { name: "Lakshmi Rao", phone: "+91 43210 98765", email: "lakshmi.r@email.com", address: "Jayanagar, Bangalore", totalServices: 1, lastService: "07 Mar 2026", status: "Inactive" },
];

export const TECHNICIANS = [
  { name: "Arjun Menon", phone: "+91 98001 11234", specialization: "CCTV Installation", status: "On Job", assignedJobs: 3, rating: 4.8, experience: "5 yrs", avatar: "AM" },
  { name: "Suresh Kumar", phone: "+91 97001 22345", specialization: "Laptop / Desktop", status: "On Job", assignedJobs: 2, rating: 4.6, experience: "4 yrs", avatar: "SK" },
  { name: "Vikram Reddy", phone: "+91 96001 33456", specialization: "Networking", status: "Available", assignedJobs: 0, rating: 4.7, experience: "6 yrs", avatar: "VR" },
  { name: "Deepa Thomas", phone: "+91 95001 44567", specialization: "AMC Maintenance", status: "Available", assignedJobs: 0, rating: 4.5, experience: "3 yrs", avatar: "DT" },
  { name: "Manoj Pillai", phone: "+91 94001 55678", specialization: "CCTV Installation", status: "Offline", assignedJobs: 0, rating: 4.3, experience: "2 yrs", avatar: "MP" },
  { name: "Preethi Srinivas", phone: "+91 93001 66789", specialization: "Networking", status: "On Job", assignedJobs: 3, rating: 4.9, experience: "7 yrs", avatar: "PS" },
];

export const PAYMENTS = [
  { id: "PAY-8821", customer: "Priya Nair", service: "Laptop Repair", amount: 2800, method: "UPI", status: "Paid", date: "09 Mar 2026" },
  { id: "PAY-8820", customer: "Sanjay Mehta", service: "Desktop Service", amount: 1500, method: "Card", status: "Paid", date: "07 Mar 2026" },
  { id: "PAY-8819", customer: "Harish Iyer", service: "Laptop Repair", amount: 3200, method: "Cash", status: "Pending", date: "06 Mar 2026" },
  { id: "PAY-8818", customer: "Meena Krishnan", service: "Networking Setup", amount: 8500, method: "Bank Transfer", status: "Paid", date: "06 Mar 2026" },
  { id: "PAY-8817", customer: "Ravi Kumar", service: "CCTV Installation", amount: 24000, method: "UPI", status: "Partial", date: "05 Mar 2026" },
  { id: "PAY-8816", customer: "Ananya Sharma", service: "AMC Maintenance", amount: 12000, method: "Card", status: "Paid", date: "05 Mar 2026" },
];

export const ACTIVITIES = [
  { type: "job_created", msg: "New job TBS-1042 created", sub: "Ravi Kumar • CCTV Installation", time: "2 min ago", color: "#6366f1", icon: "📋" },
  { type: "assigned", msg: "Arjun M. assigned to TBS-1042", sub: "CCTV Installation • Koramangala", time: "3 min ago", color: "#06b6d4", icon: "👷" },
  { type: "completed", msg: "TBS-1041 marked as completed", sub: "Priya Nair • Laptop Repair", time: "28 min ago", color: "#10b981", icon: "✅" },
  { type: "payment", msg: "Payment ₹2,800 received", sub: "Priya Nair • PAY-8821", time: "31 min ago", color: "#f59e0b", icon: "💳" },
  { type: "cancelled", msg: "TBS-1037 cancelled by customer", sub: "Lakshmi Rao • CCTV Installation", time: "1 hr ago", color: "#f43f5e", icon: "❌" },
  { type: "new_customer", msg: "New customer registered", sub: "Harish Iyer • Electronic City", time: "2 hrs ago", color: "#8b5cf6", icon: "👤" },
  { type: "payment", msg: "Payment ₹8,500 received", sub: "Meena Krishnan • PAY-8818", time: "3 hrs ago", color: "#f59e0b", icon: "💳" },
];

export const TRACKING_TECHS = [
  { name: "Arjun M.", job: "TBS-1042", location: "Koramangala", eta: "En route • 8 min", status: "On Job", avatar: "AM", lat: 12.935, lng: 77.624 },
  { name: "Suresh K.", job: "TBS-1036", location: "Electronic City", eta: "On-site", status: "On Job", avatar: "SK", lat: 12.839, lng: 77.677 },
  { name: "Vikram R.", job: "—", location: "Whitefield", eta: "Available", status: "Available", avatar: "VR", lat: 12.966, lng: 77.750 },
  { name: "Preethi S.", job: "TBS-1035", location: "Marathahalli", eta: "On-site", status: "On Job", avatar: "PS", lat: 12.956, lng: 77.700 },
];

export const NOTIFICATIONS = [
  { title: "New service request assigned", desc: "TBS-1042 assigned to Arjun Menon", time: "2 min ago", read: false, type: "info" },
  { title: "Job completed", desc: "TBS-1041 marked completed by Suresh Kumar", time: "28 min ago", read: false, type: "success" },
  { title: "Payment received", desc: "₹2,800 from Priya Nair for TBS-1041", time: "31 min ago", read: false, type: "payment" },
  { title: "Customer cancellation", desc: "TBS-1037 cancelled by Lakshmi Rao", time: "1 hr ago", read: true, type: "warning" },
  { title: "Technician offline", desc: "Manoj Pillai went offline", time: "2 hrs ago", read: true, type: "warning" },
  { title: "New customer registered", desc: "Harish Iyer from Electronic City", time: "2 hrs ago", read: true, type: "info" },
  { title: "AMC renewal due", desc: "3 AMC contracts expiring this week", time: "5 hrs ago", read: true, type: "alert" },
];

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const STATUS_BADGE = {
  "Pending": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", dot: "#f59e0b" },
  "Pending Approval": { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6", dot: "#8b5cf6" },
  "Approval Pending": { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6", dot: "#8b5cf6" },
  "Assigned": { bg: "rgba(99,102,241,0.12)", color: "#818cf8", dot: "#6366f1" },
  "Started": { bg: "rgba(6,182,212,0.12)", color: "#06b6d4", dot: "#06b6d4" },
  "Approved by Manager": { bg: "rgba(16,185,129,0.12)", color: "#10b981", dot: "#10b981" },
  "Completion Requested": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", dot: "#f59e0b" },
  "Payment Done": { bg: "rgba(16,185,129,0.12)", color: "#10b981", dot: "#10b981" },
  "Work Uploaded": { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6", dot: "#8b5cf6" },
  "Approved (Pending Payment)": { bg: "rgba(16,185,129,0.12)", color: "#10b981", dot: "#10b981" },
  "In Progress": { bg: "rgba(6,182,212,0.12)", color: "#06b6d4", dot: "#06b6d4" },
  "Completed": { bg: "rgba(16,185,129,0.12)", color: "#10b981", dot: "#10b981" },
  "Cancelled": { bg: "rgba(244,63,94,0.12)", color: "#f43f5e", dot: "#f43f5e" },
  "Paid": { bg: "rgba(16,185,129,0.12)", color: "#10b981", dot: "#10b981" },
  "Payment Pending": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", dot: "#f59e0b" },
  "Partial": { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", dot: "#f59e0b" },
  "Active": { bg: "rgba(16,185,129,0.12)", color: "#10b981", dot: "#10b981" },
  "Available": { bg: "rgba(16,185,129,0.12)", color: "#10b981", dot: "#10b981" },
  "Offline": { bg: "rgba(100,116,139,0.12)", color: "#64748b", dot: "#64748b" },
};
