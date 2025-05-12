import React, { useState , useEffect} from "react";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../components/NavBar.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function NavBar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:4000/me", { withCredentials: true });
        if(response.data.isAuthenticated) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch user: ", error);
      }
    };
    fetchUser();

    
    const handleProfilePictureUpdate = () => fetchUser();

    window.addEventListener("profilePictureUpdated", handleProfilePictureUpdate);

    return () => {
      window.removeEventListener("profilePictureUpdated", handleProfilePictureUpdate);
    };
  }, []);

  const handleLogout = async() => {
    try {
      await axios.post("http://localhost:4000/logout", {}, {withCredentials:true});
      navigate("/");
      
    } catch(error) {
      console.log("Logout failed: ", error);
    }
  }

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-bg-dark nav" 
    style={{
      width: "280px",
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      overflowY: "auto",
      backgroundColor: "#212529",
    }}>
      <a onClick={() => navigate("/home")} className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none" style={{ cursor: "pointer" }}>
        <span className="fs-4"><i className="bi bi-cursor me-1"></i>Camin@UniTBv</span>
      </a>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item">
          <a onClick={() => navigate("/home")} className="nav-link text-white" aria-current="page" style={{ cursor: "pointer" }}>
            <i className="bi bi-house-door-fill me-2"></i>
            Home
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/cerere-cazare")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-journal-text me-2"></i>
            Cerere Cazare
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/reviewlunar")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-stars me-2"></i>
            Review lunar
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/colegi-pe-camere")} className="nav-link text-white" style={{cursor:"pointer"}}>
          <i className="bi bi-person-lines-fill me-2"></i>
            Colegii de camin
          </a>
        </li> 
        <li>
          <a onClick={() => navigate("/raporteaza-probleme")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
            Raporteaza o problema
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/programare-resurse")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-calendar-check me-2"></i>
            Programare resurse
          </a>
        </li>
        <li>
          <a onClick={handleLogout} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-box-arrow-in-right me-2"></i>
            Logout
          </a>
        </li>
        
      </ul>
      <hr />
      <div className="profile-button">
        <a 
          onClick={() => navigate(`/profil-personal/${user?.nume}`)} 
          className="d-flex align-items-center text-white text-decoration-none"
          style={{ cursor: "pointer" }}
        >
          <img 
            src={user?.poza_profil ? `http://localhost:4000${user.poza_profil}?t=${Date.now()}` : "/assets/poza_def.jpg"}
            alt="Profil" 
            width="32" 
            height="32" 
            className="rounded-circle me-2"
          />
          <strong>{user ? `${user.nume} ${user.prenume}` : "Loading..."}</strong>
        </a>
      </div>
    </div>
  );
}

export default NavBar;
