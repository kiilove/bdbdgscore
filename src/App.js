import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import ManagementHome from "./homes/ManagementHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Setting from "./pages/Setting";

import { CurrentContestProvider } from "./contexts/CurrentContestContext";
import ScoreLogin from "./pages/ScoreLogin";

function App() {
  return (
    <CurrentContestProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/adminlogin" element={<Login />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/scorelogin" element={<ScoreLogin />} />
        </Routes>
      </BrowserRouter>
    </CurrentContestProvider>
  );
}

export default App;
