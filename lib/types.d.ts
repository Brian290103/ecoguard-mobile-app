export type ReportStatus =
  | "pending"
  | "received"
  | "verified"
  | "active"
  | "resolved"
  | "assigned"
  | "escalated"
  | "rejected"
  | "closed";

export interface UserProfile {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  latitude: number | null;
  longitude: number | null;
  role: string;
  phone: number | null;
  county: string | null;
  sub_county: string | null;
  job_title: string | null;
  is_approved: boolean | null;
}

export interface Report {
  id: string;
  created_at: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  report_number: string;
  user_id: string;
  image_urls: string[];
  video_urls: string[] | null;
  updated_at: string;
  status: ReportStatus;
}

export interface ReportHistory {
  id: string;
  created_at: string;
  report_id: string;
  user_id: string;
  notes: string;
  status: ReportStatus;
}

export interface Organization {
  id: string;
  created_at: string;
  name: string;
  about: string;
  latitude: number;
  longitude: number;
  updated_at: string;
  logo: string;
  user_id: string;
}

export interface AssignedReport {
  id: string;
  created_at: string;
  report_id: string;
  organization_id: string;
  user_id: string;
  organizations: {
    name: string;
    logo: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export interface OrgRep {
  id: string;
  created_at: string;
  user_id: string;
  org_id: string;
  is_approved: boolean;
  updated_at: string;
}

export interface Community {
  id: string;
  created_at: string;
  name: string;
  about: string;
  icon: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

export interface Message {
  id: string;
  created_at: string;
  room_id: string;
  sender_id: string;
  message: string;
  is_edited: boolean;
  is_deleted: boolean;
  updated_at: string;
  type: string;
  is_action: boolean;
  sender: {
    first_name: string;
    last_name: string;
  };
}
