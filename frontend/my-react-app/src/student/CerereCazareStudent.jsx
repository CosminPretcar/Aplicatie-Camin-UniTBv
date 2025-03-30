import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import "../styles/CerereCazareStudent.css";
import GraficStatisticiCereri from "../utils/GraficStatisticiCereri";

function CerereCazare() {
  const [camine, setCamine] = useState([]);
  const [camere, setCamere] = useState({});
  const [utilizatori, setUtilizatori] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statisticiCereri, setStatisticiCereri] = useState([]);
  const [etajSelectat, setEtajSelectat] = useState("");
  const [acceptRedistribuire, setAcceptRedistribuire] = useState(false);
  const [caminSelectatGrafic, setCaminSelectatGrafic] = useState("");


  const [optCamine, setOptCamine] = useState(["", "", ""]);
  const [optCamere, setOptCamere] = useState(["", "", ""]);
  const [optEtaje, setOptEtaje] = useState(["", "", ""]);
  const [selectedColegi, setSelectedColegi] = useState([]);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success"); // sau "danger"

  const showCustomToast = (message, type = "success") => {
    setToastMsg(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };
  

  useEffect(() => {
    axios.get("http://localhost:4000/camine").then((response) => {
      setCamine(response.data);
    });
  }, []);

  useEffect(() => {
    optCamine.forEach((caminId, index) => {
      if (caminId) {
        axios.get(`http://localhost:4000/camere/${caminId}`).then((response) => {
          setCamere((prev) => ({ ...prev, [index]: response.data }));
        });
      }
    });
  }, [optCamine]);

  useEffect(() => {
    const fetchUtilizatori = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/utilizatori?q=${searchTerm}`, {
          withCredentials: true,
        });
        setUtilizatori(response.data);
        console.log("📡 Utilizatori încărcați:", utilizatori);
      } catch (error) {
        console.error("Eroare la preluarea utilizatorilor:", error);
      }
    };
    fetchUtilizatori();
  }, [searchTerm]);

  useEffect(() => {
    if (caminSelectatGrafic) {  // Verificăm dacă s-a selectat un cămin pentru grafic
      const etajParam = etajSelectat ? `/${etajSelectat}` : ""; 
      console.log("📡 Cerere către:", `http://localhost:4000/statistici/cereri/${caminSelectatGrafic}${etajParam}`);
  
      axios
        .get(`http://localhost:4000/statistici/cereri/${caminSelectatGrafic}${etajParam}`)
        .then((response) => {
          setStatisticiCereri(response.data);
        })
        .catch((error) => console.error("Eroare la preluarea statisticilor cererilor:", error));
    }
  }, [caminSelectatGrafic, etajSelectat]);
  

  const handleOptCaminChange = (index, value) => {
    setOptCamine((prev) => {
      const newOptCamine = [...prev];
      newOptCamine[index] = value;
      return newOptCamine;
    });

    setOptEtaje((prev) => {
      const newOptEtaje = [...prev];
      newOptEtaje[index] = "";
      return newOptEtaje;
    });

    setOptCamere((prev) => {
      const newOptCamere = [...prev];
      newOptCamere[index] = "";
      return newOptCamere;
    });
  };

  const handleOptEtajChange = (index, value) => {
    setOptEtaje((prev) => {
      const newOptEtaje = [...prev];
      newOptEtaje[index] = value;
      return newOptEtaje;
    });

    setOptCamere((prev) => {
      const newOptCamere = [...prev];
      newOptCamere[index] = "";
      return newOptCamere;
    });
  };

  const getTotalPaturi = () => {
    return optCamere.reduce((total, cameraId, index) => {
      if (!cameraId) return total; 
      const camera = (camere[index] || []).find(cam => cam.id.toString() === cameraId);
      return total + (camera ? camera.numar_paturi : 0);
    }, 0);
  };

  const handleColegSelect = (userId) => {
    const numarTotalPaturi = getTotalPaturi();
    const numarStudentiSelectati = selectedColegi.length + 2; // Numărul de studenți selectați precedent + ultimul coleg selectat + utilizatorul curent

      
    if (!optCamere.some((camera) => camera !== "")) {
      showCustomToast("Selectează mai întâi o cameră!", "danger");
      return;
    } 
    if (selectedColegi.includes(userId)) {
      setSelectedColegi((prev) => prev.filter((id) => id !== userId));
      return;
    }

    if (numarStudentiSelectati > numarTotalPaturi) {
      showCustomToast("Ai depășit numărul de paturi disponibile!", "danger");
      return;
    }

    setSelectedColegi((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [userId, ...prev];
      }
    });
    setSearchTerm("");
  };
  const handleSubmit = async () => {
    const cerere = optCamere.map((camera, index) => ({
      caminId: optCamine[index],
      etaj: optEtaje[index],
      cameraId: camera,
    }));
  
    if (cerere.some(opt => !opt.cameraId)) {
      showCustomToast("Selectează toate camerele înainte de a trimite cererea!", "danger");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:4000/cereri", {
        cereri: cerere,
        colegi: selectedColegi,
        acceptRedistribuire: acceptRedistribuire,
      }, { withCredentials: true });
  
      showCustomToast(response.data.message, "success");// ✅ Afișează alert doar dacă cererea a fost depusă cu succes!
      setOptCamine(["", "", ""]);
      setOptEtaje(["", "", ""]);
      setOptCamere(["", "", ""]);
      setSelectedColegi([]);
      setAcceptRedistribuire(false);
  
    } catch (error) {
      if (error.response && error.response.status === 400) {
        showCustomToast(error.response.data.message, "danger");  // 🛑 Dacă există deja o cerere, afișează doar acest mesaj
      } else {
        showCustomToast("Eroare la trimiterea cererii!", "danger");
      }
    }
  };

  return (
    <div>
      <NavBar />
      <div className="containerFormular">
        <h1>Formular Cerere Cazare</h1>
        <div className="grid-container">
          {[...Array(3)].map((_, index) => (
            <div className="form-option" key={index}>
              <h3>Opțiune {index + 1}</h3>

              <div className="form-group">
                <label>Cămin:</label>
                <select value={optCamine[index]} onChange={(e) => handleOptCaminChange(index, e.target.value)}>
                  <option value="">Selectează un cămin</option>
                  {camine.map((camin) => (
                    <option key={camin.id} value={camin.id}>
                      {camin.nume_camin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Etaj:</label>
                <select value={optEtaje[index]} onChange={(e) => handleOptEtajChange(index, e.target.value)}>
                  <option value="">Selectează un etaj</option>
                  {(camere[index] || [])
                    .map((camera) => camera.etaj)
                    .filter((value, i, self) => self.indexOf(value) === i)
                    .map((etaj) => (
                      <option key={etaj} value={etaj}>
                        {etaj == 0 ? "Parter" : `Etaj ${etaj}`}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Camera:</label>
                <select value={optCamere[index]} onChange={(e) => setOptCamere((prev) => {
                  const newOptCamere = [...prev];
                  newOptCamere[index] = e.target.value;
                  return newOptCamere;
                })}>
                  <option value="">Selectează o cameră</option>
                  {(camere[index] || [])
                    .filter((camera) => optEtaje[index] === "" || camera.etaj.toString() === optEtaje[index])
                    .map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        Camera {camera.numar_camera} - {camera.numar_paturi} paturi
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="tabel">
          <div className="form-group">
            <label>Coleg(i) de cameră:</label>
            <input
              type="text"
              placeholder="Caută colegi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar"
            />
            <table className="colegi-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nume</th>
                  <th>Prenume</th>
                  <th>Facultate</th>
                  <th>Specializare</th>
                  <th>Grupa</th>
                </tr>
              </thead>
              <tbody>
                {[...utilizatori]
                  .sort((a, b) => {
                    const isASelected = selectedColegi.includes(a.id);
                    const isBSelected = selectedColegi.includes(b.id);
                    if (isASelected === isBSelected) return 0;
                    return isASelected ? -1 : 1;
                  })
                  .map((user) => (
                    <tr key={user.id} className={selectedColegi.includes(user.id) ? "randSelectatCerere" : ""}>
                      <td>
                        <button 
                          onClick={() => handleColegSelect(user.id)} 
                          className={selectedColegi.includes(user.id) ? "btn-remove" : "btn-add"}>
                          {selectedColegi.includes(user.id) ? "✖ Elimină" : "✔ Adaugă"}
                        </button>
                      </td>
                      <td>{user.nume}</td>
                      <td>{user.prenume}</td>
                      <td>{user.facultate}</td>
                      <td>{user.specializare}</td>
                      <td>{user.grupa}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
            <div className="form-footer">
              <div className="checkbox-container">
                <input 
                  type="checkbox" 
                  id="confirm-checkbox" 
                  checked={acceptRedistribuire}
                  onChange={(e) => setAcceptRedistribuire(e.target.checked)}  
                />
                <label htmlFor="confirm-checkbox">
                  În cazul în care opțiunile tale sunt ocupate, dorești să fii repartizat de către administratorii de cămin în altă cameră alături de colegii tăi?
                </label>
              </div>
                  
              <button className="submit-btn" onClick={handleSubmit}>
                Trimite cererea
              </button>
            </div>
          </div>

            <div className="tabel-container">
              <h3>📊 Statistici cereri pe camere</h3> 
              <div className="form-group">
                <label>Selectează căminul:</label>
                <select value={caminSelectatGrafic} onChange={(e) => setCaminSelectatGrafic(e.target.value)}>
                  <option value="">Selectează un cămin</option>
                  {camine.map((camin) => (
                    <option key={camin.id} value={camin.id}>
                      {camin.nume_camin}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Selectează etajul:</label>
                <select value={etajSelectat} onChange={(e) => setEtajSelectat(e.target.value)}>
                  <option value="">Toate etajele</option>
                  {[...new Set(statisticiCereri.map((c) => c.etaj))].map((etaj) => (
                    <option key={etaj} value={etaj}>
                      {etaj == 0 ? "Parter" : `Etaj ${etaj}`}
                    </option>
                  ))}
                </select>
              </div>
                  
                <GraficStatisticiCereri statistici={statisticiCereri} etajSelectat={etajSelectat} caminSelectat={caminSelectatGrafic}/>
                
          <div className="alert-card">
            <h3>📌 Despre cazare</h3>
            <ul>
              <li>✔️ Daca nu poti completa acest formular, inseamna ca nu ai primit dreptul in cadrul fazei de cazare!</li>
              <li>✔️ Este recomandat ca fiecare student sa completeze cele 3 opțiuni de cazare.</li>
              <li>✔️ Studentii trebuie sa selecteze aceleasi optiuni in cerere ca sa poate fi repartizati in aceeasi camera</li>
              <li>✔️ Numărul maxim de persoane din cameră nu poate fi depășit.</li>
              <li>✔️ După trimiterea cererii, modificările nu mai sunt posibile.</li>
              <li>✔️ Odată aprobată, cazarea devine finală și nu poate fi schimbată decât în cazuri speciale.</li>
              <li>✔️ Este recomandat sa studiati graficul de mai sus, astfel incat sa se evite selectarea acelorasi optiuni de catre mai multi studenti </li>
            </ul>
           </div>
        </div>
      </div>
      {showToast && (
        <div
          className="toast show position-fixed bottom-0 end-0 m-4"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{ zIndex: 9999, minWidth: "250px" }}
        >
          <div className={`toast-header text-white ${toastType === "success" ? "bg-success" : "bg-danger"}`}>
            <strong className="me-auto">{toastType === "success" ? "Succes" : "Eroare"}</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)}></button>
          </div>
          <div className="toast-body">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}

export default CerereCazare;
