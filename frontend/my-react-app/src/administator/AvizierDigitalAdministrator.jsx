import React, { useState, useEffect } from "react";
import axios from "axios";
import { Toast, Modal, Button } from "react-bootstrap";

function Avizier() {
  const [anunturi, setAnunturi] = useState([]);
  const [nouAnunt, setNouAnunt] = useState("");
  const [importanta, setImportanta] = useState("medie");

  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editImportanta, setEditImportanta] = useState("medie");

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
      .then(response => {
        const sortate = response.data.sort((a, b) => b.fixat - a.fixat || new Date(b.data) - new Date(a.data));
        setAnunturi(sortate);
      })
      .catch(error => console.error("Eroare la preluarea anunțurilor:", error));
  }, []);

const handleAddAnunt = () => {
  if (nouAnunt.trim() === "") return;

  axios.post("http://localhost:4000/anunturi", { text: nouAnunt, importanta, fixat: false })
    .then(response => {
      const nou = response.data;

      // Separă anunțurile fixate de cele normale
      const fixate = anunturi.filter(a => a.fixat);
      const nefixate = anunturi.filter(a => !a.fixat);

      // Adaugă noul anunț la începutul celor nefixate
      const actualizat = [...fixate, nou, ...nefixate];
      setAnunturi(actualizat);
    })
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

  const startEdit = (anunt) => {
    setEditId(anunt.id);
    setEditText(anunt.text);
    setEditImportanta(anunt.importanta);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditText("");
    setEditImportanta("medie");
  };

  const saveEdit = async (id, fixat) => {
    try {
      const response = await axios.put(`http://localhost:4000/anunturi/${id}`, {
        text: editText,
        importanta: editImportanta,
        fixat
      });
      setAnunturi(anunturi.map(a => a.id === id ? response.data : a));
      cancelEdit();
      showCustomToast("Anunțul a fost actualizat!");
    } catch (err) {
      console.error("Eroare la salvare:", err);
      showCustomToast("Eroare la actualizarea anunțului!", "danger");
    }
  };

  const toggleFixare = async (anunt) => {
    try {
      const updated = { ...anunt, fixat: !anunt.fixat };
      const response = await axios.put(`http://localhost:4000/anunturi/${anunt.id}`, updated);
      const sortate = anunturi.map(a => a.id === anunt.id ? response.data : a)
        .sort((a, b) => b.fixat - a.fixat || new Date(b.data) - new Date(a.data));
      setAnunturi(sortate);
      showCustomToast(anunt.fixat ? "Anunțul nu mai este fixat" : "Anunțul a fost fixat");
    } catch (err) {
      console.error("Eroare la fixare:", err);
      showCustomToast("Eroare la fixarea anunțului!", "danger");
    }
  };

  const getBadgeColor = (importanta) => {
    switch (importanta) {
      case "critică":
        return "bg-danger text-white";
      case "medie":
        return "bg-warning text-white";
      case "scăzută":
        return "bg-success text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getIcon = (importanta) => {
    switch (importanta) {
      case "critică":
        return "❗";
      case "medie":
        return "⚠️";
      case "scăzută":
        return "ℹ️";
      default:
        return "📌";
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
          <button className="btn btn-primary px-3" onClick={handleAddAnunt}>➕ Adaugă anunț</button>
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
              {editId === anunt.id ? (
                <>
                  <textarea
                    className="form-control mb-2"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="d-flex justify-content-between align-items-center">
                    <select className="form-select w-auto" value={editImportanta} onChange={(e) => setEditImportanta(e.target.value)}>
                      <option value="scăzută">🟢 Scăzută</option>
                      <option value="medie">🟡 Medie</option>
                      <option value="critică">🔴 Critică</option>
                    </select>
                    <div className="d-flex gap-2">
                      <button className="btn btn-success" onClick={() => saveEdit(anunt.id, anunt.fixat)}>💾 Salvează</button>
                      <button className="btn btn-secondary" onClick={cancelEdit}>❌ Anulează</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{getIcon(anunt.importanta)} {anunt.text}</h5>
                    <small className="text-white">{new Date(anunt.data).toLocaleString("ro-RO")}</small>
                    {anunt.fixat && <span className="badge bg-light text-dark ms-2">📌 Fixat</span>}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-light btn-sm" onClick={() => toggleFixare(anunt)}>
                      {anunt.fixat ? "📍 Anulează fixarea" : "📌 Fixează"}
                    </button>
                    <button className="btn btn-outline-light btn-sm" onClick={() => startEdit(anunt)}>✏️ Editează</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAnunt(anunt.id)}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Toast notificare */}
      {showToast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999 }}>
          <div className={`toast-header text-white ${toastType === "success" ? "bg-success" : "bg-danger"}`}>
            <strong className="me-auto">{toastType === "success" ? "Succes" : "Eroare"}</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)}></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}

      {/* Modal confirmare ștergere */}
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
