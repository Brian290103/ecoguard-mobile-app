import OfficerReportActions from "./OfficerReportActions";
import NatReportActions from "./NatReportActions";
import OrgReportActions from "./OrgReportActions";
import type { Report } from "@/lib/types";

interface ReportActionsProps {
  role: "officer" | "nat" | "org";
  report: Report;
}

export default function ReportActions({ role, report }: ReportActionsProps) {
  if (role === "officer") {
    return <OfficerReportActions report={report} />;
  } else if (role === "nat") {
    return <NatReportActions report={report} />;
  } else if (role === "org") {
    return <OrgReportActions report={report} />;
  } else {
    return null;
  }
}
