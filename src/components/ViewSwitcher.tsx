import { css } from 'styled-system/css';
import { type KeyboardEvent, useRef } from 'react';

import { viewPanelId, viewTabId, type ViewId, type ViewOption, views } from '../data/fixtures';

export interface ViewSwitcherProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

const tabClass = css({
  alignItems: 'center',
  borderBottomColor: 'transparent',
  borderBottomStyle: 'solid',
  borderBottomWidth: 'sm',
  color: 'text.primary',
  display: 'inline-flex',
  px: '4',
  py: '2',
  textDecoration: 'none',
  textStyle: 't_small_b',
  _hover: { color: 'text.link_hover' },
  '&[aria-selected=true]': {
    borderBottomColor: 'border.selected',
    color: 'text.selected',
  },
  _focusVisible: {
    outlineColor: 'focus.default',
    outlineOffset: '0.125rem',
    outlineStyle: 'solid',
    outlineWidth: '0.125rem',
  },
});

export function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectTab = (index: number) => {
    const view = views[index];
    if (!view) {
      return;
    }

    onViewChange(view.id);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = views.findIndex((view) => view.id === activeView);
    if (currentIndex < 0) {
      return;
    }

    const lastIndex = views.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectTab(nextIndex);
  };

  return (
    <div
      role="tablist"
      aria-label="Views"
      className={css({
        borderBottomColor: 'border.secondary',
        borderBottomStyle: 'solid',
        borderBottomWidth: 'xs',
        display: 'flex',
        flexDirection: { base: 'column', md: 'row' },
        gap: '2',
      })}
      onKeyDown={handleKeyDown}
    >
      {views.map((view: ViewOption, index) => {
        const selected = view.id === activeView;

        return (
          <button
            key={view.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={viewTabId(view.id)}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={viewPanelId(view.id)}
            className={tabClass}
            tabIndex={selected ? 0 : -1}
            onClick={() => onViewChange(view.id)}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}

ViewSwitcher.displayName = 'ViewSwitcher';
