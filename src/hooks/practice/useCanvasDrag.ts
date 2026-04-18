import { useState, useRef, useCallback } from 'react';
import { ZoomLevel } from '@/types';

interface UseCanvasDragProps {
  duration: number;
  onAddSection: (start: number, end: number) => void;
  onSeekAndPlay: (time: number) => void;
  onSeek?: (time: number) => void; // For drag-to-seek without playing
  centeredPlayhead?: boolean; // 재생 바 중앙 고정 모드 (드래그 방향 반전)
  currentTime?: number; // centeredPlayhead 모드에서 필요
  isPlaying?: boolean; // 재생 중 여부 - 일시정지 중에는 seek 후 자동 재생 안 함
}

interface UseCanvasDragReturn {
  // Zoom & scroll
  zoomLevel: ZoomLevel;
  setZoomLevel: (level: ZoomLevel) => void;
  scrollPosition: number;
  setScrollPosition: (pos: number) => void;

  // Section creation mode
  isCreatingSection: boolean;
  setIsCreatingSection: (creating: boolean) => void;

  // Drag state
  isDragging: boolean;
  dragStart: number | null;
  dragEnd: number | null;

  // Seeking drag state
  isSeeking: boolean;

  // Canvas event handlers
  handleCanvasMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleCanvasMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleCanvasMouseUp: () => void;

  // Helpers
  getVisibleTimeRange: () => { start: number; end: number };
}

