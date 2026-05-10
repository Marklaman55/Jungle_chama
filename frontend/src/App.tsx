import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div>Jungle Chama Frontend</div>
      </Router>
    </AuthProvider>
  );
}