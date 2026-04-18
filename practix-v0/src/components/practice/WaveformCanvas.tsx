'use client';

import { useRef, useEffect, memo } from 'react';
import { Section, ZoomLevel } from '@/types';
import { formatTime } from '@/utils/formatTime';

const MAX_CACHE_W = 8192;

function getDpr() {
  if (typeof window === 'undefined') return 2;
  return Math.min(window.devicePixelRatio || 1, 2);
}

interface WaveformCanvasProps {
  duration: number;
  currentTime: number;
  sections: Section[];
  selectedSection: Section | null;
  isPlaying: boolean;
  waveformData: number[] | null;
  zoomLevel: ZoomLevel;
  scrollPosition: number;
  isCreatingSection: boolean;
  isDragging: boolean;
  dragStart: number | null;
  dragEnd: number | null;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  nativeStyle?: boolean;
  onDoubleTap?: () => void;
  centeredPlayhead?: boolean;
  sectionMarkStart?: number | null;
}

interface DrawState {
  duration: number;
  currentTime: number;
  sections: Section[];
  selectedSection: Section | null;
  isPlaying: boolean;
  waveformData: number[] | null;
  zoomLevel: ZoomLevel;
  scrollPosition: number;
  isCreatingSection: boolean;
  isDragging: boolean;
  dragStart: number | null;
  dragEnd: number | null;
  nativeStyle: boolean;
  centeredPlayhead: boolean;
  sectionMarkStart: number | null;
}

interface WaveformCache {
  unplayed: HTMLCanvasElement | null;
  played: HTMLCanvasElement | null;
  web: HTMLCanvasElement | null;
  preW: number;
  key: string;
}

// ─── Helper: visible time range ───
function calcViewRange(time: number, p: DrawState): { start: number; end: number } {
  const zoomDur = p.zoomLevel === '10s' ? 10 : p.zoomLevel === '30s' ? 30 : p.zoomLevel === '60s' ? 60 : p.duration;

  if (p.centeredPlayhead && p.zoomLevel !== 'full') {
    const viewDur = Math.min(zoomDur, p.duration);
    const half = viewDur / 2;
    return { start: time - half, end: time + half };
  }

  if (p.zoomLevel === 'full') {
    return { start: 0, end: p.duration };
  }

  const viewDur = Math.min(zoomDur, p.duration);
  const maxScroll = Math.max(0, p.duration - viewDur);
  const start = p.scrollPosition * maxScroll;
  return { start, end: Math.min(start + viewDur, p.duration) };
}

// ─── Helper: build native bar cache ───
function buildNativeCache(
  data: number[], visW: number, visH: number, dur: number, dpr: number, zoomDur: number,
): { unplayed: HTMLCanvasElement; played: HTMLCanvasElement; preW: number } {
  const barWidth = 1.4;
  const barGap = 0.8;
  const barPitch = barWidth + barGap;

  const barsPerView = Math.floor(visW / barPitch);
  const totalBars = Math.min(
    Math.floor(MAX_CACHE_W / barPitch),
    Math.ceil(barsPerView * (dur / zoomDur)),
  );
  const preW = totalBars * barPitch;

  const centerY = visH / 2;
  const maxAmp = visH * 0.4;

  const createCanvas = (color: string): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = preW * dpr;
    c.height = visH * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = color;
    for (let i = 0; i < totalBars; i++) {
      const sampleStart = Math.floor((i / totalBars) * data.length);
      const sampleEnd = Math.max(sampleStart + 1, Math.floor(((i + 1) / totalBars) * data.length));
      const clampedEnd = Math.min(sampleEnd, data.length);

      let sum = 0;
      for (let j = sampleStart; j < clampedEnd; j++) sum += data[j];
      const avg = sum / (clampedEnd - sampleStart);

      const barH = avg > 0.01 ? Math.max(2, avg * maxAmp * 2) : 1;
      const x = i * barPitch;
      const y = centerY - barH / 2;
      const r = barWidth / 2;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, r);
      ctx.fill();
    }

    return c;
  };

  return {
    unplayed: createCanvas('#37474F'),
    played: createCanvas('#4FC3F7'),
    preW,
  };
}

