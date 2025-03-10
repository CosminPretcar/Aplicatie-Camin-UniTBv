import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import HomeStudent from "./student/HomeStudent";
import CerereCazareStudent from "./student/CerereCazareStudent";
import ProtectedRoute from "./utils/ProtectedRoute";
import ContextProvider from "./utils/ContextProvider";
import HomeAdministrator from "./administator/HomeAdministrator";
import CereriCazareAdmin from "./administator/CereriCazareAdmin";
import PrezentareCamine from "./PrezentareCamine";
import ProfilStudent from "./student/ProfilStudent";
import "bootstrap/dist/css/bootstrap.min.css";


function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Rute care nu trebuiesc protejate, orice user poate avea acces la ele */}
          <Route path="/" element={<Login setUser={setUser} />} />
          <Route path="/prezentare-camine" element={<PrezentareCamine />}/>
        {/* Rute ce trebuiesc accesate doar de studenti */}
          <Route path="/home" element={
            <ProtectedRoute roles={["user"]}>
              <HomeStudent />
            </ProtectedRoute>
          } />
          <Route path="/cerere-cazare" element={
            <ProtectedRoute roles={["user"]}>
              <CerereCazareStudent />
            </ProtectedRoute>
          } />
          <Route path="/profilstudent/:nume" element={
            <ProtectedRoute roles={["user"]}>
              <ProfilStudent />
            </ProtectedRoute>
          } />
        {/* Rute ce trebuiesc accesate doar de administratorii de camin */}
          <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['admin']}>
            <HomeAdministrator />
          </ProtectedRoute>
          } />
          <Route path="/admin/cereri-cazare" element={
          <ProtectedRoute roles={['admin']}>
            <CereriCazareAdmin />
          </ProtectedRoute>
          } />
      </Routes>
    </Router>
  );
}

export default App;
