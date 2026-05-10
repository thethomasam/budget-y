import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { settings } = useData();
  const { logout, username } = useAuth();
  const userName = settings?.user?.name || username || '';

  return (
    <header className="flex justify-between items-start mb-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">
          Hi, <span className="font-bold">{userName}</span>
        </h1>
        <p className="text-text-secondary text-sm hidden sm:block">
          Here is the update from your payment channels, that is really important for you to catch up.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={logout}
          className="text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg px-3 py-1.5 transition-colors hover:bg-bg-card"
        >
          Logout
        </button>
        <div className="w-12 h-12 rounded-full bg-bg-card flex items-center justify-center border-2 border-border text-2xl select-none">
          🦕
        </div>
      </div>
    </header>
  );
};

export default Header;
