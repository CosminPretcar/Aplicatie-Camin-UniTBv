import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import HomeStudent from "./student/HomeStudent";
import CerereCazareStudent from "./student/CerereCazareStudent";
import ProtectedRoute from "./ProtectedRoute";
import HomeAdministrator from "./administator/HomeAdministrator";
import CereriCazareAdmin from "./administator/CereriCazareAdmin";
import PrezentareCamine from "./PrezentareCamine";
import ProfilStudent from "./student/ProfilStudent";


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(response => { 
        if (response.data.isAuthenticated) {
          setUser({
            nume: response.data.nume,
            prenume: response.data.prenume,
            esteAdmin: response.data.esteAdmin,
          });
        } else {
          setUser(null);
        }
      })
      .catch(error => console.error("Eroare la verificarea sesiunii:", error));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<HomeStudent />} />
        <Route path="/cerere-cazare" element={<CerereCazareStudent />} />
        <Route path="/prezentare-camine" element={<PrezentareCamine />}/>
        <Route path="/profilstudent/:nume" element={<ProfilStudent />}/>
        <Route path="/admin/dashboard" element={
          <ProtectedRoute user={user} isAdminRequired={true}>
            <HomeAdministrator />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
