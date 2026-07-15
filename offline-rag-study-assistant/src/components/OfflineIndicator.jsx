import React, { useState, useEffect } from 'react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <div className={`offline-badge ${isOnline ? 'online' : 'offline'}`}>
      <span>{isOnline ? '🌐' : '🔌'}</span>
      <span>{isOnline ? 'Online' : 'Offline — 100% on-device'}</span>
    </div>
  );
};

export default OfflineIndicator;