import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import ResetareParola from "./ResetareParola";
import HomeStudent from "./student/HomeStudent";
import CerereCazareStudent from "./student/CerereCazareStudent";
import ProtectedRoute from "./utils/ProtectedRoute";
import ContextProvider from "./utils/ContextProvider";
import HomeAdministrator from "./administator/HomeAdministrator";
import CereriCazareAdmin from "./administator/CereriCazareAdmin";
import PrezentareCamine from "./PrezentareCamine";
import ProfilStudent from "./student/ProfilStudent";
import ProfilColegi from "./student/ProfilColegi";
import ReviewLunar from "./student/ReviewLunarStudent";
import ReviewLunarAdmin from "./administator/ReviewLunarAdmin";
import StudentiPeCamere from "./administator/StudentiPeCamere";
import ColegiPeCamere from "./student/ColegiPeCamere";
import "bootstrap/dist/css/bootstrap.min.css";
import RaportareProblemaStudent from "./student/RaportareProblemaStudent";
import SesizariAdministrare from "./administator/SesizariAdministrator";
import ProgramareResurse from "./student/ProgramariResurse";


function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Rute care nu trebuiesc protejate, orice user poate avea acces la ele */}
          <Route path="/" element={<Login setUser={setUser} />} />
          <Route path="/resetare-parola" element={<ResetareParola />} />
          <Route path="/prezentare-camine" element={<PrezentareCamine />}/>
          <Route path="/vizualizare-profil/:nume" element={
              <ProfilColegi key={window.location.pathname} />
          } />
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
          <Route path="/profil-personal/:nume" element={
            <ProtectedRoute roles={["user"]}>
              <ProfilStudent />
            </ProtectedRoute>
          } />
          <Route path="/reviewlunar" element={
            <ProtectedRoute roles={["user"]}>
              <ReviewLunar />
            </ProtectedRoute>
          } />
          <Route path="/colegi-pe-camere" element={
            <ProtectedRoute roles={['user']}>
              <ColegiPeCamere />
            </ProtectedRoute>
          } />
          <Route path="/raporteaza-probleme" element={
            <ProtectedRoute roles={['user']}>
              <RaportareProblemaStudent />
            </ProtectedRoute>
          } />
          <Route path="/programare-resurse" element={
            <ProtectedRoute roles={['user']}>
              <ProgramareResurse />
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
          <Route path="/admin/review-lunar" element={
            <ProtectedRoute roles={['admin']}>
              <ReviewLunarAdmin />
            </ProtectedRoute>
          } />
          <Route path="/admin/studenti-pe-camere" element={
            <ProtectedRoute roles={['admin']}>
              <StudentiPeCamere />
            </ProtectedRoute>
          } />
          <Route path="/admin/sesizari" element={
            <ProtectedRoute roles={['admin']}>
              <SesizariAdministrare />
            </ProtectedRoute>
          } />
      </Routes>
    </Router>
  );
}

export default App;
