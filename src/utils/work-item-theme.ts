import { CheckSquare, Bug, Layers, Zap, Box } from "lucide-react";
import type { WorkItemType, WorkItemTheme } from "@/types/work-item";

const WORK_ITEM_THEMES: Record<WorkItemType, WorkItemTheme> = {
  task:    { icon: CheckSquare, className: "text-warning",  color: "#eab308", shineColors: ["#eab308", "#facc15", "#ca8a04"] },
  bug:     { icon: Bug,         className: "text-error",    color: "#ef4444", shineColors: ["#ef4444", "#f87171", "#dc2626"] },
  pbi:     { icon: Layers,      className: "text-info",     color: "#3b82f6", shineColors: ["#3b82f6", "#60a5fa", "#2563eb"] },
  feature: { icon: Box,         className: "text-running",  color: "#8b5cf6", shineColors: ["#8b5cf6", "#a78bfa", "#7c3aed"] },
  epic:    { icon: Zap,         className: "text-success",  color: "#22c55e", shineColors: ["#22c55e", "#4ade80", "#16a34a"] },
};

export function getWorkItemTheme(type: WorkItemType): WorkItemTheme {
  return WORK_ITEM_THEMES[type];
}
