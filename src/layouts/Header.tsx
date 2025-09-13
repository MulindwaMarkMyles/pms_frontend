import React from 'react';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-white">
      <div className="text-lg font-semibold">Dashboard</div>
      <div className="flex items-center space-x-3">
        <div className="hidden sm:block text-sm">mulindwa@example.com</div>
        <div className="w-8 h-8 rounded-full bg-gray-200" />
      </div>
    </header>
  );
}
