import type { TeamInitialProps } from "./types";

export function TeamInitial(props: TeamInitialProps) {
  const initials = props.name
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-[13px] font-semibold text-accent">
      {initials}
    </div>
  );
}
