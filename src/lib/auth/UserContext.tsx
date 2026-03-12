import React, { createContext, useContext, useState, useMemo } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+1234567890',
    role: 'Admin',
    roleName: 'Admin',
    photoUrl: null,
    unreadMessages: 0,
    unreadNotifications: 0,
    studentClass: null,
  });

  const logout = () => {
    setUser(null);
    // Add any logout logic here (clear tokens, etc.)
  };

  // Permission checking function
  const hasPermission = (module, action = 'view') => {
    // For now, return true for all permissions
    // You can implement actual permission logic based on user role
    if (!user) return false;
    
    // Admin and Super Admin have all permissions
    if (user.role === 'Admin' || user.role === 'Super Admin' || 
        user.roleName === 'Admin' || user.roleName === 'Super Admin') {
      return true;
    }
    
    // Add more permission logic here based on your needs
    return true;
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      logout,
      hasPermission,
    }),
    [user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
