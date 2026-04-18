import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Upload, ChevronRight, Plus, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'music-practice-app-data';

export default function MusicPracticeApp() {
  const [page, setPage] = useState('songs');
  const [songs, setSongs] = useState(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved data:', e);
        }
      }
    }
    return [{ id: 1, name: '비익련리', sessions: [] }];
  });
  const [currentSong, setCurrentSong] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  
  const [showAddSong, setShowAddSong] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [inputValue, setInputValue] = useState('');
  
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [markers, setMarkers] = useState([0]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [editingMemo, setEditingMemo] = useState<number | null>(null);
  const [uploadingSectionId, setUploadingSectionId] = useState<number | null>(null);
  const [selectedRecordings, setSelectedRecordings] = useState<Record<number, number>>({}); // { sectionId: recordingId }
  const [isDraggingProgress, setIsDraggingProgress] = useState<string | number | null>(null); // 'original' or recordingId
  const [dragProgressTime, setDragProgressTime] = useState(0);

  // Dual player states
  const [recordedAudioBuffer, setRecordedAudioBuffer] = useState<Record<number, AudioBuffer>>({});
  const [recordedCurrentTime, setRecordedCurrentTime] = useState<Record<number, number>>({});
  const [recordedIsPlaying, setRecordedIsPlaying] = useState<Record<number, boolean>>({});
  const [recordedStartTime, setRecordedStartTime] = useState<Record<number, number>>({});
  const [recordedPauseTime, setRecordedPauseTime] = useState<Record<number, number>>({});

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [zoomLevel, setZoomLevel] = useState('full'); // 'full', '60s', '30s', '10s'
  const [scrollPosition, setScrollPosition] = useState(0); // 0 to 1
  
  const PREDEFINED_TAGS = [
    { id: 'pitch', label: '음정 불안정', color: 'bg-red-100 text-red-700 border-red-300' },
    { id: 'rhythm', label: '박자 놓침', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { id: 'crack', label: '삑사리', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { id: 'breath', label: '호흡 부족', color: 'bg-green-100 text-green-700 border-green-300' },
    { id: 'tempo', label: '템포 불안정', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { id: 'dynamics', label: '강약 조절', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { id: 'technique', label: '기교 부족', color: 'bg-pink-100 text-pink-700 border-pink-300' },
    { id: 'good', label: '✓ 잘함', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  ];
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const recordedSourceNodeRef = useRef<Record<number, AudioBufferSourceNode | null>>({});
  const recordedAnimationRef = useRef<Record<number, number | null>>({});

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  // Save to localStorage whenever songs change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    }
  }, [songs]);

  // Decode recorded files when session opens
  useEffect(() => {
    if (currentSession && audioContext && sections.length > 0) {
      sections.forEach(async (section) => {
        if (section.recordedFiles && section.recordedFiles.length > 0) {
          section.recordedFiles.forEach(async (recording: any) => {
            if (!recordedAudioBuffer[recording.id]) {
              try {
                const response = await fetch(recording.data);
                const arrayBuffer = await response.arrayBuffer();
                const decoded = await audioContext.decodeAudioData(arrayBuffer);
                setRecordedAudioBuffer(prev => ({
                  ...prev,
                  [recording.id]: decoded
                }));
                
                // Auto-select first recording
                if (!selectedRecordings[section.id]) {
                  setSelectedRecordings(prev => ({ ...prev, [section.id]: recording.id }));
                }
              } catch (err) {
                console.error('Failed to decode recorded file:', err);
              }
            }
          });
        }
      });
    }
  }, [currentSession, audioContext, sections]);

  useEffect(() => {
    if (isPlaying && audioContext) {
      const updateTime = () => {
        const elapsed = audioContext.currentTime - startTime + pauseTime;
        setCurrentTime(Math.min(elapsed, duration));
        
        if (selectedSection && elapsed >= selectedSection.end) {
          stopPlayback();
          return;
        }
        
        if (elapsed < duration) {
          animationRef.current = requestAnimationFrame(updateTime);
        } else {
          stopPlayback();
        }
      };
      animationRef.current = requestAnimationFrame(updateTime);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, startTime, pauseTime, duration, selectedSection, audioContext]);

  const deleteSong = (songId) => {
    setConfirmMessage('이 곡을 삭제하시겠습니까?');
    setConfirmAction(() => () => {
      setSongs(songs.filter(s => s.id !== songId));
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  const deleteSession = (sessionId) => {
    setConfirmMessage('이 연습 세션을 삭제하시겠습니까?');
    setConfirmAction(() => () => {
      const updatedSongs = songs.map(song =>
        song.id === currentSong.id
          ? { ...song, sessions: song.sessions.filter(s => s.id !== sessionId) }
          : song
      );
      setSongs(updatedSongs);
      setCurrentSong(updatedSongs.find(s => s.id === currentSong.id));
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  const handleAddSong = () => {
    if (inputValue.trim()) {
      setSongs([...songs, { id: Date.now(), name: inputValue, sessions: [] }]);
      setInputValue('');
      setShowAddSong(false);
    }
  };

  const handleAddSession = () => {
    if (inputValue.trim()) {
      const newSession = {
        id: Date.now(),
        name: inputValue,
        audioData: null,
        sections: [],
        markers: [0]
      };
      const updatedSongs = songs.map(song =>
        song.id === currentSong.id
          ? { ...song, sessions: [...song.sessions, newSession] }
          : song
      );
      setSongs(updatedSongs);
      setCurrentSong(updatedSongs.find(s => s.id === currentSong.id));
      setInputValue('');
      setShowAddSession(false);
    }
  };

  const openSession = (song, session) => {
    setCurrentSong(song);
    setCurrentSession(session);
    setSections(session.sections || []);
    setMarkers(session.markers || [0]);
    setAudioBuffer(null);
    setWaveformData(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedSection(null);
    setRecordedAudioBuffer({});
    setRecordedCurrentTime({});
    setRecordedIsPlaying({});
    setZoomLevel('full');
    setScrollPosition(0);
    setPage('practice');
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !audioContext) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(arrayBuffer);
      
      setAudioBuffer(decoded);
      setDuration(decoded.duration);
      console.log('✅ Audio loaded, duration:', decoded.duration);
      
      // Generate waveform data
      generateWaveformData(decoded);
      
      if (markers.length === 1 && sections.length === 0) {
        setTimeout(() => createSectionsFromMarkers([0], decoded.duration), 100);
      }
    } catch (err) {
      console.error('Audio decode error:', err);
    }
  };

  const generateWaveformData = (buffer) => {
    const rawData = buffer.getChannelData(0); // Get first channel
    const samples = 800; // Number of bars to display
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];
    
    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      filteredData.push(sum / blockSize);
    }
    
    // Normalize
    const max = Math.max(...filteredData);
    const normalized = filteredData.map(n => n / max);
    
    setWaveformData(normalized);
  };

  const updateSessionData = (updates) => {
    const updatedSongs = songs.map(song =>
      song.id === currentSong.id
        ? {
            ...song,
            sessions: song.sessions.map(sess =>
              sess.id === currentSession.id ? { ...sess, ...updates } : sess
            )
          }
        : song
    );
    setSongs(updatedSongs);
  };

  const createSectionsFromMarkers = (markerList, dur = duration) => {
    if (!dur || dur === 0) return;
    
    const newSections = [];
    for (let i = 0; i < markerList.length; i++) {
      const start = markerList[i];
      const end = i < markerList.length - 1 ? markerList[i + 1] : dur;
      
      const existingSection = sections.find(s => Math.abs(s.start - start) < 0.1);
      newSections.push({
        id: existingSection?.id || Date.now() + i,
        start,
        end,
        recordedFiles: existingSection?.recordedFiles || []
      });
    }
    setSections(newSections);
    updateSessionData({ sections: newSections });
  };

  const toggleRecordingTag = (section, recordingId, tagId) => {
    const updatedSections = sections.map(s => {
      if (s.id === section.id) {
        return {
          ...s,
          recordedFiles: s.recordedFiles.map(r => {
            if (r.id === recordingId) {
              const tags = r.tags || [];
              const hasTag = tags.includes(tagId);
              return {
                ...r,
                tags: hasTag ? tags.filter(t => t !== tagId) : [...tags, tagId]
              };
            }
            return r;
          })
        };
      }
      return s;
    });
    setSections(updatedSections);
    updateSessionData({ sections: updatedSections });
  };

  const saveRecordingMemo = (section, recordingId, memo) => {
    const updatedSections = sections.map(s => {
      if (s.id === section.id) {
        return {
          ...s,
          recordedFiles: s.recordedFiles.map(r =>
            r.id === recordingId ? { ...r, memo } : r
          )
        };
      }
      return s;
    });
    setSections(updatedSections);
    updateSessionData({ sections: updatedSections });
  };

  const addSection = (startTime, endTime) => {
    if (!duration) return;
    
    const newSection = {
      id: Date.now(),
      start: startTime,
      end: endTime,
      recordedFiles: []
    };
    
    const updatedSections = [...sections, newSection].sort((a, b) => a.start - b.start);
    setSections(updatedSections);
    updateSessionData({ sections: updatedSections });
  };

  const deleteSection = (sectionId) => {
    if (selectedSection?.id === sectionId) {
      stopPlayback();
    }
    
    const updatedSections = sections.filter(s => s.id !== sectionId);
    setSections(updatedSections);
    updateSessionData({ sections: updatedSections });
  };

  const getZoomDuration = () => {
    switch (zoomLevel) {
      case '10s': return 10;
      case '30s': return 30;
      case '60s': return 60;
      default: return duration;
    }
  };

  const getVisibleTimeRange = () => {
    const zoomDur = getZoomDuration();
    if (zoomLevel === 'full') {
      return { start: 0, end: duration };
    }
    
    const viewDuration = Math.min(zoomDur, duration);
    const maxScroll = Math.max(0, duration - viewDuration);
    const start = scrollPosition * maxScroll;
    const end = Math.min(start + viewDuration, duration);
    
    return { start, end };
  };

  const handleMouseDown = (e) => {
    if (!duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const { start, end } = getVisibleTimeRange();
    const time = start + (x / rect.width) * (end - start);
    
    if (isCreatingSection) {
      setIsDragging(true);
      setDragStart(time);
      setDragEnd(time);
    } else {
      setDragStart(time);
    }
  };

  const handleMouseMove = (e) => {
    if (!duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const { start, end } = getVisibleTimeRange();
    const time = Math.max(0, Math.min(start + (x / rect.width) * (end - start), duration));
    
    if (isCreatingSection && isDragging) {
      setDragEnd(time);
    }
  };

  const handleMouseUp = () => {
    if (!duration || dragStart === null) return;
    
    if (isCreatingSection && isDragging) {
      if (dragEnd !== null && Math.abs(dragEnd - dragStart) > 0.5) {
        const start = Math.min(dragStart, dragEnd);
        const end = Math.max(dragStart, dragEnd);
        addSection(start, end);
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    } else if (!isCreatingSection && !isDragging) {
      setCurrentTime(dragStart);
      playAudio(dragStart);
      setDragStart(null);
    }
  };

  const playAudio = (startPos = currentTime) => {
    if (!audioBuffer || !audioContext) return;
    
    // 즉시 이전 소스 정리
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        console.log('Previous source already stopped');
      }
      sourceNodeRef.current = null;
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0, startPos);
    
    sourceNodeRef.current = source;
    setStartTime(audioContext.currentTime);
    setPauseTime(startPos);
    setIsPlaying(true);
    
    source.onended = () => {
      if (sourceNodeRef.current === source) {
        sourceNodeRef.current = null;
        setIsPlaying(false);
        setSelectedSection(null);
      }
    };
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        console.log('Source already stopped');
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setSelectedSection(null);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playAudio(currentTime);
    }
  };

  const playSection = (section) => {
    setSelectedSection(section);
    setCurrentTime(section.start);
    playAudio(section.start);
  };

  // Recorded audio playback
  const playRecordedAudio = (recordingId, startPos = 0) => {
    const buffer = recordedAudioBuffer[recordingId];
    if (!buffer || !audioContext) return;
    
    // Stop ALL other recordings first
    Object.keys(recordedSourceNodeRef.current).forEach(key => {
      if (key !== String(recordingId) && recordedSourceNodeRef.current[key]) {
        try {
          recordedSourceNodeRef.current[key].stop();
          recordedSourceNodeRef.current[key].disconnect();
        } catch (e) {}
        recordedSourceNodeRef.current[key] = null;
        
        if (recordedAnimationRef.current[key]) {
          cancelAnimationFrame(recordedAnimationRef.current[key]);
          recordedAnimationRef.current[key] = null;
        }
        
        setRecordedIsPlaying(prev => ({ ...prev, [key]: false }));
      }
    });
    
    // Stop previous instance of the same recording
    if (recordedSourceNodeRef.current[recordingId]) {
      try {
        recordedSourceNodeRef.current[recordingId].stop();
        recordedSourceNodeRef.current[recordingId].disconnect();
      } catch (e) {}
      if (recordedAnimationRef.current[recordingId]) {
        cancelAnimationFrame(recordedAnimationRef.current[recordingId]);
      }
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0, startPos);
    
    recordedSourceNodeRef.current[recordingId] = source;
    const startTimeVal = audioContext.currentTime;
    setRecordedStartTime(prev => ({ ...prev, [recordingId]: startTimeVal }));
    setRecordedPauseTime(prev => ({ ...prev, [recordingId]: startPos }));
    setRecordedIsPlaying(prev => ({ ...prev, [recordingId]: true }));
    
    // Animation loop
    const updateTime = () => {
      const elapsed = audioContext.currentTime - startTimeVal + startPos;
      setRecordedCurrentTime(prev => ({ ...prev, [recordingId]: Math.min(elapsed, buffer.duration) }));
      
      if (elapsed < buffer.duration && recordedSourceNodeRef.current[recordingId]) {
        recordedAnimationRef.current[recordingId] = requestAnimationFrame(updateTime);
      } else {
        stopRecordedPlayback(recordingId);
      }
    };
    recordedAnimationRef.current[recordingId] = requestAnimationFrame(updateTime);
    
    source.onended = () => {
      if (recordedSourceNodeRef.current[recordingId] === source) {
        stopRecordedPlayback(recordingId);
      }
    };
  };

  const stopRecordedPlayback = (recordingId) => {
    if (recordedSourceNodeRef.current[recordingId]) {
      try {
        recordedSourceNodeRef.current[recordingId].stop();
        recordedSourceNodeRef.current[recordingId].disconnect();
      } catch (e) {}
      recordedSourceNodeRef.current[recordingId] = null;
    }
    if (recordedAnimationRef.current[recordingId]) {
      cancelAnimationFrame(recordedAnimationRef.current[recordingId]);
    }
    setRecordedIsPlaying(prev => ({ ...prev, [recordingId]: false }));
  };

  const toggleRecordedPlay = (recordingId) => {
    if (recordedIsPlaying[recordingId]) {
      stopRecordedPlayback(recordingId);
    } else {
      playRecordedAudio(recordingId, recordedCurrentTime[recordingId] || 0);
    }
  };

  // Seek functions
  const seekOriginal = (section, time) => {
    const seekTime = section.start + time;
    setCurrentTime(seekTime);
    
    if (isPlaying && selectedSection?.id === section.id) {
      playAudio(seekTime);
    }
  };

  const seekRecorded = (recordingId, time) => {
    setRecordedCurrentTime(prev => ({ ...prev, [recordingId]: time }));
    
    if (recordedIsPlaying[recordingId]) {
      playRecordedAudio(recordingId, time);
    }
  };

  const handleRecordedFileUpload = async (e, section) => {
    const file = e.target.files[0];
    if (!file || !audioContext) return;

    try {
      setUploadingSectionId(section.id);
      
      // Decode audio for playback
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create recording object
      const recordingId = Date.now();
      const now = new Date();
      const recordingName = `녹음 ${(section.recordedFiles?.length || 0) + 1}`;
      
      // Store decoded buffer
      setRecordedAudioBuffer(prev => ({
        ...prev,
        [recordingId]: decoded
      }));
      
      // Convert to base64 and save
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        
        const newRecording = {
          id: recordingId,
          name: recordingName,
          uploadDate: now.toISOString(),
          data: base64Data,
          tags: [],
          memo: ''
        };
        
        // Add to the BEGINNING of the array (최신순)
        const updatedSections = sections.map(s =>
          s.id === section.id 
            ? { ...s, recordedFiles: [newRecording, ...(s.recordedFiles || [])] }
            : s
        );
        setSections(updatedSections);
        updateSessionData({ sections: updatedSections });
        
        // Auto-select the new recording
        setSelectedRecordings(prev => ({ ...prev, [section.id]: recordingId }));
        
        setUploadingSectionId(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadingSectionId(null);
    }
  };

  const deleteRecording = (section, recordingId) => {
    const updatedSections = sections.map(s =>
      s.id === section.id
        ? { ...s, recordedFiles: s.recordedFiles.filter(r => r.id !== recordingId) }
        : s
    );
    setSections(updatedSections);
    updateSessionData({ sections: updatedSections });
    
    // Clear selection if deleted
    if (selectedRecordings[section.id] === recordingId) {
      const remaining = updatedSections.find(s => s.id === section.id)?.recordedFiles;
      setSelectedRecordings(prev => ({
        ...prev,
        [section.id]: remaining?.[0]?.id || null
      }));
    }
    
    // Clear audio buffer
    setRecordedAudioBuffer(prev => {
      const newBuffers = { ...prev };
      delete newBuffers[recordingId];
      return newBuffers;
    });
  };

  const renameRecording = (section, recordingId, newName) => {
    const updatedSections = sections.map(s =>
      s.id === section.id
        ? {
            ...s,
            recordedFiles: s.recordedFiles.map(r =>
              r.id === recordingId ? { ...r, name: newName } : r
            )
          }
        : s
    );
    setSections(updatedSections);
    updateSessionData({ sections: updatedSections });
  };

  const saveMemo = (section, memo) => {
    const updatedSections = sections.map(s =>
      s.id === section.id ? { ...s, memo } : s
    );
    setSections(updatedSections);
    updateSessionData({ sections: updatedSections });
    setEditingMemo(null);
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isPlaying && zoomLevel !== 'full' && duration > 0) {
      const { start, end } = getVisibleTimeRange();
      
      // Auto-scroll to follow playhead
      if (currentTime < start || currentTime > end) {
        const zoomDur = getZoomDuration();
        const viewDuration = Math.min(zoomDur, duration);
        const maxScroll = Math.max(0, duration - viewDuration);
        
        // Center the playhead
        const targetStart = Math.max(0, currentTime - viewDuration / 2);
        const newScrollPos = targetStart / maxScroll;
        setScrollPosition(Math.min(1, Math.max(0, newScrollPos)));
      }
    }
  }, [currentTime, isPlaying, zoomLevel, duration]);

  useEffect(() => {
    if (canvasRef.current && duration > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);
      
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);
      
      const { start: viewStart, end: viewEnd } = getVisibleTimeRange();
      const viewDuration = viewEnd - viewStart;
      
      // Helper function to convert time to x position
      const timeToX = (time) => {
        return ((time - viewStart) / viewDuration) * width;
      };
      
      // Draw waveform
      if (waveformData && waveformData.length > 0) {
        ctx.fillStyle = '#8b5cf6';
        
        // Calculate which samples to show
        const startSample = Math.floor((viewStart / duration) * waveformData.length);
        const endSample = Math.ceil((viewEnd / duration) * waveformData.length);
        const visibleSamples = waveformData.slice(startSample, endSample);
        
        const barWidth = width / visibleSamples.length;
        
        visibleSamples.forEach((value, i) => {
          const x = i * barWidth;
          const barHeight = value * height * 0.8;
          const y = (height - barHeight) / 2;
          ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
        });
      }
      
      // Draw sections (only visible ones)
      sections.forEach((section, idx) => {
        // Skip if section is outside visible range
        if (section.end < viewStart || section.start > viewEnd) return;
        
        const startX = timeToX(section.start);
        const endX = timeToX(section.end);
        
        const isCurrentSection = selectedSection?.id === section.id && isPlaying;
        
        if (isCurrentSection) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
        } else {
          ctx.fillStyle = idx % 2 === 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        }
        ctx.fillRect(Math.max(0, startX), 0, Math.min(width, endX) - Math.max(0, startX), height);
        
        ctx.strokeStyle = isCurrentSection ? '#22c55e' : '#ef4444';
        ctx.lineWidth = isCurrentSection ? 3 : 2;
        
        if (startX >= 0 && startX <= width) {
          ctx.beginPath();
          ctx.moveTo(startX, 0);
          ctx.lineTo(startX, height);
          ctx.stroke();
        }
        
        if (endX >= 0 && endX <= width) {
          ctx.beginPath();
          ctx.moveTo(endX, 0);
          ctx.lineTo(endX, height);
          ctx.stroke();
        }
        
        if (startX >= 0 && startX <= width) {
          ctx.fillStyle = isCurrentSection ? '#22c55e' : '#ef4444';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`${idx + 1}`, startX + 3, 12);
        }
      });
      
      // Draw drag selection
      if (isCreatingSection && isDragging && dragStart !== null && dragEnd !== null) {
        const startX = timeToX(Math.min(dragStart, dragEnd));
        const endX = timeToX(Math.max(dragStart, dragEnd));
        const startTimeVal = Math.min(dragStart, dragEnd);
        const endTimeVal = Math.max(dragStart, dragEnd);
        
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.fillRect(startX, 0, endX - startX, height);
        
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const drawTimeLabel = (x, time, align) => {
          const label = formatTime(time);
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
        
        drawTimeLabel(startX, startTimeVal, 'left');
        drawTimeLabel(endX, endTimeVal, 'right');
        
        const centerX = (startX + endX) / 2;
        const durationLabel = `${formatTime(endTimeVal - startTimeVal)}`;
        const durationWidth = ctx.measureText(durationLabel).width + 12;
        ctx.fillStyle = '#059669';
        ctx.fillRect(centerX - durationWidth / 2, height - 25, durationWidth, 18);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(durationLabel, centerX, height - 12);
        ctx.textAlign = 'left';
      }
      
      // Draw current time playhead
      if (currentTime >= viewStart && currentTime <= viewEnd) {
        const currentX = timeToX(currentTime);
        
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.stroke();
        
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX - 6, 10);
        ctx.lineTo(currentX + 6, 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(currentX - 25, height - 20, 50, 16);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formatTime(currentTime), currentX, height - 8);
        ctx.textAlign = 'left';
      }
    }
  }, [duration, sections, currentTime, isDragging, dragStart, dragEnd, selectedSection, isPlaying, isCreatingSection, waveformData, zoomLevel, scrollPosition]);

  const Modal = ({ show, onClose, title, onSubmit }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-96 max-w-full mx-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="이름을 입력하세요"
            className="w-full border border-gray-300 rounded-lg p-3 mb-4"
            autoFocus
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">취소</button>
            <button onClick={onSubmit} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg">추가</button>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmModal = ({ show, message, onConfirm, onCancel }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-96 max-w-full mx-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">확인</h2>
          <p className="text-gray-700 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg">취소</button>
            <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg">삭제</button>
          </div>
        </div>
      </div>
    );
  };

  if (page === 'songs') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">🎵 내 곡 목록</h1>
              <button onClick={() => setShowAddSong(true)} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />곡 추가
              </button>
            </div>
            <div className="space-y-3">
              {songs.map(song => (
                <div key={song.id} className="relative group">
                  <button onClick={() => { setCurrentSong(song); setPage('sessions'); }} className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 p-6 rounded-xl flex justify-between items-center transition">
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800 text-lg">{song.name}</h3>
                      <p className="text-sm text-gray-600">{song.sessions.length}개의 연습</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSong(song.id); }} className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Modal show={showAddSong} onClose={() => { setShowAddSong(false); setInputValue(''); }} title="새 곡 추가" onSubmit={handleAddSong} />
        <ConfirmModal show={showConfirm} message={confirmMessage} onConfirm={confirmAction} onCancel={() => setShowConfirm(false)} />
      </div>
    );
  }

  if (page === 'sessions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button onClick={() => setPage('songs')} className="text-purple-600 mb-4 flex items-center gap-2">← 뒤로</button>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{currentSong.name}</h1>
                <p className="text-gray-600">연습 세션</p>
              </div>
              <button onClick={() => setShowAddSession(true)} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />세션 추가
              </button>
            </div>
            <div className="space-y-3">
              {currentSong.sessions.map(session => (
                <div key={session.id} className="relative group">
                  <button onClick={() => openSession(currentSong, session)} className="w-full bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 p-6 rounded-xl flex justify-between items-center transition">
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800 text-lg">{session.name}</h3>
                      <p className="text-sm text-gray-600">{session.sections?.length || 0}개 구간</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Modal show={showAddSession} onClose={() => { setShowAddSession(false); setInputValue(''); }} title="새 연습 세션 추가" onSubmit={handleAddSession} />
        <ConfirmModal show={showConfirm} message={confirmMessage} onConfirm={confirmAction} onCancel={() => setShowConfirm(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button onClick={() => setPage('sessions')} className="text-purple-600 mb-4 flex items-center gap-2">← 뒤로</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{currentSession?.name}</h1>
          <p className="text-gray-600 mb-6">{currentSong?.name}</p>

          {!audioBuffer ? (
            <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 mb-6">
              <label className="flex flex-col items-center cursor-pointer">
                <Upload className="w-8 h-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">원곡 파일 업로드</span>
                <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 text-white p-2 rounded-lg"><Upload className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">원곡 파일 업로드됨</p>
                    <p className="text-xs text-gray-600">길이: {formatTime(duration)}</p>
                  </div>
                </div>
                <label className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
                  파일 교체
                  <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                </label>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">
                    {isCreatingSection ? '🎯 드래그하여 구간 선택' : '▶️ 클릭하여 위치 이동'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">줌:</span>
                    <button
                      onClick={() => { setZoomLevel('full'); setScrollPosition(0); }}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        zoomLevel === 'full' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setZoomLevel('60s')}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        zoomLevel === '60s' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      1분
                    </button>
                    <button
                      onClick={() => setZoomLevel('30s')}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        zoomLevel === '30s' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      30초
                    </button>
                    <button
                      onClick={() => setZoomLevel('10s')}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        zoomLevel === '10s' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      10초
                    </button>
                    <button
                      onClick={() => setIsCreatingSection(!isCreatingSection)}
                      className={`ml-2 px-4 py-1 rounded-lg text-sm font-medium transition ${
                        isCreatingSection
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {isCreatingSection ? '✓ 구간 생성 모드' : '+ 구간 생성하기'}
                    </button>
                  </div>
                </div>
                <canvas 
                  ref={canvasRef} 
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ width: '100%', height: '120px' }} 
                  className={`border-2 rounded-lg bg-gray-50 ${
                    isCreatingSection 
                      ? 'border-green-300 cursor-crosshair' 
                      : 'border-gray-200 cursor-pointer'
                  }`}
                />
                {zoomLevel !== 'full' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">스크롤:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={scrollPosition}
                        onChange={(e) => setScrollPosition(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="text-xs text-gray-600 min-w-[60px]">
                        {formatTime(getVisibleTimeRange().start)} - {formatTime(getVisibleTimeRange().end)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button onClick={togglePlay} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? '일시정지' : '재생'}
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">구간 목록</h3>
                {sections.map((section, idx) => (
                  <div key={section.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">구간 {idx + 1}</h4>
                        <p className="text-sm text-gray-600">{formatTime(section.start)} - {formatTime(section.end)}</p>
                      </div>
                      <button onClick={() => deleteSection(section.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {editingMemo === section.id ? (
                      <div className="mb-3">
                        <textarea defaultValue={section.memo} placeholder="메모 입력..." className="w-full border border-gray-300 rounded-lg p-2 text-sm" rows={2} onBlur={(e) => saveMemo(section, e.target.value)} autoFocus />
                      </div>
                    ) : (
                      <div onClick={() => setEditingMemo(section.id)} className="mb-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <p className="text-sm text-gray-700">{section.memo || '메모를 추가하려면 클릭...'}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mb-3">
                      <button onClick={() => playSection(section)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" />원곡 듣기
                      </button>
                      
                      <label className={`flex-1 ${uploadingSectionId === section.id ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer`}>
                        <Upload className="w-4 h-4" />
                        {uploadingSectionId === section.id ? '업로드 중...' : '+ 녹음 추가'}
                        <input 
                          type="file" 
                          accept="audio/*" 
                          onChange={(e) => handleRecordedFileUpload(e, section)}
                          disabled={uploadingSectionId === section.id}
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Recordings List */}
                    {section.recordedFiles && section.recordedFiles.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">내 녹음 목록</h5>
                        <div className="space-y-2">
                          {section.recordedFiles.map((recording, idx) => (
                            <div 
                              key={recording.id}
                              className={`flex items-center justify-between p-3 rounded-lg border-2 transition ${
                                selectedRecordings[section.id] === recording.id
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <button
                                  onClick={() => setSelectedRecordings(prev => ({ ...prev, [section.id]: recording.id }))}
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedRecordings[section.id] === recording.id
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {selectedRecordings[section.id] === recording.id && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={recording.name}
                                    onChange={(e) => renameRecording(section, recording.id, e.target.value)}
                                    className="bg-transparent font-medium text-gray-800 text-sm border-none outline-none w-full"
                                  />
                                  <p className="text-xs text-gray-500">
                                    {new Date(recording.uploadDate).toLocaleString('ko-KR', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteRecording(section, recording.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.recordedFiles && section.recordedFiles.length > 0 && selectedRecordings[section.id] && recordedAudioBuffer[selectedRecordings[section.id]] && (
                      <div className="bg-gradient-to-r from-blue-50 to-red-50 rounded-xl p-4 border-2 border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          🎵 A/B 비교 플레이어
                          <span className="text-xs text-gray-600 font-normal">
                            ({section.recordedFiles.find(r => r.id === selectedRecordings[section.id])?.name})
                          </span>
                        </h4>
                        
                        {/* Original Track */}
                        <div className="bg-blue-100 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">🔵 원곡</span>
                            <span className="text-xs text-blue-700">{formatTime(currentTime)} / {formatTime(section.end - section.start)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                if (selectedSection?.id === section.id && isPlaying) {
                                  stopPlayback();
                                } else {
                                  playSection(section);
                                }
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg flex-shrink-0"
                            >
                              {selectedSection?.id === section.id && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 relative">
                              <input
                                type="range"
                                min="0"
                                max={section.end - section.start}
                                step="0.1"
                                value={selectedSection?.id === section.id ? currentTime - section.start : 0}
                                onChange={(e) => {
                                  const time = parseFloat(e.target.value);
                                  setDragProgressTime(time);
                                  setIsDraggingProgress('original');
                                  seekOriginal(section, time);
                                }}
                                onMouseDown={() => setIsDraggingProgress('original')}
                                onMouseUp={() => setIsDraggingProgress(null)}
                                onMouseMove={(e) => {
                                  if (isDraggingProgress === 'original') {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percentage = x / rect.width;
                                    const time = percentage * (section.end - section.start);
                                    setDragProgressTime(Math.max(0, Math.min(time, section.end - section.start)));
                                  }
                                }}
                                className="w-full h-2 bg-blue-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                              />
                              {isDraggingProgress === 'original' && (
                                <div 
                                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                                  style={{
                                    left: `${(dragProgressTime / (section.end - section.start)) * 100}%`
                                  }}
                                >
                                  {formatTime(dragProgressTime)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Recorded Track */}
                        <div className="bg-red-100 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-900">🔴 내 녹음</span>
                            <span className="text-xs text-red-700">{formatTime(recordedCurrentTime[selectedRecordings[section.id]] || 0)} / {formatTime(recordedAudioBuffer[selectedRecordings[section.id]]?.duration || 0)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleRecordedPlay(selectedRecordings[section.id])}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg flex-shrink-0"
                            >
                              {recordedIsPlaying[selectedRecordings[section.id]] ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 relative">
                              <input
                                type="range"
                                min="0"
                                max={recordedAudioBuffer[selectedRecordings[section.id]]?.duration || 0}
                                step="0.1"
                                value={recordedCurrentTime[selectedRecordings[section.id]] || 0}
                                onChange={(e) => {
                                  const time = parseFloat(e.target.value);
                                  setDragProgressTime(time);
                                  setIsDraggingProgress(selectedRecordings[section.id]);
                                  seekRecorded(selectedRecordings[section.id], time);
                                }}
                                onMouseDown={() => setIsDraggingProgress(selectedRecordings[section.id])}
                                onMouseUp={() => setIsDraggingProgress(null)}
                                onMouseMove={(e) => {
                                  if (isDraggingProgress === selectedRecordings[section.id]) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percentage = x / rect.width;
                                    const maxDuration = recordedAudioBuffer[selectedRecordings[section.id]]?.duration || 0;
                                    const time = percentage * maxDuration;
                                    setDragProgressTime(Math.max(0, Math.min(time, maxDuration)));
                                  }
                                }}
                                className="w-full h-2 bg-red-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                              />
                              {isDraggingProgress === selectedRecordings[section.id] && (
                                <div 
                                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                                  style={{
                                    left: `${(dragProgressTime / (recordedAudioBuffer[selectedRecordings[section.id]]?.duration || 1)) * 100}%`
                                  }}
                                >
                                  {formatTime(dragProgressTime)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sync Controls */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              playSection(section);
                              if (recordedAudioBuffer[selectedRecordings[section.id]]) {
                                playRecordedAudio(selectedRecordings[section.id], 0);
                              }
                            }}
                            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            동시 재생
                          </button>
                          <button
                            onClick={() => {
                              setRecordedCurrentTime(prev => ({ ...prev, [selectedRecordings[section.id]]: 0 }));
                              setCurrentTime(section.start);
                            }}
                            className="px-4 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium"
                          >
                            처음으로
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}