export function useCanvasDrag({
  duration,
  onAddSection,
  onSeekAndPlay,
  onSeek,
  centeredPlayhead = false,
  currentTime = 0,
  isPlaying = false,
}: UseCanvasDragProps): UseCanvasDragReturn {
  // Zoom and scroll
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('full');
  const [scrollPosition, setScrollPosition] = useState(0);

  // Section creation
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  // Seeking drag state (for drag-to-seek when not creating section)
  const [isSeeking, setIsSeeking] = useState(false);

  // Auto-scroll during drag
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const lastEdgeDirection = useRef<'left' | 'right' | null>(null);

  // For centeredPlayhead drag (track initial position for delta calculation)
  const dragStartXRef = useRef<number>(0);
  const dragStartTimeRef = useRef<number>(0);
  const canvasWidthRef = useRef<number>(0);

  const getZoomDuration = useCallback(() => {
    switch (zoomLevel) {
      case '10s':
        return 10;
      case '30s':
        return 30;
      case '60s':
        return 60;
      default:
        return duration;
    }
  }, [zoomLevel, duration]);

  const getVisibleTimeRange = useCallback(() => {
    const zoomDur = getZoomDuration();

    // centeredPlayhead 모드: currentTime이 항상 중앙에 오도록 계산
    // 시작/끝에서도 중앙 유지를 위해 범위 제한하지 않음 (음수나 duration 초과 허용)
    if (centeredPlayhead && zoomLevel !== 'full') {
      const viewDuration = Math.min(zoomDur, duration);
      const halfView = viewDuration / 2;

      // currentTime을 중심으로 좌우로 halfView만큼 (범위 제한 없음)
      const start = currentTime - halfView;
      const end = currentTime + halfView;

      return { start, end };
    }

    if (zoomLevel === 'full') {
      return { start: 0, end: duration };
    }

    const viewDuration = Math.min(zoomDur, duration);
    const maxScroll = Math.max(0, duration - viewDuration);
    const start = scrollPosition * maxScroll;
    const end = Math.min(start + viewDuration, duration);

    return { start, end };
  }, [zoomLevel, duration, scrollPosition, getZoomDuration, centeredPlayhead, currentTime]);

  const startAutoScroll = useCallback((direction: 'left' | 'right') => {
    if (autoScrollRef.current || zoomLevel === 'full') return;

    lastEdgeDirection.current = direction;
    autoScrollRef.current = setInterval(() => {
      setScrollPosition(prev => {
        const step = 0.02;
        const newPos = direction === 'left'
          ? Math.max(0, prev - step)
          : Math.min(1, prev + step);

        // Update dragEnd based on the edge direction
        if (duration > 0) {
          const zoomDur = zoomLevel === '10s' ? 10 : zoomLevel === '30s' ? 30 : zoomLevel === '60s' ? 60 : duration;
          const viewDuration = Math.min(zoomDur, duration);
          const maxScroll = Math.max(0, duration - viewDuration);
          const start = newPos * maxScroll;
          const end = Math.min(start + viewDuration, duration);

          setDragEnd(direction === 'left' ? start : end);
        }

        return newPos;
      });
    }, 50);
  }, [zoomLevel, duration]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
    lastEdgeDirection.current = null;
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const { start, end } = getVisibleTimeRange();
    const time = start + (x / rect.width) * (end - start);

    if (isCreatingSection) {
      setIsDragging(true);
      setDragStart(time);
      setDragEnd(time);
    } else {
      // Start seeking drag
      setIsSeeking(true);

      if (centeredPlayhead && zoomLevel !== 'full') {
        // centeredPlayhead 모드: 드래그 시작점과 현재 시간 기록
        dragStartXRef.current = x;
        dragStartTimeRef.current = currentTime;
        canvasWidthRef.current = rect.width;
        setDragStart(currentTime);
      } else {
        setDragStart(time);
        if (onSeek) {
          onSeek(time);
        }
      }
    }
  }, [duration, isCreatingSection, getVisibleTimeRange, onSeek, centeredPlayhead, currentTime]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const { start, end } = getVisibleTimeRange();
    const viewDuration = end - start;

    if (isCreatingSection && isDragging) {
      const time = Math.max(0, Math.min(start + (x / rect.width) * viewDuration, duration));
      setDragEnd(time);

      // Auto-scroll when near edges (within 30px)
      const edgeThreshold = 30;
      if (x < edgeThreshold && scrollPosition > 0) {
        startAutoScroll('left');
      } else if (x > rect.width - edgeThreshold && scrollPosition < 1) {
        startAutoScroll('right');
      } else {
        stopAutoScroll();
      }
    } else if (isSeeking && onSeek) {
      if (centeredPlayhead && zoomLevel !== 'full') {
        // centeredPlayhead 모드: 드래그 방향 반전 (파형이 손가락을 따라 움직임)
        const deltaX = x - dragStartXRef.current;
        const deltaTime = (deltaX / canvasWidthRef.current) * viewDuration;
        // 드래그 방향 반전: 오른쪽으로 드래그하면 시간이 감소 (파형이 오른쪽으로 이동)
        const newTime = Math.max(0, Math.min(duration, dragStartTimeRef.current - deltaTime));
        onSeek(newTime);
        setDragStart(newTime);
      } else {
        // 일반 모드: 터치 위치가 새 현재 시간
        const time = Math.max(0, Math.min(start + (x / rect.width) * viewDuration, duration));
        onSeek(time);
        setDragStart(time);
      }
    }
  }, [duration, isCreatingSection, isDragging, isSeeking, scrollPosition, getVisibleTimeRange, startAutoScroll, stopAutoScroll, onSeek, centeredPlayhead]);

  const handleCanvasMouseUp = useCallback(() => {
    stopAutoScroll();

    if (!duration || dragStart === null) {
      setIsSeeking(false);
      return;
    }

    if (isCreatingSection && isDragging) {
      if (dragEnd !== null && Math.abs(dragEnd - dragStart) > 0.5) {
        const start = Math.min(dragStart, dragEnd);
        const end = Math.max(dragStart, dragEnd);
        onAddSection(start, end);
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    } else if (isSeeking) {
      // End seeking drag
      if (isPlaying) {
        // If playing, continue playback from new position
        onSeekAndPlay(dragStart);
      }
      // If paused, position is already updated via onSeek - don't auto-play
      setIsSeeking(false);
      setDragStart(null);
    }
  }, [duration, dragStart, dragEnd, isCreatingSection, isDragging, isSeeking, onAddSection, onSeekAndPlay, stopAutoScroll]);

  return {
    zoomLevel,
    setZoomLevel,
    scrollPosition,
    setScrollPosition,
    isCreatingSection,
    setIsCreatingSection,
    isDragging,
    dragStart,
    dragEnd,
    isSeeking,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    getVisibleTimeRange,
  };
}
