import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import NavBar from "../components/NavBar";
import "../styles/ProfilStudent.css";

function ProfilStudent() {
  const { nume } = useParams();
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [telefon, setTelefon] = useState("");
  const [cameraInfo, setCameraInfo] = useState(null);

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [descriere, setDescriere] = useState("");
  const [sporturi, setSporturi] = useState("");
  const [hobby, setHobby] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success"); // sau "danger"


  const MAX_WORDS = 50;
  const [wordsLeft, setWordsLeft] = useState(MAX_WORDS);

  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(response => {
        if (response.data.isAuthenticated) {
          setUser(response.data);
          setTelefon(response.data.telefon || "");
          setDescriere(response.data.descriere || "");
          setSporturi(response.data.sporturi_preferate || "");
          setHobby(response.data.hobby_uri || "");
        }
      })
      .catch(error => console.error("Eroare la preluarea datelor:", error));

      axios.get("http://localhost:4000/camera-me", { withCredentials: true })
      .then(response => {
        setCameraInfo(response.data);
      })
      .catch(error => console.error("Eroare la preluarea datelor:", error));
  }, []);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("pozaProfil", selectedFile);

    try {
      const response = await axios.post("http://localhost:4000/upload-profile-pic", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        console.log("✅ Poza încărcată:", response.data.imageUrl);
        setUser(prevUser => ({
          ...prevUser,
          poza_profil: response.data.imageUrl
        }));

        window.dispatchEvent(new Event("profilePictureUpdated"));
      }
    } catch (error) {
      console.error("Eroare la încărcarea imaginii:", error);
    } finally {
      setLoading(false);
    }
  };

  const showCustomToast = (message, type = "success") => {
    setToastMsg(message);
    setToastType(type);
    setShowToast(true);
  
    setTimeout(() => setShowToast(false), 3000); // se închide automat
  };

  const handleSave = async () => {
    try {
      const response = await axios.post("http://localhost:4000/upload-profile-pic", {
        telefon,
      }, { withCredentials: true });

      if (response.data.success) {
        showCustomToast("Profil actualizat!", "success");
        setUser(prevUser => ({ ...prevUser, telefon }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Eroare la actualizarea profilului:", error);
    }
  };

  const limitWords = (text, maxWords) => {
    return text.split(/\s+/).slice(0, maxWords).join(" ");
};

const handleSaveDescriere = async () => {
    const descriereLimitata = limitWords(descriere, 50);

    const descriereFinala = descriere.trim() === "" ? "Nespecificat" : descriere;
    const sporturiFinale = sporturi.trim() === "" ? "Nespecificat" : sporturi;
    const hobbyFinale = hobby.trim() === "" ? "Nespecificat" : hobby;

    try {
        await axios.put("http://localhost:4000/profil/actualizare", 
            { descriere: descriereLimitata, sporturi_preferate: sporturi, hobby_uri: hobby }, 
            { withCredentials: true }
        );
        showCustomToast("Profil actualizat!", "success");
        setIsEditingAbout(false);
    } catch (error) {
        console.error("Eroare la actualizarea profilului:", error);
    }
};

const countWords = (text) => {
  return text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
};

const handleDescriereChange = (e) => {
  const inputText = e.target.value;
  const wordCount = countWords(inputText);
  
  if (wordCount <= MAX_WORDS) {
      setDescriere(inputText);
      setWordsLeft(MAX_WORDS - wordCount);
  }
};


  return (
    <div className="d-flex">
      <NavBar />
      <div className="container-fluid mt-2" style={{ marginLeft: "280px" }}>
        <div className="row d-flex justify-content-center">
          {/* Coloană stângă: Card Profil + Card Despre mine */}
          <div className="col-md-6 px-2">
            {/* Card Profil */}
            <div className="card p-4 shadow border-2 border-dark rounded card-profil">
              <div className="row align-items-center">
                <div className="col-md-4 text-center">
                  <img
                    src={user?.poza_profil ? `http://localhost:4000${user.poza_profil}?t=${Date.now()}` : "/assets/poza_def.jpg"}
                    alt="Profil"
                    className="rounded-circle img-fluid mb-3"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                  />
                  {isEditing && (
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      className="form-control mt-2"
                    />
                  )}
                </div>
                <div className="col-md-8">
                  <h3>{user?.prenume} {user?.nume}</h3>
                  <p><strong>Email:</strong> {user?.email || "Necunoscut"}</p>
                  <p><strong>Facultate:</strong> {user?.facultate || "Nespecificat"}</p>
                  <p><strong>Specializare:</strong> {user?.specializare || "Nespecificat"}</p>
                  <p><strong>Grupa:</strong> {user?.grupa || "Nespecificat"}</p>
                  <p><strong>Telefon:</strong> 
                    {isEditing ? (
                      <input 
                        type="text" 
                        className="form-control d-inline w-50 ms-2" 
                        value={telefon} 
                        onChange={(e) => setTelefon(e.target.value)}
                      />
                    ) : (
                      ` ${user?.telefon || "Nespecificat"}`
                    )}
                  </p>
                  <button 
                    onClick={isEditing ? handleSave : () => setIsEditing(true)} 
                    className={`btn ${isEditing ? "btn-success" : "btn-warning"} mt-3`}
                  >
                    {isEditing ? "Salvează Modificările" : "Editează Profil"}
                  </button>
                </div>
              </div>
            </div>
                  
            {/* Card Despre mine - Sub Card Profil */}
            <div className="card p-4 shadow  border-2 border-dark rounded mt-3 card-about">
              <h4>📖 Despre mine</h4>
                  
              {isEditingAbout ? (
                <>
                  <textarea 
                    className="form-control mb-2" 
                    value={descriere} 
                    onChange={handleDescriereChange} 
                    placeholder="Scrie o scurtă descriere..."
                  />
                  <small className={`text-${wordsLeft <= 5 ? "danger" : "muted"}`}>
                    {wordsLeft} cuvinte rămase
                  </small>
                  <input className="form-control mt-2" value={sporturi} onChange={(e) => setSporturi(e.target.value)} placeholder="Sporturi preferate"/>
                  <input className="form-control mt-2" value={hobby} onChange={(e) => setHobby(e.target.value)} placeholder="Hobby-uri"/>
              
                  <button onClick={handleSaveDescriere} className="btn btn-success mt-2 me-2">Salvează</button>
                  <button onClick={() => setIsEditingAbout(false)} className="btn btn-secondary mt-2">Anulează</button>
                </>
              ) : (
                <>
                  <p><strong>Descriere:</strong> {descriere || "Nespecificat"}</p>
                  <p><strong>Sporturi preferate:</strong> {sporturi || "Nespecificat"}</p>
                  <p><strong>Hobby-uri:</strong> {hobby || "Nespecificat"}</p>
              
                  <button onClick={() => setIsEditingAbout(true)} className="btn btn-warning mt-2">Editează</button>
                </>
              )}
            </div>
          </div>
            
          {/* Coloană dreaptă: Card Detalii Cameră */}
          {cameraInfo && (
            <div className="col-md-6 px-2">
              <div className="card p-4 shadow border-2 border-dark rounded card-camera">
                <h4>📌 Detalii Cameră</h4>
                <p><strong>Cămin:</strong> {cameraInfo.camin || "Nespecificat"}</p>
                <p><strong>Număr cameră:</strong> {cameraInfo.numar_camera || "Nespecificat"}</p>
                <h5>👥 Colegi de Cameră</h5>
                {cameraInfo?.colegi?.length > 0 ? (
                  <ul className="list-group">
                    {cameraInfo.colegi.map((coleg, index) => (
                      <li key={index} className="list-group-item">
                        <Link to={`/vizualizare-profil/${encodeURIComponent(coleg.nume)}`} className="text-decoration-none">
                          <strong>{coleg.prenume} {coleg.nume}</strong>
                        </Link> - {coleg.email}
                        🎓 <em>{coleg.facultate && coleg.facultate.trim() !== "" ? coleg.facultate : "Facultate nespecificată"}</em> |
                        🏫 <em>{coleg.specializare && coleg.specializare.trim() !== "" ? coleg.specializare : "Specializare nespecificată"}</em> |
                        📌 <em>{coleg.grupa && coleg.grupa.trim() !== "" ? coleg.grupa : "Grupă nespecificată"}</em>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Niciun coleg înregistrat.</p>
                )}
              </div>
            </div>
          )}
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
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setShowToast(false)}
            ></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}
    </div>
  );
}

export default ProfilStudent;
