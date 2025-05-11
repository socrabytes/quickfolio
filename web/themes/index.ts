/**
 * Theme registry and interfaces for Quickfolio theme system
 * Provides type-safe definitions for theme components and metadata
 */
import { ReactNode } from 'react';
import { MVPContentData } from '../types/mvp';

/**
 * Theme metadata defining a single theme option
 */
export interface ThemeMeta {
  id: string;               // Unique identifier (e.g., 'lynx', 'nebula')
  name: string;             // Display name (e.g., 'Lynx - Classic Hugo Theme')
  description: string;      // Short description of the theme
  thumbnailSrc: string;     // Path to thumbnail image
  tags: string[];           // Tags for filtering (e.g., 'minimal', 'dark', 'professional')
}

/**
 * Type of file generated for different themes
 */
export type GeneratedFileType = 'toml' | 'html' | 'zip';

/**
 * Result of theme generator function
 */
export interface GeneratedOutput {
  content: string;          // The generated content (TOML, HTML, etc.)
  filename: string;         // Suggested filename for download
  fileType: GeneratedFileType; // Type of file for proper handling
  mimeType: string;         // MIME type for downloads
}

/**
 * Generator function signature for converting MVPContentData to theme-specific output
 */
export type ThemeGenerator = (data: MVPContentData) => GeneratedOutput;

/**
 * Complete theme definition including metadata, preview, and generator
 */
export interface Theme {
  meta: ThemeMeta;
  previewComponent: React.ComponentType<{ data: MVPContentData }>;
  generator: ThemeGenerator;
}

// Theme registry - import and register all available themes
// Will be populated from each theme's index file
const themes: Record<string, Theme> = {};

/**
 * Register a new theme in the registry
 */
export function registerTheme(theme: Theme): void {
  if (themes[theme.meta.id]) {
    console.warn(`Theme with ID '${theme.meta.id}' already registered. Overwriting.`);
  }
  themes[theme.meta.id] = theme;
}

/**
 * Get all registered themes
 */
export function getThemes(): Theme[] {
  return Object.values(themes);
}

/**
 * Get a specific theme by ID
 */
export function getTheme(id: string): Theme | undefined {
  return themes[id];
}

/**
 * Get the default theme ID
 */
export function getDefaultThemeId(): string {
  // For now, return 'lynx' as the default theme
  // This could be configurable in the future
  return 'lynx';
}

// Export theme registry
export default themes;
