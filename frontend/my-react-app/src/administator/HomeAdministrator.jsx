import React, {useState, useEffect} from "react";
import NavBarAdmin from "../components/NavBarAdmin";
import axios from "axios";
import Avizier from "./AvizierDigitalAdministrator";

function HomeAdministrator() {
  const [user, setUser] = useState({ nume: "utilizator", prenume: "" });
  const [ora, setOra] = useState(new Date());

  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(response => {
        if (response.data.isAuthenticated) {
          setUser({ nume: response.data.nume, prenume: response.data.prenume });
        }
      })
      .catch(error => console.error("Error fetching user:", error));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOra(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="d-flex">
    <NavBarAdmin />
    <div className="container-fluid" style={{ marginLeft: "280px", height: "100vh" }}>
      <div className="row mt-2">
        <div className="col-md-3 d-flex align-items-center">
          <div className="card bg-dark text-white p-3 w-100 shadow">
          <h5 className="text-center">🕒 {ora.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</h5>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow p-3 text-center">
            <h2>Bine ai revenit, {user.nume} {user.prenume}!</h2>
          </div>
        </div>
        <div className="col-md-3 d-flex align-items-center">
            <div className="card bg-dark text-white p-3 w-100 shadow">
              <h5 className="text-center">📅 {ora.toLocaleDateString("ro-RO", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</h5>
            </div>
          </div>
      </div>
      <hr />
      <div className="row mt-2">
        <div className="col-md-6">
          <Avizier />
        </div>
        <div className="col-md-6">
          <div className="card shadow p-3 text-center">
            <h2>Notificări</h2>
          </div>
        </div>
        </div>
      </div>
  </div>
  );
}

export default HomeAdministrator;
