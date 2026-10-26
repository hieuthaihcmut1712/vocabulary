import React, { createContext, useContext, useState, useEffect } from 'react';

// Intercept window.fetch to automatically include X-User-Profile header in all requests immediately
if (typeof window !== 'undefined' && !window.__originalFetch) {
  window.__originalFetch = window.fetch;
  window.fetch = async (input, init = {}) => {
    const headers = new Headers(init?.headers || {});
    if (!headers.has('X-User-Profile')) {
      const currentProfile = localStorage.getItem('app_user_profile') || 'hieu';
      headers.set('X-User-Profile', currentProfile);
    }
    return window.__originalFetch(input, { ...init, headers });
  };
}

const ProfileContext = createContext({
  profile: 'hieu',
  isDTan: false,
  setProfile: () => {},
  switchProfile: () => {}
});

export const ProfileProvider = ({ children }) => {
  const [profile, setProfileState] = useState(() => {
    return localStorage.getItem('app_user_profile') || 'hieu';
  });

  const isDTan = profile === 'dtan';

  const setProfile = (newProfile) => {
    const val = newProfile === 'dtan' ? 'dtan' : 'hieu';
    localStorage.setItem('app_user_profile', val);
    setProfileState(val);
  };

  const switchProfile = () => {
    setProfile(profile === 'hieu' ? 'dtan' : 'hieu');
  };

  return (
    <ProfileContext.Provider value={{ profile, isDTan, setProfile, switchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
export default ProfileContext;
