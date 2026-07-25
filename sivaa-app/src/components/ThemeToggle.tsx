'use client';

import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    toggleTheme();
    setTimeout(() => setAnimating(false), 300);
  };

  const label =
    theme === 'light'
      ? 'Switch to dark mode'
      : 'Switch to light mode';

  return (
    <button
      type="button"
      className={`theme-toggle${animating ? ' is-animating' : ''}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      {mounted && theme === 'light' && <Sun className="icon-sun" aria-hidden />}
      {mounted && theme === 'dark' && <Moon className="icon-moon" aria-hidden />}
    </button>
  );
}
