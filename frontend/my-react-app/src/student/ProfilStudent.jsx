import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import NavBar from "../components/NavBar";

function ProfilStudent() {
  const { nume } = useParams(); // Extrage numele din URL
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(response => {
        if (response.data.isAuthenticated) {
          setUser(response.data);
        }
      })
      .catch(error => console.error("Eroare la preluarea datelor:", error));
  }, []);

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <NavBar />

      {/* Conținutul principal */}
      <div className="container mt-2" style={{ marginLeft: "60px" }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card p-4 shadow">
              <div className="row align-items-center">
                {/* Poza de profil */}
                <div className="col-md-4 text-center">
                  <img
                    src={user?.pozaProfil || "/assets/poza_def.jpg"}
                    alt="Profil"
                    className="rounded-circle img-fluid"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                  />
                </div>

                {/* Informații student */}
                <div className="col-md-8">
                  <h3>{user?.prenume} {user?.nume}</h3>
                  <p><strong>Email:</strong> {user?.email || "Necunoscut"}</p>
                  <p><strong>Facultate:</strong> {user?.facultate || "Nespecificat"}</p>
                  <p><strong>Specializare:</strong> {user?.specializare || "Nespecificat"}</p>
                  <p><strong>Grupa:</strong> {user?.grupa || "Nespecificat"}</p>
                  {/* <p><strong>Cămin:</strong> {user?.camin || "Nealocat"}</p> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilStudent;
