import { supabase } from "./supabase";
import { Report } from "./types";

export const getOrganizationId = async (userId: string): Promise<string | null> => {
  const { data: orgRep, error: orgRepError } = await supabase
    .from("org_reps")
    .select("org_id")
    .eq("user_id", userId)
    .eq("is_approved", true)
    .single();

  if (orgRepError || !orgRep?.org_id) {
    console.error("Error fetching approved organization ID for user:", orgRepError);
    return null;
  }
  return orgRep.org_id;
};

export const getAssignedReports = async (
  organizationId: string,
  startDate?: string,
  endDate?: string,
): Promise<Report[]> => {
  const { data: assignedReportsData, error: assignedReportsError } =
    await supabase
      .from("assigned_reports")
      .select("report_id")
      .eq("organization_id", organizationId);

  if (assignedReportsError) {
    throw assignedReportsError;
  }

  const assignedReportIds = assignedReportsData.map((ar) => ar.report_id);

  if (assignedReportIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("reports")
    .select("*")
    .in("id", assignedReportIds);

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lt("created_at", endDate);
  }

  query = query.order("created_at", { ascending: false });

  const { data: reportsData, error: reportsError } = await query;

  if (reportsError) {
    throw reportsError;
  }
  return reportsData;
};

export const getAssignedReportsMetrics = async (
  organizationId: string,
  assignedReportIds: string[],
): Promise<{ total: number; resolved: number; rejected: number }> => {
  const { count: totalCount, error: totalCountError } = await supabase
    .from("assigned_reports")
    .select("id", { count: "exact" })
    .eq("organization_id", organizationId);

  if (totalCountError) {
    throw totalCountError;
  }

  const { count: resolvedCount, error: resolvedCountError } = await supabase
    .from("reports")
    .select("id", { count: "exact" })
    .in("id", assignedReportIds)
    .eq("status", "resolved");

  if (resolvedCountError) {
    throw resolvedCountError;
  }

  const { count: rejectedCount, error: rejectedCountError } = await supabase
    .from("reports")
    .select("id", { count: "exact" })
    .in("id", assignedReportIds)
    .eq("status", "rejected");

  if (rejectedCountError) {
    throw rejectedCountError;
  }

  return {
    total: totalCount || 0,
    resolved: resolvedCount || 0,
    rejected: rejectedCount || 0,
  };
};

export const searchAssignedReports = async (
  organizationId: string,
  query: string,
): Promise<Report[]> => {
  const { data: assignedReportsData, error: assignedReportsError } = await supabase
    .from("assigned_reports")
    .select("report_id")
    .eq("organization_id", organizationId);

  if (assignedReportsError) {
    throw assignedReportsError;
  }

  const assignedReportIds = assignedReportsData.map((ar) => ar.report_id);

  if (assignedReportIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .in("id", assignedReportIds)
    .or(
      `title.ilike.%${query}%,description.ilike.%${query}%,report_number.ilike.%${query}%`,
    );

  if (error) {
    throw error;
  }
  return data;
};