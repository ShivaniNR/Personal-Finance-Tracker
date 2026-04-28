import React, { useState, useEffect } from 'react';
import { Home, BarChart3, CreditCard, Upload, Menu, X } from 'lucide-react';
import './Navigation.css';

export const Navigation = ({ activeTab, setActiveTab, onImportClick, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'transactions', icon: CreditCard, label: 'Transactions' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'import', icon: Upload, label: 'Import CSV' }
  ];

  // Close sidebar when tab changes (mobile)
  const handleNavClick = (item) => {
    if (item.id === 'import') {
      onImportClick?.();
    } else {
      setActiveTab(item.id);
    }
    setIsOpen(false);
  };

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Mobile hamburger button */}
      <button className="mobile-menu-btn" onClick={() => setIsOpen(true)}>
        <Menu size={24} />
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="nav-overlay" onClick={() => setIsOpen(false)} />}

      <nav className={`navigation ${isOpen ? 'open' : ''}`}>
        <div className="nav-brand">
          <div className="brand-icon">💰</div>
          <span className="brand-text">FinanceTracker</span>
          <button className="mobile-close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="nav-items">
          {navItems.map(item => {
            const Icon = item.icon;
            const isImport = item.id === 'import';
            return (
              <button
                key={item.id}
                className={`nav-item ${!isImport && activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {children}
      </nav>
    </>
  );
};
