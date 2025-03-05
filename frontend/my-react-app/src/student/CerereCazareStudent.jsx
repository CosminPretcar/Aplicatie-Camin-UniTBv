import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/CerereCazare.css";

function CerereCazare() {
  const [camine, setCamine] = useState([]);
  const [camere, setCamere] = useState([]);
  const [utilizatori, setUtilizatori] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColegi, setSelectedColegi] = useState([]);

  const [optiuni, setOptiuni] = useState([
    { camin: "", etaj: "", camera: "" },
    { camin: "", etaj: "", camera: "" },
    { camin: "", etaj: "", camera: "" }
  ]);

  useEffect(() => {
    axios.get("http://localhost:4000/camine").then((response) => {
      setCamine(response.data);
    });
  }, []);

  useEffect(() => {
    if (optiuni.some((opt) => opt.camin)) {
      axios.get(`http://localhost:4000/camere/${optiuni[0].camin}`).then((response) => {
        setCamere(response.data);
      });
    }
  }, [optiuni]);

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

  const handleOptiuneChange = (index, field, value) => {
    setOptiuni((prevOptiuni) => {
      const updatedOptiuni = [...prevOptiuni];
      updatedOptiuni[index][field] = value;
      return updatedOptiuni;
    });
  };

  const handleColegSelect = (userId) => {
    setSelectedColegi((prevSelected) => 
      prevSelected.includes(userId) ? prevSelected.filter((id) => id !== userId) : [...prevSelected, userId]
    );
  };

  const handleSubmit = () => {
    if (optiuni.every(opt => opt.camin === "" || opt.camera === "")) {
      alert("Selectați cel puțin o cameră!");
      return;
    }

    axios.post("http://localhost:4000/cereri", {
      optiuniCazare: optiuni,
      colegi: selectedColegi
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
      <div className="container mt-3 bg-light rounded shadow">
        <h1 className="text-center">Formular Cerere Cazare</h1>

        <div className="row mt-4">
          {optiuni.map((opt, index) => (
            <div key={index} className="col-md-4">
              <div className="card text-white bg-dark">
                <div className="card-header">Optiunea {index + 1}</div>
                <div className="card-body">
                  
                  <div className="form-group">
                    <label className="form-label text-light">Cămin:</label>
                    <select 
                      className="form-select"
                      value={opt.camin} 
                      onChange={(e) => handleOptiuneChange(index, "camin", e.target.value)}
                    >
                      <option value="">Selectează un cămin</option>
                      {camine.map((camin) => (
                        <option key={camin.id} value={camin.id}>{camin.nume_camin}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mt-2">
                    <label className="form-label text-light">Etaj:</label>
                    <select 
                      className="form-select"
                      value={opt.etaj} 
                      onChange={(e) => handleOptiuneChange(index, "etaj", e.target.value)}
                    >
                      <option value="">Selectează un etaj</option>
                      {[...new Set(camere.map(camera => camera.etaj))].map((etaj) => (
                        <option key={etaj} value={etaj}>Etaj {etaj}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mt-2">
                    <label className="form-label text-light">Camera:</label>
                    <select 
                      className="form-select"
                      value={opt.camera} 
                      onChange={(e) => handleOptiuneChange(index, "camera", e.target.value)}
                    >
                      <option value="">Selectează o cameră</option>
                      {camere
                        .filter((camera) => opt.etaj === "" || camera.etaj.toString() === opt.etaj)
                        .map((camera) => (
                          <option key={camera.id} value={camera.id}>
                            Camera {camera.numar_camera} - {camera.numar_paturi} paturi
                          </option>
                        ))}
                    </select>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-group mt-4">
          <label>Coleg(i) de cameră:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Caută colegi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <table className="table mt-3">
            <thead className="table-light">
              <tr>
                <th></th>
                <th>Nume</th>
                <th>Prenume</th>
                <th>Facultate</th>
                <th>Specializare</th>
              </tr>
            </thead>
            <tbody>
              {[...utilizatori]
              .sort((a, b) => {
                const aSelected = selectedColegi.includes(a.id);
                const bSelected = selectedColegi.includes(b.id);
                return bSelected - aSelected; // Mută pe cei selectați în față
                })
                .map((user) => (
                <tr key={user.id} className={selectedColegi.includes(user.id) ? "table-success" : ""}>

                  <td>
                    <button
                      className={`btn ${selectedColegi.includes(user.id) ? "btn-danger" : "btn-success"}`}
                      onClick={() => handleColegSelect(user.id)}
                    >
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

        <div className="d-flex justify-content-end">
          <button className="btn btn-primary" onClick={handleSubmit}>Trimite cererea</button>
        </div>

      </div>
    </div>
  );
}

export default CerereCazare;
