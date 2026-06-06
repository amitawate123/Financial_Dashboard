import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../context/ThemeContext';
import { createAppMuiTheme } from '../theme/muiTheme';

export default function MuiThemeWrapper({ children }) {
  const { theme } = useTheme();
  const muiTheme = createAppMuiTheme(theme === 'dark' ? 'dark' : 'light');

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}
