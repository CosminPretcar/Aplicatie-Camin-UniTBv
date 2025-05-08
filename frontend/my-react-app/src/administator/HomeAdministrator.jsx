import React, {useState, useEffect} from "react";
import NavBarAdmin from "../components/NavBarAdmin";
import axios from "axios";
import Avizier from "./AvizierDigitalAdministrator";
import ChatBot from "../components/ChatBot";
import { Button, Modal } from "react-bootstrap";

function HomeAdministrator() {
  const [user, setUser] = useState({ nume: "utilizator", prenume: "" });
  const [ora, setOra] = useState(new Date());
  const [anunturi, setAnunturi] = useState([]);

  const [anuntSelectat, setAnuntSelectat] = useState(null);
  const [motivStergere, setMotivStergere] = useState("");
  const [showModalStergere, setShowModalStergere] = useState(false);
  const [loadingStergere, setLoadingStergere] = useState(false);

  const [showChatBot, setShowChatBot] = useState(false);

  const [notificari, setNotificari] = useState([]);
  const [showNotificari, setShowNotificari] = useState(false);

  const [notificareSelectata, setNotificareSelectata] = useState(null);
  const [showModalNotificare, setShowModalNotificare] = useState(false);




  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(async (response) => {
        if (response.data.isAuthenticated) {
          setUser({
            id: response.data.id, // 🟢 Adaugă ID-ul
            nume: response.data.nume,
            prenume: response.data.prenume
          });
          console.log("👤 Răspuns autentificare:", response.data);


          try {
            const res = await axios.get(`http://localhost:4000/notificari/${response.data.id}`, { withCredentials: true });
            setNotificari(res.data);
          } catch (err) {
            console.error("Eroare la încărcarea notificărilor:", err);
          }
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

  const handleConfirmaStergere = async () => {
    setLoadingStergere(true);
    try {
      await axios.delete(`http://localhost:4000/forum-studenti/${anuntSelectat.id}`, {
        data: { motiv: motivStergere }, // include motivul în body
        withCredentials: true,
      });
  
      // Opțional: dacă nu trimite backend-ul email, poți face POST separat aici către /trimite-email-anunt-sters
  
      setAnunturi(anunturi.filter((a) => a.id !== anuntSelectat.id));
      setShowModalStergere(false);
    } catch (err) {
      console.error("Eroare la ștergere:", err);
      alert("Eroare la ștergerea anunțului.");
    } finally {
      setLoadingStergere(false);
    }
  };
  

  const deschideModalStergere = (anunt) => {
    setAnuntSelectat(anunt);
    setMotivStergere("");
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
        console.error("Eroare la marcarea notificării:", err);
      }
    }
  };
  


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
              <div className="position-relative">
                <h2 className="text-center mb-0">Bine ai revenit, {user.nume} {user.prenume}!</h2>

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
                      {notificari.length === 0 ? (
                        <p className="text-muted text-center mb-0">Nu ai notificări</p>
                      ) : (
                        <ul className="list-group small">
                          {notificari.slice(0, 5).map(n => (
                            <li className="list-group-item d-flex justify-content-between align-items-start">
                              <div onClick={() => deschideNotificare(n)} style={{ cursor: "pointer" }}>
                                <div>{n.titlu}</div>
                                <small className="text-muted">{new Date(n.data).toLocaleString("ro-RO")}</small>
                              </div>
                              <div className="ms-2 d-flex align-items-center">
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  title="Șterge notificarea"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    axios.delete(`http://localhost:4000/notificari/${n.id}`, { withCredentials: true })
                                      .then(() => {
                                        setNotificari((prev) => prev.filter((notif) => notif.id !== n.id));
                                      })
                                      .catch((err) => {
                                        console.error("Eroare la ștergerea notificării:", err);
                                      });
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
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
              <div className="card shadow p-3 border-2 border-dark rounded-2" style={{ maxHeight: "600px" }}>
                <h4 className="text-center mb-3">🗣️ Anunțuri publicate de studenți</h4>
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {anunturi.length === 0 ? (
                  <p className="text-muted">Nu există anunțuri momentan.</p>
                ) : (
                  anunturi.map((anunt) => (
                    <div key={anunt.id} className="card mb-3 position-relative">
                      <button
                        className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2"
                        onClick={() => deschideModalStergere(anunt)}
                      >
                        🗑️
                      </button>
                      <div className="card-body">
                        <h5 className="card-title">{anunt.titlu}</h5>
                        <p className="card-text">{anunt.descriere}</p>
                        <p className="card-text">
                          <small className="text-muted">Postat de: {anunt.prenume} {anunt.nume}</small>
                        </p>
                        <p className="card-text">
                          <small className="text-muted">Valabil până la: {new Date(anunt.data_expirare).toLocaleDateString("ro-RO")}</small>
                        </p>
                        {anunt.imagine && (
                          <img
                            src={`http://localhost:4000/uploads/forum/${anunt.imagine}`}
                            alt="anunt"
                            className="img-fluid rounded position-absolute end-0 bottom-0 m-2"
                            style={{  maxWidth: "230px", maxHeight: "230px", objectFit: "cover", border: "1px solid #ccc" }}
                          />
                        )}
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
        <Modal show={showModalStergere} onHide={() => setShowModalStergere(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Șterge anunț</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Vei șterge anunțul <strong>{anuntSelectat?.titlu}</strong> postat de <strong>{anuntSelectat?.prenume} {anuntSelectat?.nume}</strong>.</p>
            <div className="mb-3">
              <label className="form-label">Motivul ștergerii (va fi trimis pe email studentului):</label>
              <textarea
                className="form-control"
                rows={4}
                value={motivStergere}
                onChange={(e) => setMotivStergere(e.target.value)}
                required
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModalStergere(false)}>
              Anulează
            </Button>
            <Button variant="danger" onClick={handleConfirmaStergere} disabled={loadingStergere}>
              {loadingStergere ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Se șterge...
                </>
              ) : (
                "Confirmă și trimite email"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
        {showModalNotificare && notificareSelectata && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-dark">
                <div className="modal-header">
                  <h5 className="modal-title">{notificareSelectata.titlu}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModalNotificare(false)}></button>
                </div>
                <div className="modal-body">
                  <p>{notificareSelectata.mesaj}</p>
                  <small className="text-muted">Data: {new Date(notificareSelectata.data).toLocaleString("ro-RO")}</small>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModalNotificare(false)}>Închide</button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default HomeAdministrator;
