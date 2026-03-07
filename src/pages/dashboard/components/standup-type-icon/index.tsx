import { getWorkItemTheme } from '@/utils/work-item-theme';
import { mapWorkItemType } from '@/utils/mappers';
import type { TypeIconProps } from '../standup-dialog/types';

export function TypeIcon(props: TypeIconProps) {
  const { type, size = 11 } = props;
  const theme = getWorkItemTheme(mapWorkItemType(type));
  const Icon = theme.icon;

  return (
    <span className="mt-[2px] flex h-3 w-3 shrink-0 items-center justify-center">
      <Icon size={size} className={theme.className} />
    </span>
  );
}
