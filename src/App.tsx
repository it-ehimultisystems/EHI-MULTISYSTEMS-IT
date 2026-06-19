import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { EHIApp } from './components/EHIApp';
import { User } from './lib/types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return <EHIApp user={user} onLogout={() => setUser(null)} />;
}

