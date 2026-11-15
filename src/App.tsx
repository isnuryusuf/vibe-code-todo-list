import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginPage';
import { TodoApp } from './TodoApp';

function App() {
  const { user, loading, login, register, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-300 flex items-center justify-center" role="status">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }

  return <TodoApp username={user.username} onLogout={logout} />;
}

export default App;
