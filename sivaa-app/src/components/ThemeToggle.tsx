'use client';

import { useState } from 'react';
import { Sun, Moon, Eye } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    toggleTheme();
    setTimeout(() => setAnimating(false), 300);
  };

  const label =
    theme === 'light'
      ? 'Switch to dark mode'
      : theme === 'dark'
        ? 'Switch to high contrast mode'
        : 'Switch to light mode';

  return (
    <button
      type="button"
      className={`theme-toggle${animating ? ' is-animating' : ''}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      {theme === 'light' && <Sun className="icon-sun" aria-hidden />}
      {theme === 'dark' && <Moon className="icon-moon" aria-hidden />}
      {theme === 'high-contrast' && <Eye className="icon-moon" aria-hidden />}
    </button>
  );
}
