import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useLocaleStore } from '@/store/locale';

dayjs.extend(relativeTime);

interface TimeAgoProps {
  date?: string;
  className?: string;
}

export function TimeAgo(props: TimeAgoProps) {
  const { date, className } = props;
  const language = useLocaleStore((s) => s.language);

  if (!date) return <span className={className}>—</span>;

  const text = dayjs(date).locale(language === 'pt-BR' ? 'pt-br' : 'en').fromNow();

  return <span className={className}>{text}</span>;
}
