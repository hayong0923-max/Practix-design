'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Section } from '@/types';
import { useCanvasDrag } from '@/hooks/practice/useCanvasDrag';
import { usePracticeContext } from '@/contexts/PracticeContext';

export function useWaveformRenderer() {
  const {
    currentTime, setCurrentTime, isPlaying, duration, sections, onSectionsChange,
    selectedSection, setSelectedSection, playAudio, stopPlayback,
    isLooping, setIsLooping, playbackRate, setPlaybackRate,
    toastSuccess, toastInfo, haptics, highlightNewSection,
  } = usePracticeContext();

  // --- Local state ---
  const [sectionMarkStart, setSectionMarkStart] = useState<number | null>(null);
  const [playbackStartPosition, setPlaybackStartPosition] = useState<number | null>(null);
  const [showCreateSectionButton, setShowCreateSectionButton] = useState(false);
  const [lastSkipBackTap, setLastSkipBackTap] = useState<number>(0);
  const [isDraggingMainProgress, setIsDraggingMainProgress] = useState(false);
  const draggedTimeRef = useRef(0);

  // --- Canvas drag callbacks ---
  const handleAddSection = useCallback((startTime: number, endTime: number) => {
    if (!duration) return;
    const sectionId = Date.now();
    const newSection: Section = {
      id: sectionId,
      start: startTime,
      end: endTime,
      recordedFiles: [],
    };
    onSectionsChange([newSection, ...sections]);
    highlightNewSection(sectionId);
    toastSuccess('구간이 생성되었습니다');
  }, [duration, sections, onSectionsChange, toastSuccess, highlightNewSection]);

  const handleSeekAndPlay = useCallback((time: number) => {
    setCurrentTime(time);
    setPlaybackStartPosition(time);
    setShowCreateSectionButton(false);
    setSelectedSection(null);
    playAudio(time);
  }, [setCurrentTime, playAudio, setSelectedSection]);

  const handleSeek = useCallback((time: number) => {
    if (!isPlaying) {
      setCurrentTime(time);
    }
    setSelectedSection(null);
    setShowCreateSectionButton(false);
    setPlaybackStartPosition(null);
  }, [setCurrentTime, isPlaying, setSelectedSection]);

  // Canvas drag hook
  const {
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
  } = useCanvasDrag({
    duration,
    onAddSection: handleAddSection,
    onSeekAndPlay: handleSeekAndPlay,
    onSeek: handleSeek,
    centeredPlayhead: true,
    currentTime,
    isPlaying,
  });

  // --- Playback handlers ---
  const handleSkipToBeginning = useCallback(() => {
    setCurrentTime(0);
    if (isPlaying) {
      playAudio(0);
    }
  }, [setCurrentTime, isPlaying, playAudio]);

  const handleSkipBack = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastSkipBackTap;

    if (timeSinceLastTap < 300) {
      handleSkipToBeginning();
      setLastSkipBackTap(0);
    } else {
      const newTime = Math.max(0, currentTime - 5);
      setCurrentTime(newTime);
      if (isPlaying) playAudio(newTime);
      setLastSkipBackTap(now);
    }
  }, [lastSkipBackTap, currentTime, setCurrentTime, isPlaying, playAudio, handleSkipToBeginning]);

  const handlePlayWithTracking = useCallback((time?: number) => {
    const startTime = time ?? currentTime;
    setPlaybackStartPosition(startTime);
    setShowCreateSectionButton(false);
    setSelectedSection(null);
    playAudio(startTime);
  }, [currentTime, playAudio, setSelectedSection]);

  const handlePauseWithTracking = useCallback(() => {
    stopPlayback();
    if (playbackStartPosition !== null) {
      const rangeDuration = Math.abs(currentTime - playbackStartPosition);
      if (rangeDuration >= 1) {
        setShowCreateSectionButton(true);
      }
    }
  }, [stopPlayback, playbackStartPosition, currentTime]);

  // --- Section marker (flag) ---
  const handleSectionMarker = useCallback(() => {
    if (sectionMarkStart === null) {
      setSectionMarkStart(currentTime);
      toastInfo('시작점이 설정되었습니다. 끝점에서 다시 눌러주세요');
      haptics.mediumTap();
    } else {
      const start = Math.min(sectionMarkStart, currentTime);
      const end = Math.max(sectionMarkStart, currentTime);

      if (end - start >= 0.5) {
        const sectionId = Date.now();
        const newSection: Section = {
          id: sectionId,
          start,
          end,
          recordedFiles: [],
        };
        onSectionsChange([newSection, ...sections]);
        highlightNewSection(sectionId);
        toastSuccess('구간이 생성되었습니다');
        haptics.success();
      }

      setSectionMarkStart(null);
    }
  }, [sectionMarkStart, currentTime, sections, onSectionsChange, toastSuccess, toastInfo, haptics, highlightNewSection]);

  // --- Create section from playback range ---
  const handleCreateSectionFromPlayback = useCallback(() => {
    if (playbackStartPosition === null || !duration) return;

    const start = Math.min(playbackStartPosition, currentTime);
    const end = Math.max(playbackStartPosition, currentTime);

    if (end - start >= 1) {
      const sectionId = Date.now();
      const newSection: Section = {
        id: sectionId,
        start,
        end,
        recordedFiles: [],
      };
      onSectionsChange([newSection, ...sections]);
      highlightNewSection(sectionId);
      toastSuccess('구간이 생성되었습니다');
    }

    setPlaybackStartPosition(null);
    setShowCreateSectionButton(false);
  }, [playbackStartPosition, duration, currentTime, sections, onSectionsChange, toastSuccess, highlightNewSection]);

  // --- Auto-scroll when playing ---
  useEffect(() => {
    if (isPlaying && zoomLevel !== 'full' && duration > 0) {
      const { start, end } = getVisibleTimeRange();

      if (currentTime < start || currentTime > end) {
        const zoomDur = zoomLevel === '10s' ? 10 : zoomLevel === '30s' ? 30 : zoomLevel === '60s' ? 60 : duration;
        const viewDuration = Math.min(zoomDur, duration);
        const maxScroll = Math.max(0, duration - viewDuration);

        const targetStart = Math.max(0, currentTime - viewDuration / 2);
        const newScrollPos = targetStart / maxScroll;
        setScrollPosition(Math.min(1, Math.max(0, newScrollPos)));
      }
    }
  }, [currentTime, isPlaying, zoomLevel, duration, getVisibleTimeRange, setScrollPosition]);

  return {
    // Canvas drag
    zoomLevel, setZoomLevel, scrollPosition, setScrollPosition,
    isCreatingSection, setIsCreatingSection, isDragging, dragStart, dragEnd, isSeeking,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp, getVisibleTimeRange,
    // Section marker
    sectionMarkStart, setSectionMarkStart,
    // Create section from playback
    playbackStartPosition, showCreateSectionButton,
    handleCreateSectionFromPlayback,
    setShowCreateSectionButton, setPlaybackStartPosition,
    // Playback handlers
    handleSkipToBeginning, handleSkipBack, handlePlayWithTracking, handlePauseWithTracking,
    // Main progress bar
    isDraggingMainProgress, setIsDraggingMainProgress, draggedTimeRef,
    // Section marker handler
    handleSectionMarker,
  };
}
