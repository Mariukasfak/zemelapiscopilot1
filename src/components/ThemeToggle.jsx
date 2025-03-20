import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Patikrinti, ar yra išsaugotas pasirinkimas localStorage arba naudoti prefers-color-scheme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
      setIsDarkTheme(false);
      document.body.classList.remove('dark-theme');
    } else {
      // Jei nėra išsaugoto pasirinkimo, naudoti sistemos nustatymus
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(prefersDark);
      if (prefersDark) {
        document.body.classList.add('dark-theme');
      }
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    
    if (!isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--button-bg-color)',
        color: 'var(--button-text-color)',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 12px',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      }}
      aria-label="Perjungti temą"
    >
      {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
      <span style={{ marginLeft: '8px' }}>
        {isDarkTheme ? 'Šviesi tema' : 'Tamsi tema'}
      </span>
    </button>
  );
}

export default ThemeToggle;
