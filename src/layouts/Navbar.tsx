import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">PMS</Link>
        <div className="space-x-4">
          <Link to="/manager" className="text-gray-700 hover:text-blue-600">Manager</Link>
          <Link to="/owner" className="text-gray-700 hover:text-blue-600">Owner</Link>
          <Link to="/tenant" className="text-gray-700 hover:text-blue-600">Tenant</Link>
        </div>
      </div>
    </nav>
  );
}