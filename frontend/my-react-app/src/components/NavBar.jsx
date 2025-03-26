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
      <a onClick={() => navigate("/home")} className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none" style={{ cursor: "pointer" }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-geo-alt" viewBox="0 0 16 16">
          <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A32 32 0 0 1 8 14.58a32 32 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10" />
          <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
        </svg>
        <span className="fs-4">Camin@UniTBv</span>
      </a>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item">
          <a onClick={() => navigate("/home")} className="nav-link text-white" aria-current="page" style={{ cursor: "pointer" }}>
            <i className="bi bi-house me-2"></i>
            Home
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/cerere-cazare")} className="nav-link text-white" style={{ cursor: "pointer" }}>
          <i className="bi bi-body-text me-2"></i>
            Cerere Cazare
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/reviewlunar")} className="nav-link text-white" style={{ cursor: "pointer" }}>
            <i className="bi-star-fill me-2"></i>
            Review lunar
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/colegi-pe-camere")} className="nav-link text-white" style={{cursor:"pointer"}}>
            <i className="bi bi-people me-2"></i>
            Colegii de camin
          </a>
        </li> 
        <li>
          <a onClick={() => navigate("/raporteaza-probleme")} className="nav-link text-white" style={{ cursor: "pointer" }}>
            <i className="bi-star-fill me-2"></i>
            Raporteaza o problema
          </a>
        </li>
        <li>
          <a onClick={() => navigate("/programare-resurse")} className="nav-link text-white" style={{ cursor: "pointer" }}>
            <i className="bi-star-fill me-2"></i>
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
