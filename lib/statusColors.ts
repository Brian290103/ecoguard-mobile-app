import { ReportStatus } from "./types";

export const getStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case "pending":
      return "#FFC107"; // amber
    case "received":
      return "#2196F3"; // blue (for received)
    case "verified":
      return "#009688"; // teal
    case "active":
      return "#3F51B5"; // indigo (for active)
    case "resolved":
      return "#4CAF50"; // green
    case "assigned":
      return "#9C27B0"; // purple
    case "escalated":
      return "#FF9800"; // orange
    case "rejected":
      return "#F44336"; // red
    case "closed":
      return "#9E9E9E"; // grey
    default:
      return "#9E9E9E"; // grey
  }
};
