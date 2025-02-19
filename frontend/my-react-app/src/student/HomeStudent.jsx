import React, {useEffect, useState} from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { useLocation } from "react-router-dom";
import "../styles/HomeStudent.css";

function HomeStudent() {
  const [user, setUser] = useState({ nume: "utilizator", prenume: "" });
  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(response => {
        if (response.data.isAuthenticated) {
          setUser({ nume: response.data.nume, prenume: response.data.prenume });
        }
      })
      .catch(error => console.error("Error fetching user:", error));
  }, []);

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <NavBar />

      {/* Conținutul principal */}
      <div className="content d-flex justify-content-center align-items-center" style={{ marginLeft: "280px", height: "100vh", width: "100%" }}>
        <div>
          <h1>Bine ai revenit, {user.prenume} {user.nume}!</h1>
        </div>
      </div>
    </div>
  );
}

export default HomeStudent;
