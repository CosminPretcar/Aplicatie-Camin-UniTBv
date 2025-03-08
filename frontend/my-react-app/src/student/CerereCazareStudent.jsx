import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import "../styles/CerereCazare.css";

function CerereCazare() {
  const [camine, setCamine] = useState([]);
  const [camere, setCamere] = useState({});
  const [utilizatori, setUtilizatori] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [optCamine, setOptCamine] = useState(["", "", ""]);
  const [optCamere, setOptCamere] = useState(["", "", ""]);
  const [optEtaje, setOptEtaje] = useState(["", "", ""]);
  const [selectedColegi, setSelectedColegi] = useState([]);

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
      } catch (error) {
        console.error("Eroare la preluarea utilizatorilor:", error);
      }
    };
    fetchUtilizatori();
  }, [searchTerm]);

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

  const handleColegSelect = (userId) => {
    setSelectedColegi((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = () => {
    const cerere = optCamere.map((camera, index) => ({
      caminId: optCamine[index],
      etaj: optEtaje[index],
      cameraId: camera,
    }));
    console.log("🔹 Cerere trimisă:", cerere); // Verificăm ce date se trimit

    if (cerere.some(opt => !opt.cameraId)) {
      alert("Selectați toate opțiunile de camere!");
      return;
    }

    alert(`Cererea de cazare trimisă:\n${JSON.stringify(cerere, null, 2)}\nColeg(i): ${selectedColegi.join(", ")}`);

    axios.post("http://localhost:4000/cereri", {
      cereri: cerere,
      colegi: selectedColegi,
    }, { withCredentials: true })
    .then(response => {
      alert(response.data.message);
    })
    .catch(error => {
      console.error("Eroare la trimiterea cererii: ", error);
      alert("Eroare la trimiterea cererii!");
    });
  };

  return (
    <div>
      <NavBar />
      <div className="containerFormular">
        <h1>Formular Cerere Cazare</h1>

        {/* Selecție cămine, etaje și camere */}
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
                        Etaj {etaj}
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

        {/* Selecție colegi */}
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
                {utilizatori.map((user) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button className="submit-btn" onClick={handleSubmit}>
          Trimite cererea
        </button>
      </div>
    </div>
  );
}

export default CerereCazare;
