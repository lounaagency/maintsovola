
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import Terrain from './pages/Terrain';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import Index from './pages/Index';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/index" element={<Index />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route index element={<Navigate to="/feed" replace />} />
                  <Route path="feed" element={<Feed />} />
                  <Route path="terrain" element={<Terrain />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
