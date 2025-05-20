// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import { useAuth } from "../context/authContext";
import MapView from "../pages/MapPage";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Router>
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <LoginPage /> : <Navigate to="/map" replace />}
            />
            <Route
              path="/map"
              element={<MapView />}
            />
            <Route
              path="*"
              element={<Navigate to="/map" replace />}
            />
          </Routes>
        </Router>
      </main>
    </div>
  );
}

