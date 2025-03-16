import React, { useState, useEffect, useRef } from "react";
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
  const [studentiRedistribuire, setStudentiRedistribuire] = useState([]);
  const [studentSelectat, setStudentSelectat] = useState(null);
  const [cameraSelectata, setCameraSelectata] = useState("");
  const [cereriColegi, setCereriColegi] = useState([]);


  const cazareRef = useRef(null);
  const validareRef = useRef(null);
  const tabelRef = useRef(null);//tabel cereri

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
        data.forEach(({ etaj, numar_camera, numar_paturi, este_disponibila }) => {
          if (!groupedCamere[etaj]) {
            groupedCamere[etaj] = [];
          }
          groupedCamere[etaj].push({ numar_camera, numar_paturi, este_disponibila });
        });
        setCamereCamin(groupedCamere);
      })
      .catch((error) => console.error("Eroare la preluarea camerelor:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/studenti-redistribuire", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setStudentiRedistribuire(data))
      .catch((error) => console.error("Eroare la preluarea studenților pentru redistribuire:", error));
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

const handleCazareManuala = async () => {
  if (!studentSelectat || !cameraSelectata) {
    alert("Selectați un student și o cameră!");
    return;
  }

  try {
    const response = await axios.put("http://localhost:4000/studenti/cazare", {
      studentId: studentSelectat.id,
      cameraId: cameraSelectata
    }, { withCredentials: true });

    alert(response.data.message);
    setStudentSelectat(null);
    setCameraSelectata("");
    window.location.reload(); // Reîncărcăm lista pentru a actualiza camerele

  } catch (error) {
    console.error("Eroare la cazarea studentului:", error);
    alert(error.response?.data?.message || "A apărut o eroare!");
  }
};

useEffect(() => {
  fetch("http://localhost:4000/camine/camere-disponibile", { credentials: "include" })
    .then((response) => response.json())
    .then((data) => {
      console.log("📥 Camere disponibile primite în frontend:", data); // Debugging
      setCamere(data);
    })
    .catch((error) => console.error("Eroare la preluarea camerelor disponibile:", error));
}, []);

const downloadExcel = async () => {
  try {
      const response = await fetch("http://localhost:4000/cereri/export-excel", {
          method: "GET",
          credentials: "include",
      });

      if (!response.ok) {
          throw new Error("Eroare la descărcarea fișierului Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cereri_Cazare.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  } catch (error) {
      console.error("Eroare la descărcarea fișierului:", error);
      alert("A apărut o eroare la descărcare!");
  }
};

const findCereriColegi = (student) => {
  if (!student) return [];

  return cereri.filter((cerere) => 
    cerere.colegi && cerere.colegi.includes(student.nume) && cerere.colegi.includes(student.prenume)
  );
};

const downloadCamereExcel = async () => {
  try {
      const response = await fetch("http://localhost:4000/export/camere-excel", {
          method: "GET",
          credentials: "include",
      });

      if (!response.ok) {
          throw new Error("Eroare la descărcarea fișierului Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Verificăm dacă header-ul conține "Content-Disposition"
      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = "Camere_Camin.xlsx"; // Nume fallback

      if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) {
              fileName = match[1]; // Extragem numele real al fișierului
          }
      }

      console.log("📂 Fișier descărcat:", fileName);

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
  } catch (error) {
      console.error("Eroare la descărcarea fișierului:", error);
      alert("A apărut o eroare la descărcare!");
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

          <table ref={tabelRef} className="cereri-table">
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
                <th>Accepta redistribuirea</th>
                <th>Optiuni cerere</th>
              </tr>
            </thead>
            <tbody>
              {filteredCereri.length > 0 ? (
                filteredCereri.map((cerere) => (
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
                      {cerere.accept_redistribuire ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>✔ Da</span>
                      ) : (
                        <span style={{ color: "red", fontWeight: "bold" }}>✖ Nu</span>
                      )}
                    </td>
                    <td>
                      <button 
                          onClick={() => {
                            setCerereSelectata(cerere);
                            setCereriColegi(findCereriColegi(cerere));
                            setTimeout(() => {
                              validareRef.current?.scrollIntoView({ behavior: "smooth", block: "center"});
                            }, 100); // Mic delay pentru siguranță
                          }}
                        >
                          Selectează
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "15px", fontStyle: "italic", color: "gray" }}>
                    Nu există cereri de cazare.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
          {cerereSelectata && (
            <div ref={validareRef} className="validare-container">
              <h3>Validare Cerere #{cerereSelectata.id} - {cerereSelectata.nume} {cerereSelectata.prenume}</h3>

              <label>Selectează opțiunea de validare:</label>
              <select onChange={(e) => setOptiuneSelectata(e.target.value)} value={optiuneSelectata}>
                <option value="">Selectează</option>
                {cerereSelectata.optiune1_camera && <option value="1">Opțiunea 1: Camera {cerereSelectata.optiune1_camera}</option>}
                {cerereSelectata.optiune2_camera && <option value="2">Opțiunea 2: Camera {cerereSelectata.optiune2_camera}</option>}
                {cerereSelectata.optiune3_camera && <option value="3">Opțiunea 3: Camera {cerereSelectata.optiune3_camera}</option>}
              </select>

              <button 
                style={{ color: "white", backgroundColor: "green", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer" }} 
                onClick={() => {
                  handleValidare();
                  setTimeout(() => {
                    tabelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}>
                Validează Cererea
              </button>

              <button 
                style={{ color: "white", backgroundColor: "red", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer" }} 
                onClick={() => {
                  handleRespingere();
                  setTimeout(() => {
                    tabelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}>
                Respinge Cererea
              </button>

              <button 
                style={{ color: "black", backgroundColor: "lightgray", padding: "10px", border: "none", borderRadius: "5px", cursor: "pointer" }} 
                onClick={() => {
                   setCerereSelectata(null);
                   setTimeout(() => {
                     tabelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                   }, 100);
                 }}
                >
                  Anulează
              </button>  
              {cereriColegi.length > 0 && (
                <div className="colegi-cereri-container">
                  <h3>Cererile în care studentul selectat apare ca și coleg:</h3>
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
                      </tr>
                    </thead>
                    <tbody>
                      {cereriColegi.map((cerere) => (
                        <tr key={cerere.id}>
                          <td>{cerere.id}</td>
                          <td>{cerere.nume}</td>
                          <td>{cerere.prenume}</td>
                          <td>{cerere.optiune1_camin ? `Cămin ${cerere.optiune1_camin} - Camera ${cerere.optiune1_camera}` : "-"}</td>
                          <td>{cerere.optiune2_camin ? `Cămin ${cerere.optiune2_camin} - Camera ${cerere.optiune2_camera}` : "-"}</td>
                          <td>{cerere.optiune3_camin ? `Cămin ${cerere.optiune3_camin} - Camera ${cerere.optiune3_camera}` : "-"}</td>
                          <td>{cerere.colegi || "-"}</td>
                          <td>{new Date(cerere.data_creare).toLocaleString("ro-RO")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <div className="download-buttons">
            <button onClick={downloadExcel} className="export-button">
                📥 Descarcă lista cu cereri
            </button>
          </div>
          <br />
          <hr />
          <h2>Camere disponibile în cămin</h2>
          <div className="camere-grid">
            {Object.keys(camereCamin).map((etaj) => {
              const camereEtaj = camereCamin[etaj];
      
              const grupuriCamere = [];
              for (let i = 0; i < camereEtaj.length; i += 6) {
                grupuriCamere.push(camereEtaj.slice(i, i + 6));
              }
            
              return (
                <div key={etaj} className="etaj-container">
                  <h3>{etaj == 0 ? "Parter" : `Etaj ${etaj}`}</h3>
              
                  {grupuriCamere.map((grup, index) => (
                    <div key={index} className="camere-list">
                      {grup.map(({ numar_camera, numar_paturi, este_disponibila }) => (
                        <div
                          key={numar_camera}
                          className={`camera-card ${este_disponibila ? "disponibila" : "indisponibila"}`}
                        >
                          {`${numar_camera} - ${numar_paturi} paturi`}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="download-buttons">
            <button onClick={downloadCamereExcel} className="export-button">
                📥 Descarcă situatia camerelor
            </button>
          </div>  
          <br />
          <hr />
          <h2>Studenti ce au cerut redistribuire</h2>
            <table className="redistribuire-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nume</th>
                  <th>Prenume</th>
                  <th>Facultate</th>
                  <th>Specializare</th>
                  <th>Email</th>
                  <th>Optiuni student</th>
                </tr>
              </thead>
              <tbody>
                {studentiRedistribuire.length > 0 ? (
                  studentiRedistribuire.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.nume}</td>
                      <td>{student.prenume}</td>
                      <td>{student.facultate}</td>
                      <td>{student.specializare}</td>
                      <td>{student.email}</td>
                      <td>
                        <button 
                            className="select-student" 
                            onClick={() => {
                              setStudentSelectat(student); 
                              setTimeout(() => {
                                cazareRef.current?.scrollIntoView({ behavior: "smooth" });
                              }, 100); // Mic delay pentru a asigura că elementul există
                            }}
                          >
                            Selectează
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>Nu există studenți care au cerut redistribuire.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <br />
            {studentSelectat && (
             <div ref={cazareRef} className="cazare-manuala">
               <h3>Cazare manuală pentru {studentSelectat.nume} {studentSelectat.prenume}</h3>

               <label>Selectează o cameră:</label>
               <select onChange={(e) => setCameraSelectata(e.target.value)} value={cameraSelectata}>
                <option value="">Alege o cameră</option>
                {camere.length > 0 ? (
                  camere.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {`Camera ${camera.numar_camera}`}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Nicio cameră disponibilă</option>
                )}
                </select>               
                 <button 
                   className="cazare-student"
                   onClick={() => handleCazareManuala()} 
                   disabled={!cameraSelectata}
                 >
                   Cazează studentul
                 </button>
                 <button 
                   className="cancel-button"
                   onClick={() => {setStudentSelectat(null); setCameraSelectata(null)}} // Resetează studentul selectat
                  >
                   Anulează
                 </button> 
             </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default CereriCazareAdministrator;
