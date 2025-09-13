import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/" className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🏢 PMS</h1>
              <span className="text-gray-600">Property Management System</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            About Our Platform
          </h1>
          <p className="text-xl text-gray-600">
            Revolutionizing property management through technology
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            We're dedicated to simplifying property management by providing a comprehensive, 
            user-friendly platform that connects property owners, managers, and tenants. 
            Our goal is to streamline operations, improve communication, and enhance the 
            overall rental experience for everyone involved.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Efficient Management</h3>
            <p className="text-gray-600">
              Automate routine tasks, track payments, manage maintenance requests, 
              and keep all property information organized in one central location.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Better Communication</h3>
            <p className="text-gray-600">
              Facilitate seamless communication between all parties with built-in 
              messaging, complaint tracking, and real-time notifications.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Data-Driven Insights</h3>
            <p className="text-gray-600">
              Make informed decisions with comprehensive analytics, detailed reports, 
              and performance metrics for your property portfolio.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Reliable</h3>
            <p className="text-gray-600">
              Your data is protected with enterprise-grade security, role-based access 
              controls, and regular backups to ensure information safety.
            </p>
          </div>
        </div>

        {/* Technology Section */}
        <div className="bg-blue-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built with Modern Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">⚛️</div>
              <h4 className="font-semibold text-gray-900">React Frontend</h4>
              <p className="text-sm text-gray-600">Modern, responsive user interface</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🐍</div>
              <h4 className="font-semibold text-gray-900">Django Backend</h4>
              <p className="text-sm text-gray-600">Robust, scalable server architecture</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🗄️</div>
              <h4 className="font-semibold text-gray-900">PostgreSQL Database</h4>
              <p className="text-sm text-gray-600">Reliable data storage and management</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            We're committed to continuously improving our platform based on user feedback 
            and evolving industry needs. Our team works tirelessly to ensure you have 
            the best property management experience possible.
          </p>
          <Link 
            to="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get in Touch
          </Link>
        </div>
      </main>
    </div>
  );
}