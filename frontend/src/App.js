import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Session from './pages/Session';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:sessionId" element={<Session />} />
      </Routes>
    </div>
  );
}

export default App;
