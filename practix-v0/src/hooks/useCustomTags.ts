'use client';

import { useState, useEffect, useCallback } from 'react';
import { CustomTag, TAG_COLOR_PRESETS, getColorClass } from '@/types';

const STORAGE_KEY = 'music-practice-custom-tags';

// 기본 커스텀 태그 (예시)
const DEFAULT_CUSTOM_TAGS: CustomTag[] = [];

export function useCustomTags() {
  const [customTags, setCustomTags] = useState<CustomTag[]>(DEFAULT_CUSTOM_TAGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomTags(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load custom tags:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever tags change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customTags));
      } catch (e) {
        console.error('Failed to save custom tags:', e);
      }
    }
  }, [customTags, isLoaded]);

  // Add a new custom tag
  const addTag = useCallback((label: string, colorPresetId: string) => {
    const preset = TAG_COLOR_PRESETS.find(p => p.id === colorPresetId) || TAG_COLOR_PRESETS[0];
    const newTag: CustomTag = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: label.trim(),
      color: getColorClass(preset),
      createdAt: new Date().toISOString(),
    };
    setCustomTags(prev => [...prev, newTag]);
    return newTag;
  }, []);

  // Update an existing tag
  const updateTag = useCallback((id: string, updates: Partial<Pick<CustomTag, 'label' | 'color'>>) => {
    setCustomTags(prev => prev.map(tag => {
      if (tag.id === id) {
        return {
          ...tag,
          ...(updates.label !== undefined && { label: updates.label.trim() }),
          ...(updates.color !== undefined && { color: updates.color }),
        };
      }
      return tag;
    }));
  }, []);

  // Delete a tag
  const deleteTag = useCallback((id: string) => {
    setCustomTags(prev => prev.filter(tag => tag.id !== id));
  }, []);

  // Get tag by ID
  const getTagById = useCallback((id: string) => {
    return customTags.find(tag => tag.id === id);
  }, [customTags]);

  // Check if a label already exists
  const isLabelTaken = useCallback((label: string, excludeId?: string) => {
    const normalizedLabel = label.trim().toLowerCase();
    return customTags.some(
      tag => tag.label.toLowerCase() === normalizedLabel && tag.id !== excludeId
    );
  }, [customTags]);

  return {
    customTags,
    isLoaded,
    addTag,
    updateTag,
    deleteTag,
    getTagById,
    isLabelTaken,
  };
}
