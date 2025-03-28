// components/dashboard/header/index.tsx
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">CRM Dashboard</h1>
      <div className="flex items-center space-x-4">
        <button
          className="lg:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="material-icons">menu</span>
        </button>
        <div className="hidden lg:flex space-x-4">
          <button className="p-2 hover:bg-gray-700 rounded">Profile</button>
          <button className="p-2 hover:bg-gray-700 rounded">Logout</button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 right-4 bg-gray-800 p-4 rounded shadow-md">
          <button className="block py-2 px-4">Profile</button>
          <button className="block py-2 px-4">Logout</button>
        </div>
      )}
    </header>
  );
};

export default Header;
