import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { RelatedRow } from '../related-row';
import type { RelatedItemsProps } from './types';

export function RelatedItems(props: RelatedItemsProps) {
  const { parent, children, onSelect } = props;
  const { t } = useTranslation('dashboard');

  const hasParent = parent !== null;
  const hasChildren = children.length > 0;

  if (!hasParent && !hasChildren) return null;

  return (
    <div className="space-y-3">
      {hasParent && (
        <Collapsible defaultOpen={true}>
          <CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            <ChevronRight size={11} className="transition-transform duration-200 group-data-[state=open]:rotate-90" />
            {t('workItemDetail.parent')}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1">
              <RelatedRow item={parent} onSelect={onSelect} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {hasChildren && (
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            <ChevronRight size={11} className="transition-transform duration-200 group-data-[state=open]:rotate-90" />
            {t('workItemDetail.children')}
            <span className="font-normal normal-case tracking-normal text-fg-disabled">({children.length})</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 flex flex-col">
              {children.map((child) => (
                <RelatedRow key={child.id} item={child} onSelect={onSelect} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
