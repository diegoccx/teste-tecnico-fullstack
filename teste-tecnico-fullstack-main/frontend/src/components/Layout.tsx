import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  user: 'User',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          Intellux <span>Drive</span>
        </div>
        <nav>
          {user?.role === 'super_admin' && (
            <NavLink to="/super-admin" className={({ isActive }) => isActive ? 'active' : ''}>
              📊 Dashboard Admin
            </NavLink>
          )}
          {user?.role === 'owner' && (
            <NavLink to="/owner" className={({ isActive }) => isActive ? 'active' : ''}>
              👥 Dashboard Owner
            </NavLink>
          )}
          {(user?.role === 'owner' || user?.role === 'user') && (
            <NavLink to="/workspace" className={({ isActive }) => isActive ? 'active' : ''}>
              📁 Área de Trabalho
            </NavLink>
          )}
        </nav>
        <div className="sidebar-user">
          <div className="user-name">{user?.name}</div>
          <span className="user-role">{roleLabels[user?.role || ''] || user?.role}</span>
          <div style={{ marginTop: '0.75rem' }}>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}
              style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' }}>
              Sair
            </button>
          </div>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
