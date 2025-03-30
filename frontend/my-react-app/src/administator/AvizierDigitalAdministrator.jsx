import React, { useState, useEffect } from "react";
import axios from "axios";
import {Toast, Modal, Button} from "react-bootstrap"

function Avizier() {
  const [anunturi, setAnunturi] = useState([]);
  const [nouAnunt, setNouAnunt] = useState("");
  const [importanta, setImportanta] = useState("medie");

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [anuntDeSters, setAnuntDeSters] = useState(null);

  const showCustomToast = (message, type = "success") => {
    setToastMsg(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    axios.get("http://localhost:4000/anunturi")
      .then(response => setAnunturi(response.data))
      .catch(error => console.error("Eroare la preluarea anunțurilor:", error));
  }, []);

  const handleAddAnunt = () => {
    if (nouAnunt.trim() === "") return;

    axios.post("http://localhost:4000/anunturi", { text: nouAnunt, importanta })
      .then(response => setAnunturi([response.data, ...anunturi]))
      .catch(error => console.error("Eroare la adăugarea anunțului:", error));

    setNouAnunt("");
    setImportanta("medie");
  };

  const handleDeleteAnunt = (id) => {
    setAnuntDeSters(id);
    setShowConfirmModal(true);
  };

  const confirmaStergere = async () => {
    try {
      await axios.delete(`http://localhost:4000/anunturi/${anuntDeSters}`);
      setAnunturi(anunturi.filter(a => a.id !== anuntDeSters));
      showCustomToast("Anunțul a fost șters!", "success");
    } catch (err) {
      console.error("Eroare la ștergere:", err);
      showCustomToast("Eroare la ștergerea anunțului!", "danger");
    } finally {
      setShowConfirmModal(false);
    }
  };

  const getBadgeColor = (importanta) => {
    switch (importanta) {
      case "critică":
        return "bg-danger text-white"; // 🔴 Roșu
      case "medie":
        return "bg-warning text-white"; // 🟡 Galben
      case "scăzută":
        return "bg-success text-white"; // 🟢 Verde
      default:
        return "bg-secondary text-white"; // ⚪ Gri
    }
  };

  const getIcon = (importanta) => {
    switch (importanta) {
      case "critică":
        return "❗"; // Exclamare pentru anunțuri critice
      case "medie":
        return "⚠️"; // Atenție pentru anunțuri medii
      case "scăzută":
        return "ℹ️"; // Info pentru anunțuri scăzute
      default:
        return "📌"; // Default pin
    }
  };

  return (
    <div className="card shadow p-3 border-2 border-dark rounded" style={{ maxHeight: "700px", overflow: "hidden" }}>
      <h2 className="text-center mb-3">📢 Avizier Digital</h2>

      {/* Formular pentru adăugare anunț */}
      <div className="mb-3">
        <textarea
          className="form-control"
          rows="2"
          placeholder="Scrie un anunț..."
          value={nouAnunt}
          onChange={(e) => setNouAnunt(e.target.value)}
        />
        <div className="d-flex align-items-center mt-2">
          <select className="form-select w-auto me-2" value={importanta} onChange={(e) => setImportanta(e.target.value)}>
            <option value="scăzută">🟢 Scăzută</option>
            <option value="medie">🟡 Medie</option>
            <option value="critică">🔴 Critică</option>
          </select>
          <button className="btn btn-primary px-3" onClick={handleAddAnunt}>
            ➕ Adaugă anunț
          </button>
        </div>
      </div>
      <hr />

      {/* Lista anunțurilor */}
      <div className="mt-3" style={{ maxHeight: "600px", overflowY: "auto" }}>
        {anunturi.length === 0 ? (
          <p className="text-muted text-center">Nu există anunțuri.</p>
        ) : (
          anunturi.map((anunt) => (
            <div key={anunt.id} className={`card p-3 mb-2 ${getBadgeColor(anunt.importanta)}`}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">{getIcon(anunt.importanta)} {anunt.text}</h5>
                  <small className="text-muted">{new Date(anunt.data).toLocaleString("ro-RO")}</small>
                </div>
                <button className="btn p-0" onClick={() => handleDeleteAnunt(anunt.id)}>🗑️ Șterge</button>
              </div>
            </div>
          ))
        )}
      </div>
      {showToast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999 }}>
          <div className={`toast-header text-white ${toastType === "success" ? "bg-success" : "bg-danger"}`}>
            <strong className="me-auto">{toastType === "success" ? "Succes" : "Eroare"}</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)}></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmare ștergere</Modal.Title>
        </Modal.Header>
        <Modal.Body>Ești sigur(ă) că vrei să ștergi acest anunț?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Anulează</Button>
          <Button variant="danger" onClick={confirmaStergere}>Confirmă</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Avizier;
