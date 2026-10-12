import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Sidebar from '../components/common/Sidebar';
import MobileNav from '../components/common/MobileNav';
import MobileHeader from '../components/common/MobileHeader';
import { Icon } from '../components/common';

interface StandardLayoutProps {
  children: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  showRightSidebar?: boolean;
  showMainSidebar?: boolean;
  showLeftSidebar?: boolean;
  stickyRightSidebar?: boolean;
  showRightSidebarControls?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseStoredWidth = (key: string, fallback: number, min: number, max: number) => {
  const raw = localStorage.getItem(key);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
};

export default function StandardLayout({
  children,
  leftSidebar,
  rightSidebar,
  showRightSidebar = true,
  showMainSidebar = true,
  showLeftSidebar = false,
  stickyRightSidebar = false,
  showRightSidebarControls = true,
}: StandardLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(() => parseStoredWidth('standardLayout_leftWidth', 280, 220, 450));

  const [rightWidth, setRightWidth] = useState(() => parseStoredWidth('standardLayout_rightWidth', 350, 250, 500));

  const [isRightCollapsed, setIsRightCollapsed] = useState(() => {
    const saved = localStorage.getItem('standardLayout_rightCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Save widths to localStorage
  useEffect(() => {
    localStorage.setItem('standardLayout_leftWidth', leftWidth.toString());
  }, [leftWidth]);

  useEffect(() => {
    localStorage.setItem('standardLayout_rightWidth', rightWidth.toString());
  }, [rightWidth]);

  useEffect(() => {
    localStorage.setItem('standardLayout_rightCollapsed', JSON.stringify(isRightCollapsed));
  }, [isRightCollapsed]);

  // Handle left sidebar resize
  useEffect(() => {
    if (!isResizingLeft) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const clampedWidth = Math.max(220, Math.min(450, newWidth));
      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft]);

  // Handle right sidebar resize
  useEffect(() => {
    if (!isResizingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      const clampedWidth = Math.max(250, Math.min(500, newWidth));
      setRightWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingRight(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingRight]);

  const rightCollapsed = showRightSidebarControls ? isRightCollapsed : false;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}
    >
      {/* Mobile Header - only visible on mobile */}
      <MobileHeader />

      <div
        ref={containerRef}
        className={`flex min-h-screen relative ${
          (isResizingLeft || isResizingRight) ? 'select-none' : ''
        }`}
      >
        {/* Main App Sidebar - Navigation - Hidden on mobile/tablet, visible on lg+ */}
        {showMainSidebar && (
          <div
            className="relative hidden lg:block"
            style={{ background: 'var(--civic-surface-muted)', width: '240px' }}
          >
            <Sidebar />
          </div>
        )}

        {/* Context Sidebar - Hidden on mobile, shown on desktop */}
        {showLeftSidebar && leftSidebar && (
          <aside
            className={`relative ${
              showRightSidebar ? 'hidden xl:flex' : 'hidden lg:flex'
            } sticky top-0 h-screen shrink-0 flex-col`}
            style={{
              width: `${leftWidth}px`,
              background: 'var(--civic-surface-soft)',
              color: 'var(--civic-text)',
            }}
          >
            <div className="flex-1 overflow-y-auto civic-scrollbar p-4">
              {leftSidebar}
            </div>

            <div
              onMouseDown={() => setIsResizingLeft(true)}
              className="group absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-[#c8d6cb] active:bg-[#b6c7ba]"
              title="Drag to resize sidebar"
            >
              <div className="absolute right-0 top-1/2 h-20 w-1 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c8c2b7] transition-all shadow-sm group-hover:w-1.5 group-hover:bg-[#8aa892] group-active:bg-[#005129]" />
            </div>
          </aside>
        )}

        {/* Main Content - Fills available space */}
        <main
          className="flex-1 w-full min-w-0 pb-16 lg:pb-0"
          style={{ background: 'var(--civic-surface-soft)', color: 'var(--civic-text)' }}
        >
          {children}
        </main>

        {/* Right Sidebar - Hidden on mobile/tablet, visible on lg+ */}
        {showRightSidebar && rightSidebar && (
          <div
            className={`relative hidden lg:flex lg:flex-col shrink-0 transition-all duration-300 ${
              stickyRightSidebar ? 'lg:sticky lg:top-0 lg:h-screen self-start' : ''
            } ${
              rightCollapsed ? 'lg:w-20' : 'lg:w-80'
            }`}
            style={
              !rightCollapsed
                ? {
                    width: `${rightWidth}px`,
                    background: 'var(--civic-surface-muted)',
                  }
                : {
                    background: 'var(--civic-surface-muted)',
                  }
            }
          >
            {/* Right Sidebar Content */}
            <div className={`flex-1 ${stickyRightSidebar ? 'overflow-y-auto civic-scrollbar' : 'overflow-y-auto no-scrollbar'}`}>
              {!rightCollapsed && (
                <div className={showRightSidebarControls ? 'p-4' : 'p-5 xl:p-6'}>
                  {rightSidebar}
                </div>
              )}
            </div>

            {/* Collapse Button */}
            {showRightSidebarControls && (
              <div className="flex justify-center border-t p-4" style={{ borderColor: 'var(--civic-border)' }}>
                <button
                  onClick={() => setIsRightCollapsed(!isRightCollapsed)}
                  className="rounded-md p-2 transition-all hover:text-[#005129]"
                  style={{ color: 'var(--civic-muted)' }}
                  title={isRightCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <Icon
                    name={isRightCollapsed ? 'chevron_left' : 'chevron_right'}
                    className="text-xl"
                  />
                </button>
              </div>
            )}

            {/* Right Resize Handle */}
            {showRightSidebarControls && (
              <div
                onMouseDown={() => setIsResizingRight(true)}
                className="group absolute left-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-[#c8d6cb] active:bg-[#b6c7ba]"
                title="Drag to resize sidebar"
              >
                <div className="absolute left-0 top-1/2 h-20 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c8c2b7] transition-all shadow-sm group-hover:w-1.5 group-hover:bg-[#8aa892] group-active:bg-[#005129]" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - only visible on mobile */}
      <MobileNav />
    </div>
  );
}
