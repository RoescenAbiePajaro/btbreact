import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [userType, setUserType] = useState("student");
  const [username, setUsername] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!accessCode) {
      alert("Please enter an access code");
      return;
    }
    
    if (userType === "student" && !username) {
      alert("Please enter your name");
      return;
    }
    
    onLogin(userType, username);
  };

  const handleRoleChange = (role) => {
    setUserType(role);
    // Clear username when switching to educator
    if (role === "educator") {
      setUsername("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-black rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-4">
            <img 
              src="../icon/logo.png" 
              alt="Beyond The Brush" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          </div>
          {/* Added centered title */}
          <h2 className="text-4xl text-white text-center">
            Beyond The Brush Lite
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex justify-center space-x-8">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="student"
                  name="role"
                  value="student"
                  checked={userType === "student"}
                  onChange={() => handleRoleChange("student")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor="student"
                  className="ml-2 block text-gray-300 cursor-pointer"
                >
                  Student
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="educator"
                  name="role"
                  value="educator"
                  checked={userType === "educator"}
                  onChange={() => handleRoleChange("educator")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label
                  htmlFor="educator"
                  className="ml-2 block text-gray-300 cursor-pointer"
                >
                  Educator
                </label>
              </div>
            </div>
          </div>

          {/* Conditionally render name field only for students */}
          {userType === "student" && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-300 mb-2">
                Enter your name:
              </label>
              <input
                type="text"
                id="name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="accessCode" className="block text-gray-300 mb-2">
              Access Code
            </label>
            <input
              type="password"
              id="accessCode"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-4 py-2 bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
          >
            Enter
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Exit
          </button>
        </form>
      </div>
    </div>
  );
}