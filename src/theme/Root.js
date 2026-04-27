import React, {useEffect, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import {AUTH_ROUTE_PATH} from '../auth/config';
import {buildAuthRedirectPath} from '../auth/redirect';
import {hasValidSession} from '../auth/session';

export default function Root({children}) {
  const location = useLocation();
  const [isAllowed, setIsAllowed] = useState(false);

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

  if (typeof window === 'undefined' || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}
