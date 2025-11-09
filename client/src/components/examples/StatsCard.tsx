import { StatsCard } from "../StatsCard";
import { BookOpen } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="max-w-xs">
      <StatsCard
        title="Total Books"
        value="1,234"
        icon={BookOpen}
        description="In catalog"
        trend={{ value: 12, label: "from last month" }}
      />
    </div>
  );
}
