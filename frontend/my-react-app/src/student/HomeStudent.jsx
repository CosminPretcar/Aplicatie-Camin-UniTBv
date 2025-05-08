import React, {useEffect, useState} from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { useLocation } from "react-router-dom";
import "../styles/HomeStudent.css";
import Avizier from "../student/AvizierDigitalStudent";
import ChatBot from "../components/ChatBot";
import Forum from "../student/ForumStudenti";
import { Modal, Button } from 'react-bootstrap';
import "../styles/HomeStudent.css"

function HomeStudent() {
  const [user, setUser] = useState({ nume: "utilizator", prenume: "" });
  const [ora, setOra] = useState(new Date());
  const [urmatoareaProgramare, setUrmatoareaProgramare] = useState(null);
  const [toateProgramarile, setToateProgramarile] = useState([]);
  const [showChatBot, setShowChatBot] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [anunturi, setAnunturi] = useState([]);

  const [anuntDeSters, setAnuntDeSters] = useState(null);
  const [showModalStergere, setShowModalStergere] = useState(false);

  const [notificari, setNotificari] = useState([]);
  const [notificariGlobale, setNotificariGlobale] = useState([]);
  const [showNotificari, setShowNotificari] = useState(false);

  const [notificareSelectata, setNotificareSelectata] = useState(null);
  const [showModalNotificare, setShowModalNotificare] = useState(false);

  const [imaginePreview, setImaginePreview] = useState(null);



  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(response => {
        if (response.data.isAuthenticated) {
          setUser({ id: response.data.id, nume: response.data.nume, prenume: response.data.prenume });
  
          // Încărcare notificări locale
          axios.get(`http://localhost:4000/notificari/${response.data.id}`, { withCredentials: true })
            .then(res => setNotificari(res.data))
            .catch(err => console.error("Eroare la încărcarea notificărilor locale:", err));
  
          // Încărcare notificări globale
          axios.get("http://localhost:4000/notificari-globale")
            .then(res => {
              const globale = res.data.map(n => ({ ...n, global: true }));
              setNotificari((prev) => [...prev, ...globale]);
            })
            .catch(err => console.error("Eroare la încărcarea notificărilor globale:", err));
        }
      })
      .catch(error => console.error("Eroare la autentificare:", error));
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

  useEffect(() => {
    const fetchAnunturi = async () => {
      try {
        const res = await axios.get("http://localhost:4000/forum-studenti", { withCredentials: true });
        setAnunturi(res.data);
      } catch (error) {
        console.error("Eroare la preluarea anunțurilor:", error);
      }
    };
  
    fetchAnunturi();
  }, []);

  useEffect(() => {
    axios.get("http://localhost:4000/notificari-globale")
      .then(res => {
        setNotificariGlobale(res.data);
      })
      .catch(err => console.error("Eroare la încărcarea notificărilor globale:", err));
  }, []);

  const cereConfirmareStergere = (anunt) => {
    setAnuntDeSters(anunt);
    setShowModalStergere(true);
  };

  const deschideNotificare = async (notificare) => {
    setNotificareSelectata(notificare);
    setShowModalNotificare(true);
  
    if (!notificare.citita && !notificare.global) {
      try {
        await axios.patch(`http://localhost:4000/notificari/${notificare.id}/citita`, {
          withCredentials: true,
        });
        setNotificari((prev) =>
          prev.map((n) => (n.id === notificare.id ? { ...n, citita: true } : n))
        );
      } catch (err) {
        console.error("Eroare la marcarea notificării ca citită:", err);
      }
    }
  };

  const stergeNotificare = async (notificare) => {
    try {
      console.log("Obiect notificare:", JSON.stringify(notificare, null, 2));
      console.log("Ștergere notificare cu ID:", notificare.id);
      if (notificare.global) {
        await axios.delete(`http://localhost:4000/notificari-globale/${notificare.id}`, {
          withCredentials: true,
        });
        setNotificariGlobale((prev) => prev.filter((n) => n.id !== notificare.id));
      } else {
        await axios.delete(`http://localhost:4000/notificari/${notificare.id}`, {
          withCredentials: true,
        });
        setNotificari((prev) => prev.filter((n) => n.id !== notificare.id));
      }
    } catch (err) {
      console.error("Eroare la ștergerea notificării:", err);
    }
  };
  
  const toateNotificarile = [
    ...notificari,
    ...notificariGlobale.map(n => ({
      ...n,
      global: true,
      id: n.id || n.notificare_id, // Verificare dublă pentru a preveni eroarea
    }))
  ].sort((a, b) => new Date(b.data) - new Date(a.data));
  
  
  
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
            <div className="card shadow p-3 position-relative">
              <h2 className="text-center mb-0">Bine ai revenit, {user.prenume} {user.nume}!</h2>

              <div className="position-absolute top-50 end-0 translate-middle-y me-3" style={{ zIndex: 1050 }}>
                <button
                  className="btn btn-outline-dark rounded-circle"
                  onClick={() => setShowNotificari(prev => !prev)}
                  title="Notificări"
                >
                  🔔
                </button>
                {notificari.some(n => !n.citita) && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {notificari.filter(n => !n.citita).length}
                  </span>
                )}

                {showNotificari && (
                  <div
                    className="card shadow border-2 border-dark rounded mt-2 p-2 position-absolute end-0"
                    style={{ width: "300px", zIndex: 999 }}
                  >
                      <h6 className="text-center">🔔 Notificări</h6>
                      {toateNotificarile.length === 0 ? (
                        <p className="text-muted text-center">Nu ai notificări</p>
                      ) : (
                        <ul className="list-group small">
                          {toateNotificarile.map((n) => (
                            <li
                              key={`notificare-${n.id}`}
                              className={`list-group-item d-flex justify-content-between align-items-start 
                                ${n.global ? '' : n.citita ? 'text-muted' : 'fw-bold'}`}
                              style={{ cursor: "pointer" }}
                              onClick={() => deschideNotificare(n)}
                            >
                              <div className="me-2">
                                {n.global && <span className="badge bg-warning me-1">Global</span>}
                                {n.titlu}
                                <br />
                                <small className="text-muted">{new Date(n.data).toLocaleString("ro-RO")}</small>
                              </div>
                              <button
                                className="btn btn-sm btn-outline-danger py-0 px-1"
                                title="Șterge notificarea"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  stergeNotificare(n);
                                }}
                              >
                                🗑️
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                )}
              </div>
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
                height: "370px", 
                overflow: "auto"
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
                      <ul className="list-group small text-start" style= {{maxHeight:"200px", overflow:"auto"}}>
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
            <div
              className="card shadow border-2 border-dark rounded-4 p-4 text-dark mt-2"
              style={{
                background: "linear-gradient(to right, #ffffff, #e7f4ff)",
                height: "370px",
                overflow: "auto"
              }}
            > 
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>🗣️ Forumul studenților</h4>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  Creează anunț
                </Button>
              </div>
              <div className="mt-2" style={{ maxHeight: "260px", overflowY: "auto" }}>
                {anunturi.length === 0 ? (
                  <p className="text-muted">Nu există anunțuri încă.</p>
                ) : (
                  anunturi.map((anunt) => (
                    <div key={anunt.id} className="card mb-2 shadow-sm position-relative">
                        {user && user.nume === anunt.nume && (
                          <button
                            className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2"
                            onClick={() => cereConfirmareStergere(anunt)}
                          >
                            🗑️ Șterge anunț
                          </button>
                        )}
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-8">
                            <h6 className="card-title">{anunt.titlu}</h6>
                            <p className="card-text">{anunt.descriere}</p>
                            <p className="card-text mb-1">
                              <small className="text-muted">
                                Postat de:{" "}
                                <a
                                  href={
                                    user && user.nume === anunt.nume
                                      ? `/profil-personal/${user.nume}`
                                      : `/vizualizare-profil/${anunt.nume}`
                                  }
                                  className="text-decoration-none text-primary"
                                >
                                  {anunt.prenume} {anunt.nume}
                                </a>
                              </small>
                            </p>
                            <small className="text-muted">Valabil până la:{" "}
                              {new Date(anunt.data_expirare).toLocaleDateString("ro-RO", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </small>
                          </div>
                          <div className="col-md-4 text-end">
                            {anunt.imagine && (
                              <img
                                src={`http://localhost:4000/uploads/forum/${anunt.imagine}`}
                                alt="anunt"
                                className="img-fluid rounded mb-2 position-absolute end-0 bottom-0 m-2"
                                onClick={() => setImaginePreview(`http://localhost:4000/uploads/forum/${anunt.imagine}`)}
                                style={{ maxWidth: "190px", maxHeight: "190px", objectFit: "cover", border: "1px solid #ccc", cursor:"pointer" }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>    
        {!showChatBot && (
          <button
            onClick={() => setShowChatBot(true)}
            className="btn btn-primary rounded-circle chatbot-toggle-btn"
            style={{ backgroundImage: "linear-gradient(to right, #4f46e5, #3b82f6)" }}
          >
            💬
          </button>
        )}
        {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} />}

      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Creează un anunț</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Forum
            onClose={() => setShowModal(false)}
            onAnuntCreat={(anuntNou) => {
              setAnunturi((prev) => [anuntNou, ...prev]);
            }}
          />
        </Modal.Body>
      </Modal>
      <Modal show={showModalStergere} onHide={() => setShowModalStergere(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmare ștergere</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Ești sigur că vrei să ștergi anunțul <strong>{anuntDeSters?.titlu}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalStergere(false)}>
            Anulează
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await axios.delete(`http://localhost:4000/forum-studenti/${anuntDeSters.id}`, {
                  withCredentials: true,
                });
                setAnunturi(anunturi.filter((a) => a.id !== anuntDeSters.id));
                setShowModalStergere(false);
              } catch (err) {
                console.error("Eroare la ștergerea anunțului:", err);
                alert("A apărut o eroare la ștergere.");
              }
            }}
          >
            Confirmă ștergerea
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showModalNotificare} onHide={() => setShowModalNotificare(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{notificareSelectata?.titlu}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{notificareSelectata?.mesaj}</p>
          <small className="text-muted">
            Data: {new Date(notificareSelectata?.data).toLocaleString("ro-RO")}
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalNotificare(false)}>
            Închide
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={!!imaginePreview} onHide={() => setImaginePreview(null)} centered>
        <Modal.Header closeButton><Modal.Title>Imagine anunț</Modal.Title></Modal.Header>
        <Modal.Body className="text-center">
          <img src={imaginePreview} alt="preview" className="img-fluid rounded" />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default HomeStudent;
