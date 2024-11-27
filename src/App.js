import logo from './logo.svg';
import './App.css';
import WordLadder from './WordLadder';
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainMenu from './MainMenu';
function App() {
  return (
    <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<MainMenu />} />
            <Route path='/play' element={<WordLadder />} />
          </Routes>
        </BrowserRouter>
        
    </div>
  );
}



export default App;