import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import NavireList from "./components/NavireList";
import NavireDetail from "./pages/NavireDetail";
import NavireForm from "./pages/NavireForm";
import Dashboard from "./pages/Dashboard";


export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="p-6">
          <Routes>
            {/* Accueil */}
            <Route path="/" element={<Dashboard />} />

            {/* Navires */}
            <Route path="/navires" element={<NavireList />} />
            <Route path="/navires/:id" element={<NavireDetail />} />
            <Route path="/navires/edit/:id" element={<NavireForm />} />
            <Route path="/navires/new" element={<NavireForm />} />


          </Routes>
        </main>
      </div>
    </Router>
  );
}
