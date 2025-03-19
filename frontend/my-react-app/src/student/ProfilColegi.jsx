import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import NavBar from "../components/NavBar";
import "../styles/ProfilColegi.css"

function ProfilColegi() {
  const { nume } = useParams();
  const [coleg, setColeg] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(null);
  const [error, setError] = useState(null);

  const [descriere, setDescriere] = useState("");
  const [sporturi, setSporturi] = useState("");
  const [hobby, setHobby] = useState("");


  useEffect(() => {
    console.log("Se încarcă profilul colegului:", nume);
    
    axios.get(`http://localhost:4000/profil-coleg/${encodeURIComponent(nume)}`, { withCredentials: true })
      .then(response => {
        if (response.data) {
          setColeg(response.data);
          setDescriere(response.data.descriere || "Nespecificat");
          setSporturi(response.data.sporturi_preferate || "Nespecificat");
          setHobby(response.data.hobby_uri || "Nespecificat");
        }
      })
      .catch(error => {
        console.error("Eroare la preluarea profilului colegului:", error);
        setError("Profilul colegului nu a fost găsit.");
      });

    axios.get(`http://localhost:4000/camera-coleg/${encodeURIComponent(nume)}`, { withCredentials: true })
      .then(response => {
        setCameraInfo(response.data);
      })
      .catch(error => {
        console.error("Eroare la preluarea detaliilor camerei colegului:", error);
      });

  }, [nume]);

  if (error) return <p className="text-danger">{error}</p>;
  if (!coleg) return <p>Se încarcă datele colegului...</p>;

  return (
<div className="d-flex">
  <NavBar />
  <div className="container-fluid mt-2" style={{ marginLeft: "280px" }}>
    <div className="row justify-content-center">
      {/* Coloană stângă: Card Profil + Card Despre mine */}
      <div className="col-md-6 px-2 d-flex flex-column">
        {/* Card Profil */}
        <div className="card p-4 shadow h-100 border-2 border-dark rounded card-info">
          <div className="row align-items-center">
            <div className="col-md-4 text-center">
              <img
                src={coleg.poza_profil ? `http://localhost:4000${coleg.poza_profil}` : "/assets/poza_def.jpg"}
                alt="Profil"
                className="rounded-circle img-fluid mb-3"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
            </div>
            <div className="col-md-8">
              <h3>{coleg.prenume} {coleg.nume}</h3>
              <p><strong>Email:</strong> {coleg.email || "Necunoscut"}</p>
              <p><strong>Facultate:</strong> {coleg.facultate || "Nespecificat"}</p>
              <p><strong>Specializare:</strong> {coleg.specializare || "Nespecificat"}</p>
              <p><strong>Grupa:</strong> {coleg.grupa || "Nespecificat"}</p>
              <p><strong>Telefon:</strong> {coleg.telefon || "Nespecificat"}</p>
            </div>
          </div>
        </div>

        {/* Card Despre mine - Sub Card Profil */}
        <div className="card p-4 shadow border-2 border-dark rounded mt-3 card-about">
          <h4>📖 Despre {coleg.prenume}</h4>
          <p><strong>Descriere:</strong> {descriere || "Nespecificat"}</p>
          <p><strong>Sporturi preferate:</strong> {sporturi || "Nespecificat"}</p>
          <p><strong>Hobby-uri:</strong> {hobby || "Nespecificat"}</p>
        </div>
      </div>

      {/* Coloană dreaptă: Card Detalii Cameră */}
      {cameraInfo && (
        <div className="col-md-6 px-2">
          <div className="card p-4 shadow border-2 border-dark rounded card-camera card-camera">
            <h4>📌 Detalii Cameră</h4>
            <p><strong>Cămin:</strong> {cameraInfo.camin || "Nespecificat"}</p>
            <p><strong>Număr cameră:</strong> {cameraInfo.numar_camera || "Nespecificat"}</p>
            <h5>👥 Colegi de Cameră</h5>
            {cameraInfo?.colegi?.length > 0 ? (
              <ul className="list-group">
                {cameraInfo.colegi.map((coleg, index) => (
                  <li key={index} className="list-group-item">
                    <Link to={`/profil-coleg/${encodeURIComponent(coleg.nume)}`} className="text-decoration-none">
                      <strong>{coleg.prenume} {coleg.nume}</strong>
                    </Link> - {coleg.email} |
                    🎓 <em>{coleg.facultate && coleg.facultate.trim() !== "" ? coleg.facultate : "Facultate nespecificată"}</em> |
                    🏫 <em>{coleg.specializare && coleg.specializare.trim() !== "" ? coleg.specializare : "Specializare nespecificată"}</em> |
                    📌 <em>{coleg.grupa && coleg.grupa.trim() !== "" ? coleg.grupa : "Grupă nespecificată"}</em>
                  </li>
                ))}
              </ul>
            ) : <p>Niciun coleg înregistrat.</p>}
          </div>
        </div>
      )}
    </div>
  </div>
</div>
  );
}

export default ProfilColegi;
