import { createTheme } from '@mui/material/styles';

export const createAppMuiTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#3b82f6' : '#2563eb' },
      background: {
        default: mode === 'dark' ? '#0f0f0e' : '#f7f6f3',
        paper: mode === 'dark' ? '#1a1917' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f5f4f1' : '#1a1916',
        secondary: mode === 'dark' ? '#a8a59e' : '#6b6860',
      },
      divider: mode === 'dark' ? '#2a2825' : '#e8e6e1',
      error: { main: mode === 'dark' ? '#ef4444' : '#dc2626' },
      success: { main: mode === 'dark' ? '#22c55e' : '#16a34a' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: "'DM Sans', sans-serif",
    },
    components: {
      MuiMenu: {
        styleOverrides: {
          paper: {
            border: '1px solid',
            borderColor: mode === 'dark' ? '#2a2825' : '#e8e6e1',
            boxShadow:
              mode === 'dark'
                ? '0 4px 12px rgba(0,0,0,.45)'
                : '0 4px 12px rgba(0,0,0,.08)',
          },
        },
      },
    },
  });