// ─── Helper: build web bezier cache ───
function buildWebCache(
  data: number[], visW: number, visH: number, dur: number, dpr: number, zoomDur: number,
): { web: HTMLCanvasElement; preW: number } {
  const scale = dur / zoomDur;
  const preW = Math.min(MAX_CACHE_W, Math.ceil(visW * scale));
  const numSamples = data.length;

  const c = document.createElement('canvas');
  c.width = preW * dpr;
  c.height = visH * dpr;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const centerY = visH / 2;
  const maxAmp = visH * 0.4;

  const gradient = ctx.createLinearGradient(0, centerY - maxAmp, 0, centerY + maxAmp);
  gradient.addColorStop(0, '#a78bfa');
  gradient.addColorStop(0.5, '#8b5cf6');
  gradient.addColorStop(1, '#a78bfa');
  ctx.fillStyle = gradient;

  const getPoint = (index: number, isTop: boolean) => {
    const ci = Math.max(0, Math.min(index, numSamples - 1));
    const x = (index / (numSamples - 1 || 1)) * preW;
    const amp = data[ci] * maxAmp;
    return { x, y: isTop ? centerY - amp : centerY + amp };
  };

  const ctrlPts = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    tension = 0.3,
  ) => {
    const d01 = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
    const d12 = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const fa = tension * d01 / (d01 + d12);
    const fb = tension - fa;
    return {
      cp1: { x: p1.x - fa * (p2.x - p0.x), y: p1.y - fa * (p2.y - p0.y) },
      cp2: { x: p1.x + fb * (p2.x - p0.x), y: p1.y + fb * (p2.y - p0.y) },
    };
  };

  // Top half
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(getPoint(0, true).x, getPoint(0, true).y);
  for (let i = 1; i < numSamples; i++) {
    const p0 = getPoint(i - 2, true);
    const p1 = getPoint(i - 1, true);
    const p2 = getPoint(i, true);
    const p3 = getPoint(i + 1, true);
    const { cp2: c1 } = i > 1 ? ctrlPts(p0, p1, p2) : { cp2: p1 };
    const { cp1: c2 } = i < numSamples - 1 ? ctrlPts(p1, p2, p3) : { cp1: p2 };
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
  }
  ctx.lineTo(preW, centerY);

  // Bottom half (reverse)
  ctx.lineTo(getPoint(numSamples - 1, false).x, getPoint(numSamples - 1, false).y);
  for (let i = numSamples - 2; i >= 0; i--) {
    const p0 = getPoint(i + 2, false);
    const p1 = getPoint(i + 1, false);
    const p2 = getPoint(i, false);
    const p3 = getPoint(i - 1, false);
    const { cp2: c1 } = i < numSamples - 2 ? ctrlPts(p0, p1, p2) : { cp2: p1 };
    const { cp1: c2 } = i > 0 ? ctrlPts(p1, p2, p3) : { cp1: p2 };
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
  }

  ctx.closePath();
  ctx.fill();

  return { web: c, preW };
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

