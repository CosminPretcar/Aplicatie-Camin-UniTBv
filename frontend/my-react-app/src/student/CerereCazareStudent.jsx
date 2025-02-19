import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import "../styles/CerereCazare.css";

function CerereCazare() {
  const [camine, setCamine] = useState([]);
  const [camere, setCamere] = useState([]);
  const [utilizatori, setUtilizatori] = useState([]);

  const [selectedCamin, setSelectedCamin] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedColegi, setSelectedColegi] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:4000/camine").then((response) => {
      setCamine(response.data);
    });
  }, []);

  useEffect(() => {
    if (selectedCamin) {
      axios.get(`http://localhost:4000/camere/${selectedCamin}`).then((response) => {
        setCamere(response.data);
      });
    }
  }, [selectedCamin]);

  useEffect(() => {
    axios.get("http://localhost:4000/utilizatori", {withCredentials: true}).then((response) => {
      setUtilizatori(response.data);
    });
  }, []);

  const handleColegSelect = (userId) => {
    setSelectedColegi((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter((id) => id !== userId); // Deselectează
      } else {
        return [...prevSelected, userId]; // Selectează
      }
    });
  };

  const handleSubmit = () => {
    alert(`Cerință trimisă:
      Camin: ${selectedCamin}
      Camera: ${selectedCamera}
      Coleg: ${selectedColegi.join(", ")}
    `);
    axios.post("http://localhost:4000/cereri", {
      caminId: selectedCamin,
      cameraId: selectedCamera,
      colegi: selectedColegi,
    }, {withCredentials:true})
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
      <div className="container">
        <h1>Formular Cerere Cazare</h1>

        <div className="form-container">
          <div className="form-row">
            <div className="form-group">
              <label>Camin:</label>
              <select value={selectedCamin} onChange={(e) => setSelectedCamin(e.target.value)}>
                <option value="">Selectează un cămin</option>
                {camine.map((camin) => (
                  <option key={camin.id} value={camin.id}>
                    {camin.nume_camin}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Camera:</label>
            <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
              <option value="">Selectează o cameră</option>
              {camere.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  Camera {camera.numar_camera} - Etaj {camera.etaj} - {camera.numar_paturi} paturi
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Coleg(i) de cameră:</label>
            <table className="colegi-table">
              <thead>
                <tr>
                  <th>Selectează</th>
                  <th>Nume</th>
                  <th>Prenume</th>
                </tr>
              </thead>
              <tbody>
                {utilizatori.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedColegi.includes(user.id)}
                        onChange={() => handleColegSelect(user.id)}
                      />
                    </td>
                    <td>{user.nume}</td>
                    <td>{user.prenume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleSubmit}>Trimite cererea</button>
        </div>
      </div>
     </div> 
  );
}

export default CerereCazare;
