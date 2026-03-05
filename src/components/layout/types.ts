export type AnimatedHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

export interface NavItemProps {
  to: string;
  label: string;
  end?: boolean;
  collapsed: boolean;
  index: number;
  iconRef: React.RefObject<AnimatedHandle | null>;
  icon: React.ReactNode;
}
