import React, { useState, useEffect } from "react";
import NavBarAdmin from "../components/NavBarAdmin";
import "../styles/CerereCazareAdministrator.css";
import axios from "axios";

function CereriCazareAdministrator() {

  const [cereri, setCereri] = useState([]);
  const [etaje, setEtaje] = useState([]);
  const [camere, setCamere] = useState([]);
  const [filterEtaj, setFilterEtaj] = useState("");
  const [filterCamera, setFilterCamera] = useState("");
  const [filterOptiune, setFilterOptiune] = useState("");
  const [camereCamin, setCamereCamin] = useState({});
  const [cerereSelectata, setCerereSelectata] = useState(null);
  const [optiuneSelectata, setOptiuneSelectata] = useState("");


  useEffect(() => {
    fetch("http://localhost:4000/cereri", {
      credentials: "include", 
    })
      .then((response) => response.json())
      .then((data) => setCereri(data))
      .catch((error) => console.error("Eroare la preluarea cererilor:", error));

      fetch("http://localhost:4000/etaje-si-camere", {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          setEtaje(data.etaje);
          setCamere(data.camere);
        })
        .catch((error) => console.error("Eroare la preluarea etajelor și camerelor:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/camine/camere", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        const groupedCamere = {};
        data.forEach(({ etaj, numar_camera, este_disponibila }) => {
          if (!groupedCamere[etaj]) {
            groupedCamere[etaj] = [];
          }
          groupedCamere[etaj].push({ numar_camera, este_disponibila });
        });
        setCamereCamin(groupedCamere);
      })
      .catch((error) => console.error("Eroare la preluarea camerelor:", error));
  }, []);

  const camereFiltrate = filterEtaj ? camere.filter((c) => c.etaj == filterEtaj) : camere;

  const filteredCereri = cereri.filter((cerere) => {
    const cameraFiltrata = filterCamera ? parseInt(filterCamera.trim(), 10) : null;
  
    if (!filterOptiune) return true; // Dacă nu e selectată nicio opțiune, afișez toate cererile
  
    if (!cameraFiltrata) return true; // Dacă nu e selectată nicio cameră, sunt afisate toate cererile
  
    // Verific dacă în opțiunea selectată se află camera aleasă
    if (filterOptiune === "1") return cerere.optiune1_camera && parseInt(cerere.optiune1_camera) === cameraFiltrata;
    if (filterOptiune === "2") return cerere.optiune2_camera && parseInt(cerere.optiune2_camera) === cameraFiltrata;
    if (filterOptiune === "3") return cerere.optiune3_camera && parseInt(cerere.optiune3_camera) === cameraFiltrata;
  
    return true; // Dacă nu se potrivește nicio condiție, returnez toate cererile
  });

const handleValidare = async () => {
  if (!optiuneSelectata) {
    alert("Selectează o opțiune pentru validare!");
    return;
  }

  try {
    console.log("🔍 Trimit cererea de validare:", {
      cerereId: cerereSelectata.id,
      optiune: optiuneSelectata
    });

    const response = await axios.put("http://localhost:4000/cereri/validare", {
      cerereId: cerereSelectata.id,
      optiune: optiuneSelectata
    }, { withCredentials: true });

    alert(response.data.message);
    setCerereSelectata(null);
    window.location.reload();

  } catch (error) {
    console.error("Eroare la validare:", error);
    alert(error.response?.data?.message || "A apărut o eroare!");
  }
};

const handleRespingere = async () => {
  if (!cerereSelectata) {
    alert("Nu a fost selectată nicio cerere!");
    return;
  }

  const confirmare = window.confirm("Sigur vrei să respingi această cerere?");
  if (!confirmare) return;

  try {
    console.log("🗑 Ștergere cerere:", cerereSelectata.id);

    const response = await axios.delete(`http://localhost:4000/cereri/${cerereSelectata.id}`, {
      withCredentials: true
    });

    alert(response.data.message);
    setCerereSelectata(null);
    window.location.reload();

  } catch (error) {
    console.error("Eroare la ștergerea cererii:", error);
    alert(error.response?.data?.message || "A apărut o eroare!");
  }
};

  
  

  return (
    <div>
      <NavBarAdmin />
      <div className="table-container">
        <div className="table-card">
          <h2>Cereri de cazare</h2>

          <div className="filters-container">
          {/* <h2 className="filters-title">Filtre pentru a afișa cererile de cazare care corespund criteriilor selectate.</h2> */}
            <div className="filters-form">
              <label htmlFor="optiune">Opțiune:</label>
              <select id="optiune" onChange={(e) => setFilterOptiune(e.target.value)} value={filterOptiune}>
                <option value="">Toate</option>
                <option value="1">Opțiunea 1</option>
                <option value="2">Opțiunea 2</option>
                <option value="3">Opțiunea 3</option>
              </select>
              <label htmlFor="etaj">Etaj:</label>
              <select id="etaj" onChange={(e) => setFilterEtaj(e.target.value)} value={filterEtaj} disabled={!filterOptiune}>
                <option value="">Selectează etajul</option>
                {etaje.map((etaj, index) => (
                  <option key={index} value={etaj.etaj}>
                    Etaj {etaj.etaj}
                  </option>
                ))}
              </select>
              
              <label htmlFor="camera">Cameră:</label>
              <select id="camera" onChange={(e) => setFilterCamera(e.target.value)} value={filterCamera} disabled={!filterEtaj}>
                <option value="">Selectează camera</option>
                {camereFiltrate.map((camera) => (
                  <option key={camera.id} value={camera.numar_camera}>
                    Camera {camera.numar_camera}
                  </option>
                ))}
              </select>


              
              <button className="reset-button" onClick={() => { setFilterEtaj(""); setFilterCamera(""); setFilterOptiune(""); }}>
                🔄 Resetare filtre
              </button>
            </div>
          </div>

          <table className="cereri-table">
            <thead>
              <tr>
                <th>Id cerere</th>
                <th>Nume</th>
                <th>Prenume</th>
                <th>Optiune 1</th>
                <th>Optiune 2</th>
                <th>Optiune 3</th>
                <th>Colegi</th>
                <th>Data si ora</th>
                <th>Optiuni cerere</th>
              </tr>
            </thead>
            <tbody>
              {filteredCereri.map((cerere) => (
                <tr key={cerere.id}>
                  <td>{cerere.id}</td>
                  <td>{cerere.nume}</td>
                  <td>{cerere.prenume}</td>
                  <td>{cerere.optiune1_camin ? `Cămin ${cerere.optiune1_camin} - Camera ${cerere.optiune1_camera}` : "-"}</td>
                  <td>{cerere.optiune2_camin ? `Cămin ${cerere.optiune2_camin} - Camera ${cerere.optiune2_camera}` : "-"}</td>
                  <td>{cerere.optiune3_camin ? `Cămin ${cerere.optiune3_camin} - Camera ${cerere.optiune3_camera}` : "-"}</td>
                  <td>{cerere.colegi || "-"}</td>
                  <td>{new Date(cerere.data_creare).toLocaleString("ro-RO")}</td>
                  <td>
                    <button onClick={() => setCerereSelectata(cerere)}>Selectează</button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          {cerereSelectata && (
            <div className="validare-container">
              <h3>Validare Cerere #{cerereSelectata.id} - {cerereSelectata.nume} {cerereSelectata.prenume}</h3>

              <label>Selectează opțiunea de validare:</label>
              <select onChange={(e) => setOptiuneSelectata(e.target.value)} value={optiuneSelectata}>
                <option value="">Selectează</option>
                {cerereSelectata.optiune1_camera && <option value="1">Opțiunea 1: Camera {cerereSelectata.optiune1_camera}</option>}
                {cerereSelectata.optiune2_camera && <option value="2">Opțiunea 2: Camera {cerereSelectata.optiune2_camera}</option>}
                {cerereSelectata.optiune3_camera && <option value="3">Opțiunea 3: Camera {cerereSelectata.optiune3_camera}</option>}
              </select>

              <button onClick={() => handleValidare()}>Validează Cererea</button>
              <button onClick={() => handleRespingere()}>Respinge Cererea</button>
              <button onClick={() => setCerereSelectata(null)}>Anulează</button>
            </div>
          )}

          <br />
          <h2>Camere disponibile în cămin</h2>
          <div className="camere-grid">
            {Object.keys(camereCamin).map((etaj) => (
              <div key={etaj} className="etaj-container">
                <h3>Etaj {etaj}</h3>
                <div className="camere-list">
                  {camereCamin[etaj].map(({ numar_camera, este_disponibila }) => (
                    <div 
                      key={numar_camera} 
                      className={`camera-card ${este_disponibila ? "disponibila" : "indisponibila"}`}
                    >
                      {numar_camera}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CereriCazareAdministrator;
