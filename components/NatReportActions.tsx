import { Button } from "react-native";
import type { Report } from "@/lib/types";

interface NatReportActionsProps {
  report: Report;
}

export default function NatReportActions({ report }: NatReportActionsProps) {
  return (
    <>
      <Button title="Edit" onPress={() => {}} />
    </>
  );
}
