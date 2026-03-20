import { AiOutlineSearch } from 'react-icons/ai';
import { IoNotificationsOutline } from 'react-icons/io5';

const Header = () => {
  return (
    <header className="flex justify-between items-start mb-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">
          Hi, <span className="font-bold">Sam Thomas</span>
        </h1>
        <p className="text-text-secondary text-sm hidden sm:block">
          Here is the update from your payment channels, that is really important for you to catch up.
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-10 h-10 rounded-full bg-bg-card flex items-center justify-center cursor-pointer transition-all text-text-secondary text-lg hover:bg-bg-primary">
          <IoNotificationsOutline />
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-bg-card"></span>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden cursor-pointer border-2 border-border">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
