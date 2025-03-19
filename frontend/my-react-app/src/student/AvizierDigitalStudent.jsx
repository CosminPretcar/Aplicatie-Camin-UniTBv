import React, { useState, useEffect } from "react";
import axios from "axios";

function AvizierStudent() {
  const [anunturi, setAnunturi] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:4000/anunturi")
      .then(response => setAnunturi(response.data))
      .catch(error => console.error("Eroare la preluarea anunțurilor:", error));
  }, []);

  const getBadgeColor = (importanta) => {
    switch (importanta) {
      case "critică":
        return "bg-danger text-white"; // 🔴 Roșu
      case "medie":
        return "bg-warning text-dark"; // 🟡 Galben
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
      <hr />

      {/* Lista anunțurilor cu scroll */}
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AvizierStudent;
