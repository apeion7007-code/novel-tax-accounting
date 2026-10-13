import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  dropdownMaxHeight?: number;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '선택',
  className = '',
  style = {},
  dropdownMaxHeight = 260
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // 과거 데이터 중 옵션 목록에 없는 특수 상태값도 누락 없이 첫 머리에 안전 보존
  const allOptions = React.useMemo(() => {
    if (value && !options.includes(value)) {
      return [value, ...options];
    }
    return options;
  }, [value, options]);

  // 항상 입력창 바로 '아래(Bottom)' 좌표 계산
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 2,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 160)
    });
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  // 외부 클릭 시 닫기 및 스크롤/리사이즈 대응
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('keydown', handleKeyDown);

    // 열릴 때 현재 선택된 항목으로 부드럽게 스크롤 이동
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`form-control ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          textAlign: 'left',
          boxSizing: 'border-box',
          padding: '2px 8px',
          height: '32px',
          fontSize: '13px',
          width: '100%',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          ...style
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: '6px',
            color: value ? '#0f172a' : '#94a3b8',
            fontWeight: value ? 500 : 400
          }}
        >
          {value || placeholder}
        </span>
        <span
          style={{
            fontSize: '9px',
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0
          }}
        >
          ▼
        </span>
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              minWidth: '160px',
              maxWidth: '320px',
              maxHeight: `${dropdownMaxHeight}px`,
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '6px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 999999,
              padding: '4px 0',
              boxSizing: 'border-box'
            }}
          >
            {allOptions.map((opt, idx) => {
              const isSelected = opt === value;
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={`${opt}-${idx}`}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    backgroundColor: isSelected
                      ? '#e0f2fe'
                      : isHovered
                      ? '#f1f5f9'
                      : '#ffffff',
                    color: isSelected ? '#0284c7' : '#1e293b',
                    fontWeight: isSelected ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.1s ease'
                  }}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <span style={{ fontSize: '11px', color: '#0284c7', marginLeft: '8px' }}>
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};
