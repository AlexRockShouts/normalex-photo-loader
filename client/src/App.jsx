import { useEffect, useState } from 'react';
import PhoneView from './views/PhoneView.jsx';
import ProjectorView from './views/ProjectorView.jsx';
import ControlView from './views/ControlView.jsx';
import Landing from './views/Landing.jsx';

function useRoute() {
  const [route, setRoute] = useState(window.location.pathname);
  useEffect(() => {
    const onChange = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return route;
}

export default function App() {
  const route = useRoute();

  if (route.startsWith('/projector')) return <ProjectorView />;
  if (route.startsWith('/control')) return <ControlView />;
  if (route.startsWith('/phone')) return <PhoneView />;
  return <Landing />;
}
