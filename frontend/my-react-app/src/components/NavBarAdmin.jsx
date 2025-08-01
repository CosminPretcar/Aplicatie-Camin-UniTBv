import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function NavBarAdmin() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await axios.get("http://localhost:4000/me", { withCredentials: true });
        if (response.data.isAuthenticated && response.data.esteAdmin) {
          setAdmin(response.data);
        } else {
          console.warn("Utilizatorul nu este autentificat sau nu este admin.");
        }
      } catch (error) {
        console.error("Failed to fetch admin: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:4000/logout", {}, { withCredentials: true });
      navigate("/");
    } catch (error) {
      console.log("Logout failed: ", error);
    }
  };

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-bg-dark"
      style={{
        width: "280px",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflowY: "auto",
        backgroundColor: "#212529",
      }}>
      <a onClick={() => navigate("/admin/dashboard")} className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none" style={{ cursor: "pointer" }}>
        <span className="fs-4"><i className="bi bi-cursor me-1"></i>Camin@UniTBv</span>
      </a>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item">
          <a onClick={() => navigate("/admin/dashboard")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-house-door-fill me-2"></i>
            Dashboard
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/admin/cereri-cazare")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-journal-check me-2"></i>
            Cereri Cazare
          </a>
        </li>        
        <li>
          <a onClick={() => navigate("/admin/review-lunar")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-stars me-2"></i>
            Review Lunar
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/admin/monitorizare-activitate")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-clipboard2-data-fill me-2"></i>
            Monitorizare Activitate
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/admin/studenti-pe-camere")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-door-open-fill me-2"></i>
            Studenti pe camere
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/admin/sesizari")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-tools me-2"></i>
            Sesizari
          </a>
        </li>
        <li>
          <a onClick={handleLogout} className="nav-link text-white" style={{ cursor: "pointer" }}>
            <i className="bi bi-box-arrow-right"> </i>
            Logout
          </a>
        </li>
      </ul>
      <hr />
      <div className="profile-button">
        <a 
          onClick={() => navigate(`/admin/profile/${admin?.nume}`)}
          className="d-flex align-items-center text-white text-decoration-none"
          style={{ cursor: "pointer" }}
        >
          <img 
            src={admin?.poza_profil ? `http://localhost:4000${admin.poza_profil}` : "/assets/poza_def.jpg"}
            alt="Profil" 
            width="32" 
            height="32" 
            className="rounded-circle me-2"
          />
          <strong>{admin ? `${admin.nume} ${admin.prenume}` : "Loading..."}</strong>
        </a>
      </div>
    </div>
  );
}

export default NavBarAdmin;
