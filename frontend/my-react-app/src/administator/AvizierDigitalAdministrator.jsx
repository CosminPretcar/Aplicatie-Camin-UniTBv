import React, { useState, useEffect } from "react";
import axios from "axios";

function Avizier() {
  const [anunturi, setAnunturi] = useState([]);
  const [nouAnunt, setNouAnunt] = useState("");
  const [importanta, setImportanta] = useState("medie");

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
    axios.delete(`http://localhost:4000/anunturi/${id}`)
      .then(() => setAnunturi(anunturi.filter(anunt => anunt.id !== id)))
      .catch(error => console.error("Eroare la ștergerea anunțului:", error));
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
    </div>
  );
}

export default Avizier;
