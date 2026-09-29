export type CanvasInstance = "digitalcampus" | "kenan-flagler";

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id?: number;
  instance: CanvasInstance;
  workflow_state: string;
  term?: {
    name: string;
  };
  syllabus_body?: string;
}

export interface CanvasSubmission {
  id: number;
  workflow_state: "submitted" | "unsubmitted" | "graded" | "pending_review";
  submitted_at?: string | null;
  score?: number | null;
  grade?: string | null;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string | null;
  unlock_at?: string | null;
  lock_at?: string | null;
  points_possible: number;
  submission_types: string[];
  has_submitted_submissions?: boolean;
  assignment_group_id?: number;
  html_url: string;
  course_id: number;
  submission?: CanvasSubmission;
}

export interface CanvasModuleItem {
  id: number;
  module_id: number;
  title: string;
  type:
    | "File"
    | "Page"
    | "Discussion"
    | "Assignment"
    | "Quiz"
    | "SubHeader"
    | "ExternalUrl"
    | "ExternalTool";
  html_url: string;
  url?: string;
  page_url?: string;
  external_url?: string;
  content_id?: number;
  completion_requirement?: {
    type?: string;
    completed?: boolean;
    min_score?: number;
  };
}

export interface CanvasModule {
  id: number;
  name: string;
  position: number;
  unlock_at?: string | null;
  require_sequential_progress?: boolean;
  items_count: number;
  items?: CanvasModuleItem[];
}

export interface CanvasFolder {
  id: number;
  name: string;
  full_name: string;
  parent_folder_id?: number | null;
  files_count: number;
  folders_count: number;
}

export interface CanvasFile {
  id: number;
  folder_id: number;
  display_name: string;
  filename: string;
  url: string;
  size: number;
  "content-type"?: string;
  created_at: string;
  updated_at: string;
}

export interface CanvasAnnouncement {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  author: {
    display_name: string;
    avatar_image_url?: string;
  };
  html_url: string;
  url?: string;
}

export interface CanvasCalendarEvent {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  description: string;
  context_code: string;
  context_name?: string;
  effective_context_code?: string;
  course_id?: number;
  location_name?: string;
  location_address?: string;
  html_url: string;
  url?: string;
}

// Normalized Hub Models
export type ReadingCategory =
  | "case"
  | "reading"
  | "slides"
  | "spreadsheet"
  | "syllabus"
  | "video";

export interface NormalizedReading {
  id: string;
  title: string;
  source: "files_tab" | "module_item" | "announcement";
  category: ReadingCategory;
  fileUrl?: string;
  canvasUrl: string;
  fileName?: string;
  fileSizeFormatted?: string;
  folderPath?: string;
  isCompleted: boolean;
  courseCode?: string;
  courseName?: string;
  pointsPossible?: number;
  type?: string;
  courseId?: number;
  moduleId?: number;
  moduleItemId?: number;
  instance?: CanvasInstance;
  completionRequirementType?: string;
}

export type DeliverableStatus =
  | "submitted"
  | "graded"
  | "upcoming"
  | "overdue"
  | "unsubmitted";

export interface NormalizedDeliverable {
  id: string;
  assignmentId: number;
  title: string;
  courseId: number;
  courseName: string;
  courseCode: string;
  instance: CanvasInstance;
  dueAt: string | null;
  pointsPossible: number;
  status: DeliverableStatus;
  score?: number | null;
  grade?: string | null;
  canvasUrl: string;
  submissionTypes: string[];
  dueInDays?: number;
  dueInHours?: number;
  isCompleted?: boolean;
}

export interface NormalizedLiveSession {
  id: string;
  title: string;
  courseName: string;
  courseCode: string;
  startAt: string;
  endAt: string;
  zoomUrl?: string;
  location?: string;
  canvasUrl: string;
}

export interface NormalizedAnnouncement {
  id: string;
  title: string;
  message: string;
  postedAt: string;
  authorName: string;
  canvasUrl: string;
  zoomUrl?: string;
  weekNumber?: number | null;
}

export interface WeeklyBundle {
  weekNumber: number;
  weekLabel: string;
  courseId: number;
  courseName: string;
  courseCode: string;
  instance: CanvasInstance;
  startDate?: string;
  endDate?: string;
  announcements: NormalizedAnnouncement[];
  readings: NormalizedReading[];
  deliverables: NormalizedDeliverable[];
  termDeliverables?: NormalizedDeliverable[];
  liveSessions: NormalizedLiveSession[];
  stats: {
    totalDeliverables: number;
    submittedCount: number;
    totalReadings: number;
    completedReadingsCount: number;
  };
}

export interface StudentAuthTokens {
  digitalCampusToken: string;
  kenanFlaglerToken: string;
}
