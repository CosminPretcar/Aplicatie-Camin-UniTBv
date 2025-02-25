import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import "../styles/CerereCazare.css";

function CerereCazare() {
  const [camine, setCamine] = useState([]);
  const [camere, setCamere] = useState([]);
  const [utilizatori, setUtilizatori] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCamin, setSelectedCamin] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedColegi, setSelectedColegi] = useState([]);
  const [selectedEtaj, setSelectedEtaj] = useState("");
  const etajeUnice = [...new Set(camere.map(camera => camera.etaj))];

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

  const handleColegSelect = (userId) => {
    const cameraSelectata = camere.find((camera) => camera.id === parseInt(selectedCamera,10));
    if(!cameraSelectata) return;

    const maxPaturi=cameraSelectata.numar_paturi;
    const numarPersoane = selectedColegi.length + 1;

    setSelectedColegi((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter((id) => id !== userId); 
      } else if(numarPersoane < maxPaturi) {
        setTimeout(() => setSearchTerm(""), 150);
        return [...prevSelected, userId]; 
      } else {
        alert(`Nu poți selecta mai mulți colegi decât numărul de paturi disponibile (${maxPaturi}).`);
        return prevSelected;
      }
    });
    
  };

  const handleSubmit = () => {
    const cameraSelectata = camere.find((camera) => camera.id === parseInt(selectedCamera, 10));

    if (!selectedCamera) {
      alert("Selectați o cameră!");
      return;
    }

    alert(`Cererea de cazare:
      Cămin ID: ${selectedCamin}
      Etaj: ${cameraSelectata.etaj}
      Camera ID: ${cameraSelectata.id}
      Coleg(i): ${selectedColegi.join(", ")}`);

    axios.post("http://localhost:4000/cereri", {
        caminId: selectedCamin,
        etaj: cameraSelectata.etaj,
        cameraId: cameraSelectata.id,
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
              <label>Etaj:</label>
              <select value={selectedEtaj} onChange={(e) => setSelectedEtaj(e.target.value)}>
                <option value="">Selectează un etaj</option>
                {etajeUnice.map((etaj) => (
                  <option key={etaj} value={etaj}>
                    Etaj {etaj}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Camera:</label>
              <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
                <option value="">Selectează o cameră</option>
                {camere
                  .filter((camera) => selectedEtaj === "" || camera.etaj.toString() === selectedEtaj)
                  .map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      Camera {camera.numar_camera} - {camera.numar_paturi} paturi
                    </option>
                  ))}
              </select>
            </div>
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
                    .sort((a, b) => (selectedColegi.includes(a.id) ? -1 : 1))
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
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="butonFormular">
                <button className="submit-btn" onClick={handleSubmit}>
                  Trimite cererea
                </button>
              </div>
            </div>
        </div>
    </div> 
  );
}

export default CerereCazare;
