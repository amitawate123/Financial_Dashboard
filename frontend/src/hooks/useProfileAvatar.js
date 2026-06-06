import { useState, useEffect } from 'react';
import { authAPI } from '../api/client';

export function useProfileAvatar(user) {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const fileId = user?.avatarFileId;

  useEffect(() => {
    if (!fileId) {
      setAvatarSrc(null);
      return undefined;
    }

    let revoked = false;
    let objectUrl = null;

    authAPI
      .getAvatarBlob()
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setAvatarSrc(objectUrl);
      })
      .catch(() => {
        if (!revoked) setAvatarSrc(null);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, user?._id]);

  return avatarSrc;
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
