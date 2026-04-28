import React, {useEffect, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import {AUTH_ROUTE_PATH} from '../auth/config';
import {buildAuthRedirectPath} from '../auth/redirect';
import {hasValidSession} from '../auth/session';
import SearchModal from './SearchModal';

const MODAL_SHORTCUT_KEY = 'k';

export default function Root({children}) {
  const location = useLocation();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isAuthRoute =
      location.pathname === AUTH_ROUTE_PATH ||
      location.pathname.startsWith(`${AUTH_ROUTE_PATH}/`);

    if (isAuthRoute || hasValidSession()) {
      setIsAllowed(true);
      return;
    }

    setIsAllowed(false);

    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    window.location.replace(buildAuthRedirectPath(currentPath));
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === MODAL_SHORTCUT_KEY) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    const handleCustomEvent = (event) => {
      if (event.detail === 'open-search-modal') {
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search-modal', handleCustomEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search-modal', handleCustomEvent);
    };
  }, []);

  if (typeof window === 'undefined' || !isAllowed) {
    return null;
  }

  return (
    <>
      {children}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
