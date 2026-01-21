
export type DayType = 'weekday' | 'weekend' | 'holiday';

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  profession?: string;
}

export interface Plan {
  id: string;
  user_id: string;
  activity_name: string;
  day_type: DayType;
  category: string;
  target_minutes: number;
  is_active: boolean;
}

export interface ActivitySession {
  id: string;
  user_id: string;
  plan_id: string;
  activity_name: string;
  activity_date: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
}

export interface DashboardRow {
  activity_name: string;
  plan_id: string;
  day_type: DayType;
  activity_date: string;
  target_minutes: number;
  actual_seconds: number;
  status: 'pending' | 'completed' | 'overdone';
}

export interface DailyTotals {
  activity_date: string;
  total_tracked_seconds: number;
  untracked_minutes: number;
}

export interface RunningSession {
  sessionId: string;
  planId: string;
  activityName: string;
  startTime: string;
}
