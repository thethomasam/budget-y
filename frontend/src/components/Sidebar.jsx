import { AiFillHome, AiOutlineAppstore } from 'react-icons/ai';
import { BiWallet } from 'react-icons/bi';
import { BsCalendar3 } from 'react-icons/bs';
import { IoSettingsOutline } from 'react-icons/io5';
import { TbPropeller } from 'react-icons/tb';

const Sidebar = ({ activeView, onViewChange }) => {
  return (
    <aside className="w-[70px] bg-bg-card flex flex-col items-center py-6 gap-8 border-r border-border fixed h-screen z-[100]">
      <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-dark rounded-xl flex items-center justify-center text-white text-2xl">
        <TbPropeller />
      </div>

      <nav className="flex flex-col gap-6 flex-1">
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all text-xl ${
            activeView === 'dashboard'
              ? 'bg-bg-primary text-primary-blue'
              : 'text-text-secondary hover:bg-bg-primary hover:text-primary-blue'
          }`}
          onClick={() => onViewChange('dashboard')}
          title="Dashboard"
        >
          <AiFillHome />
        </div>
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all text-xl ${
            activeView === 'transactions'
              ? 'bg-bg-primary text-primary-blue'
              : 'text-text-secondary hover:bg-bg-primary hover:text-primary-blue'
          }`}
          onClick={() => onViewChange('transactions')}
          title="Transactions"
        >
          <BiWallet />
        </div>
      </nav>

      <div className="mt-auto">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all text-xl text-text-secondary hover:bg-bg-primary hover:text-primary-blue">
          <IoSettingsOutline />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
