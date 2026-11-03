import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '../../utils';

/** Акцент underline активного таба. */
export const UNDERLINE_TAB_ACCENT = '#ff9c2e';

/** Цвет текста неактивного таба. */
export const UNDERLINE_TAB_MUTED = '#6a6e73';

/**
 * Класс underline-таба для обычных button (виджет торговли и т.п.).
 */
export function underlineTabClassName(active: boolean): string {
  return cn(
    'h-10 flex-none rounded-none border-0 border-b-2 border-solid bg-transparent px-0 py-0 shadow-none',
    'text-[14px] font-medium leading-[40px] transition-colors',
    'hover:bg-transparent hover:text-foreground dark:hover:text-foreground',
    active
      ? 'border-b-[#ff9c2e] font-semibold text-foreground dark:text-foreground'
      : 'border-b-transparent text-[#6a6e73] dark:text-[#6a6e73]',
  );
}

/** Класс ряда табов (как TabsList). */
export const underlineTabsListClassName =
  'flex h-auto w-full shrink-0 items-end justify-start gap-4 rounded-none border-b border-transparent bg-transparent p-0';

/**
 * Класс TabsTrigger (Radix): активное состояние через data-[state=active].
 */
export const underlineTabTriggerClassName = cn(
  'h-10 flex-none rounded-none border-0 border-b-2 border-solid border-b-transparent bg-transparent px-0 py-0 shadow-none',
  'text-[14px] font-medium leading-[40px] text-[#6a6e73] dark:text-[#6a6e73]',
  'hover:bg-transparent hover:text-foreground dark:hover:text-foreground',
  'data-[state=active]:border-b-[#ff9c2e] data-[state=active]:bg-transparent data-[state=active]:font-semibold',
  'data-[state=active]:text-foreground data-[state=active]:shadow-none',
  'dark:data-[state=active]:border-b-[#ff9c2e] dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-foreground',
  'cursor-pointer focus-visible:outline-none focus-visible:ring-0',
);

/**
 * Ряд underline-табов (без pill-фона обычного TabsList).
 */
function UnderlineTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant="underline"
      className={cn(underlineTabsListClassName, className)}
      {...props}
    />
  );
}

/**
 * Триггер underline-таба.
 */
function UnderlineTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-variant="underline"
      className={cn(underlineTabTriggerClassName, className)}
      {...props}
    />
  );
}

export { UnderlineTabsList, UnderlineTabsTrigger };
