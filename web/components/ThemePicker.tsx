import React, { FC } from 'react';
import Image from 'next/image';
import { Theme, getThemes } from '../themes';

export interface ThemePickerProps {
  selectedThemeId: string;
  onThemeSelect: (themeId: string) => void;
}

/**
 * Theme picker component that displays available themes in a grid
 * and allows users to select one
 */
const ThemePicker: FC<ThemePickerProps> = ({ 
  selectedThemeId, 
  onThemeSelect 
}) => {
  const themes = getThemes();

  // Handle theme selection
  const handleThemeSelect = (themeId: string) => {
    onThemeSelect(themeId);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose a Theme</h2>
      <p className="text-gray-600 mb-6">
        Select a theme for your link-in-bio page. Each theme has a unique style and features.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map((theme) => (
          <div
            key={theme.meta.id}
            className={`
              border rounded-lg overflow-hidden cursor-pointer transition-all duration-200
              ${selectedThemeId === theme.meta.id 
                ? 'border-primary-500 ring-2 ring-primary-200' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => handleThemeSelect(theme.meta.id)}
          >
            {/* Theme thumbnail */}
            <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
              {theme.meta.thumbnailSrc ? (
                <Image 
                  src={theme.meta.thumbnailSrc} 
                  alt={`${theme.meta.name} preview`}
                  width={200} 
                  height={200} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Theme info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{theme.meta.name}</h3>
                {selectedThemeId === theme.meta.id && (
                  <div className="bg-primary-500 text-white p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{theme.meta.description}</p>
              
              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-2">
                {theme.meta.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemePicker;
