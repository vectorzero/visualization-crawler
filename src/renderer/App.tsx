import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import Index from './pages/Index';
// import icon from '../../assets/icon.svg';
// import './App.css';

export default function App () {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Index />} />
      </Routes>
    </Router>
  )
}
