import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Logout from '@mui/icons-material/Logout';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/client';
import { useProfileAvatar, getInitials } from '../../hooks/useProfileAvatar';

const roleColor = { admin: 'error', user: 'primary' };

export default function ProfileMenu() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const avatarSrc = useProfileAvatar(user);
  const fileInputRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const open = Boolean(anchorEl);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await authAPI.uploadAvatar(file);
      await refreshUser();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
        aria-label="Account menu"
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ p: 0.5 }}
      >
        <Avatar
          src={avatarSrc || undefined}
          alt={user.name}
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            fontSize: 14,
            fontWeight: 600,
            border: '2px solid',
            borderColor: 'divider',
          }}
        >
          {getInitials(user.name)}
        </Avatar>
      </IconButton>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={handleAvatarChange}
      />

      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { minWidth: 260, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={avatarSrc || undefined}
            alt={user.name}
            sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 600 }}
          >
            {getInitials(user.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user.email}
            </Typography>
            <Chip
              label={user.role}
              size="small"
              color={roleColor[user.role] || 'default'}
              sx={{ mt: 0.5, height: 20, fontSize: 10, textTransform: 'uppercase' }}
            />
          </Box>
        </Box>

        <Divider />

        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          disabled={uploading}
        >
          <ListItemIcon>
            <PhotoCamera fontSize="small" />
          </ListItemIcon>
          <ListItemText>{uploading ? 'Uploading…' : 'Change photo'}</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
