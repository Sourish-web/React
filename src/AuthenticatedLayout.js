import React from 'react';
import { Outlet } from 'react-router-dom';
import Chatbot from './Chatbot';

const AuthenticatedLayout = () => {
  return (
    <div>
      <Outlet />
      <Chatbot />
    </div>
  );
};

export default AuthenticatedLayout;