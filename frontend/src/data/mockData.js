export const initialDeals = [
  {
    id: "deal-1",
    title: "E-Commerce System Overhaul",
    company: "Apex Retailers Ltd",
    contactName: "Tariq Mahmood",
    value: 8500,
    stage: "Lead In",
    priority: "High",
    tags: ["Development", "High Value"],
    dueDate: "2026-10-24"
  },
  {
    id: "deal-2",
    title: "Mobile App Contract (iOS & Android)",
    company: "Digital Studio Corp",
    contactName: "Sarah Jenkins",
    value: 4200,
    stage: "Lead In",
    priority: "Medium",
    tags: ["Mobile"],
    dueDate: "2026-10-29"
  },
  {
    id: "deal-3",
    title: "Cloud Infrastructure Setup",
    company: "FinScale Dynamics",
    contactName: "Kamran Ali",
    value: 12400,
    stage: "Contacted",
    priority: "High",
    tags: ["Cloud", "DevOps"],
    dueDate: "2026-11-02"
  },
  {
    id: "deal-4",
    title: "Corporate Branding & Web UI",
    company: "Lumina Lifestyle",
    contactName: "Zainab Fatima",
    value: 3100,
    stage: "Contacted",
    priority: "Low",
    tags: ["UI/UX"],
    dueDate: "2026-11-05"
  },
  {
    id: "deal-5",
    title: "Custom CRM Enterprise License",
    company: "Nexus Logistics Group",
    contactName: "Bilal Farooq",
    value: 18500,
    stage: "Proposal Sent",
    priority: "High",
    tags: ["Enterprise", "SaaS"],
    dueDate: "2026-10-18"
  },
  {
    id: "deal-6",
    title: "Automated WhatsApp API Pipeline",
    company: "Swift Deliveries",
    contactName: "Hamza Riaz",
    value: 2900,
    stage: "Proposal Sent",
    priority: "Medium",
    tags: ["API", "Integration"],
    dueDate: "2026-10-20"
  },
  {
    id: "deal-7",
    title: "Pharmacy ERP Web Portal",
    company: "Al-Shifa Healthcare",
    contactName: "Dr. Asim Qureshi",
    value: 9400,
    stage: "Won",
    priority: "High",
    tags: ["Healthcare", "Closed"],
    dueDate: "2026-10-12"
  },
  {
    id: "deal-8",
    title: "Real Estate Booking Platform",
    company: "PineCrest Properties",
    contactName: "Usman Ghani",
    value: 6800,
    stage: "Won",
    priority: "Medium",
    tags: ["Real Estate"],
    dueDate: "2026-10-10"
  }
];

export const pipelineStages = [
  { id: "Lead In", name: "Lead In", color: "border-sky-500", badge: "bg-sky-500/10 text-sky-400" },
  { id: "Contacted", name: "Contacted", color: "border-amber-500", badge: "bg-amber-500/10 text-amber-400" },
  { id: "Proposal Sent", name: "Proposal Sent", color: "border-purple-500", badge: "bg-purple-500/10 text-purple-400" },
  { id: "Won", name: "Won / Closed", color: "border-emerald-500", badge: "bg-emerald-500/10 text-emerald-400" }
];

export const initialTasks = [
  {
    id: "task-1",
    title: "Send revised proposal quotation to Nexus Logistics",
    assignedTo: "Abdur Rafay",
    relatedDeal: "Custom CRM Enterprise License",
    dueDate: "2026-10-15",
    priority: "High",
    completed: false,
    category: "Proposal"
  },
  {
    id: "task-2",
    title: "Discovery call with Sarah regarding Mobile App specs",
    assignedTo: "Abdur Rafay",
    relatedDeal: "Mobile App Contract",
    dueDate: "2026-10-16",
    priority: "Medium",
    completed: false,
    category: "Call"
  },
  {
    id: "task-3",
    title: "Finalize invoice & contract sign-off with Dr. Asim",
    assignedTo: "Abdur Rafay",
    relatedDeal: "Pharmacy ERP Web Portal",
    dueDate: "2026-10-14",
    priority: "High",
    completed: true,
    category: "Billing"
  },
  {
    id: "task-4",
    title: "Schedule technical demo with FinScale DevOps team",
    assignedTo: "Abdur Rafay",
    relatedDeal: "Cloud Infrastructure Setup",
    dueDate: "2026-10-18",
    priority: "Medium",
    completed: false,
    category: "Demo"
  },
  {
    id: "task-5",
    title: "Prepare architecture presentation deck for review",
    assignedTo: "Abdur Rafay",
    relatedDeal: "Internal Review",
    dueDate: "2026-10-14",
    priority: "Low",
    completed: true,
    category: "Internal"
  }
];

export const initialCalendarEvents = [
  {
    id: "ev-1",
    title: "Demo Call: Apex Retailers",
    date: "2026-10-14",
    time: "10:30 AM - 11:30 AM",
    type: "Client Call",
    color: "bg-sky-500/20 text-sky-300 border-sky-500/40"
  },
  {
    id: "ev-2",
    title: "Team Sync: CRM Project Review",
    date: "2026-10-15",
    time: "07:00 PM - 08:00 PM",
    type: "Internal Meeting",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/40"
  },
  {
    id: "ev-3",
    title: "Proposal Pitch: Nexus Logistics",
    date: "2026-10-17",
    time: "02:00 PM - 03:00 PM",
    type: "Presentation",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
  },
  {
    id: "ev-4",
    title: "Contract Review: FinScale",
    date: "2026-10-21",
    time: "04:30 PM - 05:30 PM",
    type: "Legal/Closing",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/40"
  }
];
