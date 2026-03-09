function weekendCircleClass(active: boolean): string {
  const borderColor = active ? 'border-accent' : 'border-border';
  return `border-[1.5px] ${borderColor} bg-transparent`;
}

function weekdayCircleClass(active: boolean): string {
  return active ? 'bg-accent' : 'bg-border';
}

export function dayCircleClass(dayIndex: number, active: boolean): string {
  const isWeekend = dayIndex >= 5;
  return isWeekend ? weekendCircleClass(active) : weekdayCircleClass(active);
}
