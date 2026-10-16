import { useState } from 'react';
import { Login, Register, ForgotPassword } from './UserAuth';

type View = 'login' | 'register' | 'forgot';

export default function UserAuthPage() {
  const [view, setView] = useState<View>('login');

  if (view === 'register') {
    return <Register onBackToLogin={() => setView('login')} />;
  }
  if (view === 'forgot') {
    return <ForgotPassword onBackToLogin={() => setView('login')} />;
  }
  return (
    <Login
      onNavigateToRegister={() => setView('register')}
      onNavigateToForgotPassword={() => setView('forgot')}
    />
  );
}
