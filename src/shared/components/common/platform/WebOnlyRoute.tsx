import { type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlatform } from '../../../hooks/usePlatform';

interface Props {
  element: ReactElement;
  redirectTo?: string;
}

export default function WebOnlyRoute({ element, redirectTo = '/account-info' }: Props) {
  const { isNative } = usePlatform();
  if (isNative) return <Navigate to={redirectTo} replace />;
  return element;
}
