import { Navigate, useLocation } from 'react-router-dom';

export default function LoginRequired() {
  const location = useLocation();
  const redirect = location.pathname + location.search;
  return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
}
