import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import NavBar from "../components/NavBar";

function ProfilStudent() {
  const { nume } = useParams();
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(response => {
        if (response.data.isAuthenticated) {
          setUser(response.data);
        }
      })
      .catch(error => console.error("Eroare la preluarea datelor:", error));
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("pozaProfil", file);

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
      }
    } catch (error) {
      console.error("Eroare la încărcarea imaginii:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex">
      <NavBar />
      <div className="container mt-2" style={{ marginLeft: "60px" }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card p-4 shadow">
              <div className="row align-items-center">
                <div className="col-md-4 text-center">
                  <img
                    src={user?.poza_profil ? `http://localhost:4000${user.poza_profil}` : "/assets/poza_def.jpg"}
                    alt="Profil"
                    className="rounded-circle img-fluid mb-3"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                  />
                  <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="btn btn-warning mt-2"
                  >
                    {isEditing ? "Anulează Editarea" : "Editează Profil"}
                  </button>
                  {isEditing && (
                    <div className="d-flex flex-column align-items-center mt-3">
                      <div className="d-flex gap-2">
                        <input type="file" onChange={handleFileChange} className="form-control" />
                        <button onClick={handleUpload} className="btn btn-primary" disabled={loading}>
                          {loading ? "Se încarcă..." : "Aplică Poza"}
                        </button>
                      </div>
                      <button onClick={() => setIsEditing(false)} className="btn btn-success mt-3">
                        Încheiere Editare
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-md-8">
                  <h3>{user?.prenume} {user?.nume}</h3>
                  <p><strong>Email:</strong> {user?.email || "Necunoscut"}</p>
                  <p><strong>Facultate:</strong> {user?.facultate || "Nespecificat"}</p>
                  <p><strong>Specializare:</strong> {user?.specializare || "Nespecificat"}</p>
                  <p><strong>Grupa:</strong> {user?.grupa || "Nespecificat"}</p>
                </div>
              </div>
            </div>
          </div> 
        </div> 
      </div> 
    </div>
  );
}

export default ProfilStudent;
