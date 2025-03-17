// components/dashboard/side-nav/index.tsx
import Link from 'next/link';

const SideNav = () => {
  return (
    <div className="w-64 h-full bg-gray-800 text-white p-4">
      <h2 className="text-xl font-semibold mb-6 text-center">CRM</h2>
      <ul className="space-y-4">
        <li>
          <Link href="/" className="block py-2 px-4 hover:bg-gray-700 rounded">
            Dashboard
          </Link>
        </li>
        <li>
          <Link href="/contacts" className="block py-2 px-4 hover:bg-gray-700 rounded">
            Contacts
          </Link>
        </li>
        <li>
          <Link href="/leads" className="block py-2 px-4 hover:bg-gray-700 rounded">
            Leads
          </Link>
        </li>
        <li>
          <Link href="/tasks" className="block py-2 px-4 hover:bg-gray-700 rounded">
            Tasks
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default SideNav;
