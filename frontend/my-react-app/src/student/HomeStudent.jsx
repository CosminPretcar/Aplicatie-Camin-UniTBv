import React, {useEffect, useState} from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { useLocation } from "react-router-dom";
import "../styles/HomeStudent.css";
import Avizier from "../student/AvizierDigitalStudent";
import ChatBot from "../components/ChatBot";
import "../styles/HomeStudent.css"

function HomeStudent() {
  const [user, setUser] = useState({ nume: "utilizator", prenume: "" });
  const [ora, setOra] = useState(new Date());
  const [urmatoareaProgramare, setUrmatoareaProgramare] = useState(null);
  const [toateProgramarile, setToateProgramarile] = useState([]);
  const [showChatBot, setShowChatBot] = useState(false);


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

  useEffect(() => {
    const fetchUrmatoareaProgramare = async () => {
      const azi = new Date();
      const start = azi.toISOString().split("T")[0];
      const end = new Date(azi.getTime() + 7 * 24 * 60 * 60 * 1000) // următoarele 7 zile
        .toISOString().split("T")[0];
  
      try {
        const res = await axios.get(`http://localhost:4000/programari/me?start=${start}&end=${end}`, {
          withCredentials: true,
        });
  
        if (res.data.length > 0) {
          // sortăm după dată + oră
          const ordonate = res.data.sort((a, b) => {
            const t1 = new Date(`${a.data}T${a.ora_start}`);
            const t2 = new Date(`${b.data}T${b.ora_start}`);
            return t1 - t2;
          });
  
          setUrmatoareaProgramare(ordonate[0]);
          setToateProgramarile(res.data); // adaugă în interiorul try
        }
      } catch (err) {
        console.error("Eroare la încărcarea programărilor:", err);
      }
    };
  
    fetchUrmatoareaProgramare();
  }, []);

  return (
    <div className="d-flex">
      <NavBar />
      <div className="container-fluid" style={{ marginLeft: "280px", height: "100vh" }}>
        <div className="row mt-2">
          <div className="col-md-3 d-flex align-items-center">
            <div className="card bg-dark text-white p-3 w-100 shadow">
            <h5 className="text-center">🕒 {ora.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</h5>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow p-3 text-center ">
              <h2>Bine ai revenit, {user.prenume} {user.nume}!</h2>
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
            <div
              className="card shadow border-2 border-dark rounded-4 p-4 text-dark"
              style={{
                background: "linear-gradient(to right, #ffffff, #e7f4ff)",
                minHeight: "280px"
              }}
            >
              <h4 className="text-center mb-3">🧠 Memento</h4>
            
              {urmatoareaProgramare ? (
                <>
                  <div className="alert alert-info p-2 small mb-4 text-start">
                    <strong>🔔 Următoarea ta programare:</strong><br />
                    {new Date(urmatoareaProgramare.data).toLocaleDateString("ro-RO", {
                      weekday: "long", day: "2-digit", month: "long"
                    })} — ora <strong>{urmatoareaProgramare.ora_start.slice(0, 5)}</strong><br />
                    <span className="badge bg-primary mt-2">{urmatoareaProgramare.nume_resursa}</span>
                  </div>
                  
                  {toateProgramarile.length > 1 && (
                    <>
                      <h6 className="text-muted mb-2">📋 Programările tale viitoare:</h6>
                      <ul className="list-group small text-start">
                        {toateProgramarile.map((p, idx) => (
                          <li
                            key={idx}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <span>
                              {new Date(p.data).toLocaleDateString("ro-RO", {
                                weekday: "short", day: "2-digit", month: "short"
                              })} — ora {p.ora_start.slice(0, 5)}
                            </span>
                            <span className="badge bg-secondary">{p.nume_resursa}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-muted mt-3">
                  Nu ai programări active în perioada următoare.
                </div>
              )}
            </div>

          </div>
        </div>    
        {!showChatBot && (
  <button
    onClick={() => setShowChatBot(true)}
    className="btn btn-primary rounded-circle chatbot-toggle-btn"
  >
    💬
  </button>
)}

{showChatBot && <ChatBot onClose={() => setShowChatBot(false)} />}

      </div>
    </div>
  );
}

export default HomeStudent;
