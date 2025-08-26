import React, { useState } from "react";
import Login from "./components/Login";
import LoadingScreen from "./components/LoadingScreen";
import CanvasApp from "./components/CanvasApp";

export default function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [userData, setUserData] = useState({ userType: "", username: "" });

  const handleLogin = (userType, username) => {
    setUserData({ userType, username });
    setLoading(true);
  };

  const handleLoadingComplete = () => {
    setLoading(false);
    setShowLogin(false);
  };

  if (loading) {
    return (
      <LoadingScreen 
        progress={loadingProgress} 
        setProgress={setLoadingProgress}
        onComplete={handleLoadingComplete}
      />
    );
  }

  if (showLogin) {
    return <Login onLogin={handleLogin} />;
  }

  return <CanvasApp userData={userData} />;
}