function WaveformCanvas({
  duration,
  currentTime,
  sections,
  selectedSection,
  isPlaying,
  waveformData,
  zoomLevel,
  scrollPosition,
  isCreatingSection,
  isDragging,
  dragStart,
  dragEnd,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  nativeStyle = false,
  onDoubleTap,
  centeredPlayhead = false,
  sectionMarkStart = null,
}: WaveformCanvasProps) {
  // ─── Refs ───
  const staticRef = useRef<HTMLCanvasElement>(null);
  const playheadRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const lastTapRef = useRef(0);
  const dimsRef = useRef({ w: 0, h: 0 });
  const dprRef = useRef(getDpr());

  // Interpolation
  const interpRef = useRef({ wall: performance.now(), audio: currentTime });

  // All props in a single ref (avoids stale closures, no useCallback needed)
  const P = useRef<DrawState>({
    duration, currentTime, sections, selectedSection, isPlaying,
    waveformData, zoomLevel, scrollPosition, isCreatingSection,
    isDragging, dragStart, dragEnd, nativeStyle, centeredPlayhead, sectionMarkStart,
  });
  P.current = {
    duration, currentTime, sections, selectedSection, isPlaying,
    waveformData, zoomLevel, scrollPosition, isCreatingSection,
    isDragging, dragStart, dragEnd, nativeStyle, centeredPlayhead, sectionMarkStart,
  };

  // Waveform bitmap cache
  const cacheRef = useRef<WaveformCache>({
    unplayed: null, played: null, web: null, preW: 0, key: '',
  });

  // ─── Interpolation baseline sync ───
  useEffect(() => {
    interpRef.current = { wall: performance.now(), audio: currentTime };
  }, [currentTime]);

  // ─── Cache management ───
  function getZoomDur(): number {
    const p = P.current;
    return p.zoomLevel === '10s' ? 10 : p.zoomLevel === '30s' ? 30 : p.zoomLevel === '60s' ? 60 : p.duration;
  }

  function getCacheKey(): string {
    const p = P.current;
    const d = dimsRef.current;
    return `${p.waveformData?.length ?? 0}|${d.w}|${d.h}|${p.duration.toFixed(1)}|${p.nativeStyle ? 1 : 0}|${getZoomDur()}`;
  }

  function ensureCache() {
    const key = getCacheKey();
    if (cacheRef.current.key === key) return;

    const p = P.current;
    const { w, h } = dimsRef.current;

    if (!p.waveformData || p.waveformData.length === 0 || w === 0 || h === 0 || p.duration <= 0) {
      cacheRef.current = { unplayed: null, played: null, web: null, preW: 0, key };
      return;
    }

    const dpr = dprRef.current;
    const zoomDur = getZoomDur();

    if (p.nativeStyle) {
      const { unplayed, played, preW } = buildNativeCache(p.waveformData, w, h, p.duration, dpr, zoomDur);
      cacheRef.current = { unplayed, played, web: null, preW, key };
    } else {
      const { web, preW } = buildWebCache(p.waveformData, w, h, p.duration, dpr, zoomDur);
      cacheRef.current = { unplayed: null, played: null, web, preW, key };
    }
  }

  // ─── Drawing: cached waveform ───
  function drawCachedWaveform(
    ctx: CanvasRenderingContext2D,
    viewStart: number, viewEnd: number, time: number,
  ) {
    const p = P.current;
    const { w: visW, h: visH } = dimsRef.current;
    const cache = cacheRef.current;
    const dpr = dprRef.current;

    if (p.duration <= 0 || cache.preW <= 0) return;

    const viewDur = viewEnd - viewStart;
    const actualStart = Math.max(0, viewStart);
    const actualEnd = Math.min(p.duration, viewEnd);

    // Source rect in cache CSS coords
    const srcX = (actualStart / p.duration) * cache.preW;
    const srcW = ((actualEnd - actualStart) / p.duration) * cache.preW;

    // Dest rect in visible canvas CSS coords
    const dstX = ((actualStart - viewStart) / viewDur) * visW;
    const dstW = ((actualEnd - actualStart) / viewDur) * visW;

    if (srcW <= 0 || dstW <= 0) return;

    if (p.nativeStyle && cache.unplayed && cache.played) {
      // Draw unplayed bars
      ctx.drawImage(
        cache.unplayed,
        srcX * dpr, 0, srcW * dpr, visH * dpr,
        dstX, 0, dstW, visH,
      );

      // Clip to played area and draw played bars
      const timeToX = (t: number) => ((t - viewStart) / viewDur) * visW;
      const playheadX = (p.centeredPlayhead && p.zoomLevel !== 'full') ? visW / 2 : timeToX(time);

      if (playheadX > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, Math.min(playheadX, visW), visH);
        ctx.clip();
        ctx.drawImage(
          cache.played,
          srcX * dpr, 0, srcW * dpr, visH * dpr,
          dstX, 0, dstW, visH,
        );
        ctx.restore();
      }
    } else if (cache.web) {
      ctx.drawImage(
        cache.web,
        srcX * dpr, 0, srcW * dpr, visH * dpr,
        dstX, 0, dstW, visH,
      );
    }
  }

  // ─── Drawing: sections ───
  function drawSections(
    ctx: CanvasRenderingContext2D,
    viewStart: number, viewEnd: number,
  ) {
    const p = P.current;
    const { w: visW, h: visH } = dimsRef.current;
    const viewDur = viewEnd - viewStart;
    const timeToX = (t: number) => ((t - viewStart) / viewDur) * visW;

    p.sections.forEach((section, idx) => {
      if (section.end < viewStart || section.start > viewEnd) return;

      const startX = timeToX(section.start);
      const endX = timeToX(section.end);
      const isCurrent = p.selectedSection?.id === section.id && p.isPlaying;

      if (p.nativeStyle) {
        ctx.fillStyle = isCurrent ? 'rgba(79, 195, 247, 0.15)' : 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(Math.max(0, startX), 0, Math.min(visW, endX) - Math.max(0, startX), visH);

        ctx.strokeStyle = isCurrent ? '#4FC3F7' : 'rgba(255, 107, 107, 0.6)';
        ctx.lineWidth = 1;

        if (startX >= 0 && startX <= visW) {
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(startX, 0);
          ctx.lineTo(startX, visH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (endX >= 0 && endX <= visW) {
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(endX, 0);
          ctx.lineTo(endX, visH);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (startX >= 0 && startX <= visW) {
          ctx.fillStyle = isCurrent ? '#4FC3F7' : 'rgba(255, 107, 107, 0.6)';
          ctx.beginPath();
          ctx.arc(startX + 10, 10, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1a1a2e';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${idx + 1}`, startX + 10, 13);
          ctx.textAlign = 'left';
        }
      } else {
        ctx.fillStyle = isCurrent
          ? 'rgba(34, 197, 94, 0.25)'
          : idx % 2 === 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(Math.max(0, startX), 0, Math.min(visW, endX) - Math.max(0, startX), visH);

        ctx.strokeStyle = isCurrent ? '#22c55e' : '#ef4444';
        ctx.lineWidth = isCurrent ? 3 : 2;

        if (startX >= 0 && startX <= visW) {
          ctx.beginPath();
          ctx.moveTo(startX, 0);
          ctx.lineTo(startX, visH);
          ctx.stroke();
        }
        if (endX >= 0 && endX <= visW) {
          ctx.beginPath();
          ctx.moveTo(endX, 0);
          ctx.lineTo(endX, visH);
          ctx.stroke();
        }

        if (startX >= 0 && startX <= visW) {
          ctx.fillStyle = isCurrent ? '#22c55e' : '#ef4444';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`${idx + 1}`, startX + 3, 12);
        }
      }
    });
  }

  // ─── Drawing: drag selection ───
  function drawDragSelection(
    ctx: CanvasRenderingContext2D,
    viewStart: number, viewEnd: number,
  ) {
    const p = P.current;
    if (!p.isCreatingSection || !p.isDragging || p.dragStart === null || p.dragEnd === null) return;

    const { w: visW, h: visH } = dimsRef.current;
    const viewDur = viewEnd - viewStart;
    const timeToX = (t: number) => ((t - viewStart) / viewDur) * visW;

    const startX = timeToX(Math.min(p.dragStart, p.dragEnd));
    const endX = timeToX(Math.max(p.dragStart, p.dragEnd));
    const startTime = Math.min(p.dragStart, p.dragEnd);
    const endTime = Math.max(p.dragStart, p.dragEnd);

    if (p.nativeStyle) {
      ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, visH);

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(startX, visH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(endX, 0); ctx.lineTo(endX, visH); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(formatTime(startTime), startX + 4, visH - 8);
      ctx.textAlign = 'right';
      ctx.fillText(formatTime(endTime), endX - 4, visH - 8);
      ctx.textAlign = 'left';

      const centerX = (startX + endX) / 2;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0, 212, 255, 0.9)';
      ctx.fillText(formatTime(endTime - startTime), centerX, 25);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.fillRect(startX, 0, endX - startX, visH);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(startX, visH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(endX, 0); ctx.lineTo(endX, visH); ctx.stroke();
      ctx.setLineDash([]);

      const drawTimeLabel = (x: number, labelTime: number, align: 'left' | 'right') => {
        const label = formatTime(labelTime);
        const padding = 6;
        const textWidth = ctx.measureText(label).width;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 20;
        const boxX = align === 'left' ? x : x - boxWidth;
        const boxY = 5;

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = align === 'left' ? 'left' : 'right';
        ctx.fillText(label, align === 'left' ? boxX + padding : boxX + boxWidth - padding, boxY + 14);
        ctx.textAlign = 'left';
      };

      drawTimeLabel(startX, startTime, 'left');
      drawTimeLabel(endX, endTime, 'right');

      const centerX = (startX + endX) / 2;
      const durationLabel = formatTime(endTime - startTime);
      const durationWidth = ctx.measureText(durationLabel).width + 12;
      ctx.fillStyle = '#059669';
      ctx.fillRect(centerX - durationWidth / 2, visH - 25, durationWidth, 18);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(durationLabel, centerX, visH - 12);
      ctx.textAlign = 'left';
    }
  }

  // ─── Drawing: section marker (flag) ───
  function drawSectionMarker(
    ctx: CanvasRenderingContext2D,
    viewStart: number, viewEnd: number,
  ) {
    const p = P.current;
    if (p.sectionMarkStart === null) return;
    if (p.sectionMarkStart < viewStart || p.sectionMarkStart > viewEnd) return;

    const { w: visW, h: visH } = dimsRef.current;
    const viewDur = viewEnd - viewStart;
    const markX = ((p.sectionMarkStart - viewStart) / viewDur) * visW;

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(markX, 0);
    ctx.lineTo(markX, visH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(markX, 5);
    ctx.lineTo(markX + 12, 10);
    ctx.lineTo(markX, 15);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(markX, 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Drawing: playhead (separate canvas) ───
  function drawPlayheadLine(time: number, viewStart: number, viewEnd: number) {
    const canvas = playheadRef.current;
    if (!canvas) return;

    const p = P.current;
    const { w: visW, h: visH } = dimsRef.current;
    if (visW === 0 || visH === 0 || p.duration <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, visW, visH);

    const shouldDraw = p.centeredPlayhead || (time >= viewStart && time <= viewEnd);
    if (!shouldDraw) return;

    const viewDur = viewEnd - viewStart;
    const currentX = (p.centeredPlayhead && p.zoomLevel !== 'full') ? visW / 2 : ((time - viewStart) / viewDur) * visW;

    if (p.nativeStyle) {
      // Glow effect
      ctx.shadowColor = '#4FC3F7';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, visH);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Top dot
      ctx.fillStyle = '#4FC3F7';
      ctx.beginPath();
      ctx.arc(currentX, 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, visH);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX - 6, 10);
      ctx.lineTo(currentX + 6, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.fillRect(currentX - 25, visH - 20, 50, 16);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(formatTime(time), currentX, visH - 8);
      ctx.textAlign = 'left';
    }
  }

  // ─── Main draw ───
  function drawFrame(time: number) {
    ensureCache();

    const p = P.current;
    const { w: visW, h: visH } = dimsRef.current;
    const canvas = staticRef.current;
    if (!canvas || visW === 0 || visH === 0 || p.duration <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { start: viewStart, end: viewEnd } = calcViewRange(time, p);

    // Background
    ctx.clearRect(0, 0, visW, visH);
    ctx.fillStyle = p.nativeStyle ? '#1a1a2e' : '#f3f4f6';
    ctx.fillRect(0, 0, visW, visH);

    // Grid lines (subtle)
    if (p.nativeStyle) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      const gridLines = 5;
      for (let i = 1; i < gridLines; i++) {
        const y = (visH / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(visW, y);
        ctx.stroke();
      }
    }

    // Cached waveform
    drawCachedWaveform(ctx, viewStart, viewEnd, time);

    // Sections
    drawSections(ctx, viewStart, viewEnd);

    // Drag selection
    drawDragSelection(ctx, viewStart, viewEnd);

    // Section marker
    drawSectionMarker(ctx, viewStart, viewEnd);

    // Playhead (separate canvas)
    drawPlayheadLine(time, viewStart, viewEnd);
  }

  // Stable ref for drawFrame (used in resize handler)
  const drawFrameRef = useRef(drawFrame);
  drawFrameRef.current = drawFrame;

  // ─── Canvas sizing (mount + resize) ───
  useEffect(() => {
    const sc = staticRef.current;
    const pc = playheadRef.current;
    if (!sc || !pc) return;

    const dpr = dprRef.current;

    const setup = () => {
      const rect = sc.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;
      if (w === dimsRef.current.w && h === dimsRef.current.h) return;

      dimsRef.current = { w, h };

      sc.width = w * dpr;
      sc.height = h * dpr;
      pc.width = w * dpr;
      pc.height = h * dpr;

      const sCtx = sc.getContext('2d');
      const pCtx = pc.getContext('2d');
      if (sCtx) sCtx.scale(dpr, dpr);
      if (pCtx) pCtx.scale(dpr, dpr);

      // Invalidate cache on resize
      cacheRef.current.key = '';

      drawFrameRef.current(P.current.currentTime);
    };

    setup();
    const observer = new ResizeObserver(setup);
    observer.observe(sc);
    return () => observer.disconnect();
  }, []);

  // ─── rAF loop (playing) ───
  useEffect(() => {
    if (!isPlaying) return;

    let active = true;
    const loop = () => {
      if (!active) return;
      const elapsed = (performance.now() - interpRef.current.wall) / 1000;
      const t = Math.min(interpRef.current.audio + elapsed, P.current.duration);
      drawFrameRef.current(t);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  // ─── Static redraw (paused, state changes) ───
  useEffect(() => {
    if (isPlaying) return;
    drawFrameRef.current(currentTime);
  }, [
    isPlaying, currentTime, duration, sections, selectedSection,
    zoomLevel, scrollPosition, isCreatingSection, isDragging,
    dragStart, dragEnd, sectionMarkStart, waveformData, nativeStyle,
    centeredPlayhead,
  ]);

  // ─── Touch handlers ───
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY && onDoubleTap) {
      e.preventDefault();
      onDoubleTap();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      currentTarget: e.currentTarget,
      getBoundingClientRect: () => rect,
    } as unknown as React.MouseEvent<HTMLCanvasElement>;
    onMouseDown(mouseEvent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      currentTarget: e.currentTarget,
      getBoundingClientRect: () => rect,
    } as unknown as React.MouseEvent<HTMLCanvasElement>;
    onMouseMove(mouseEvent);
  };

  // ─── JSX ───
  const canvasHeight = nativeStyle ? '140px' : '120px';

  return (
    <div className="relative" style={{ width: '100%', height: canvasHeight }}>
      {/* Static layer (waveform, sections) */}
      <canvas
        ref={staticRef}
        style={{ width: '100%', height: canvasHeight, position: 'absolute', top: 0, left: 0 }}
        className={`${centeredPlayhead ? '' : 'rounded-xl'} ${
          nativeStyle
            ? 'bg-[#1a1a2e]'
            : `border-2 bg-gray-50 ${isCreatingSection ? 'border-green-300' : 'border-gray-200'}`
        }`}
      />
      {/* Dynamic layer (playhead) – handles events */}
      <canvas
        ref={playheadRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={onMouseUp}
        style={{ width: '100%', height: canvasHeight, position: 'absolute', top: 0, left: 0 }}
        className={`${centeredPlayhead ? '' : 'rounded-xl'} ${isCreatingSection ? 'cursor-crosshair' : 'cursor-pointer'}`}
      />
    </div>
  );
}

export default memo(WaveformCanvas);
