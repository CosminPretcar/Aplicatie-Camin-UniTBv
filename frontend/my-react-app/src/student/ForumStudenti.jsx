import React, { useState } from "react";
import axios from "axios";

const FormularAnuntStudent = ({onClose, onAnuntCreat}) => {
  const [titlu, setTitlu] = useState("");
  const [categorie, setCategorie] = useState("");
  const [descriere, setDescriere] = useState("");
  const [imagine, setImagine] = useState(null);
  const [dataExpirare, setDataExpirare] = useState("");
  const [afiseazaContact, setAfiseazaContact] = useState(true);
  const [mesaj, setMesaj] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentTitle, setLastSentTitle] = useState(null);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (titlu.trim().length < 5 || descriere.trim().length < 10) {
      setMesaj(<span className="text-danger">Titlul sau descrierea este prea scurtă.</span>);
      return;
    }
  
    // Verificare dacă anunțul a fost deja trimis
    if (titlu === lastSentTitle) {
      setMesaj("Acest anunț a fost deja trimis.");
      return;
    }
  
    setIsLoading(true);
  
    const formData = new FormData();
    formData.append("titlu", titlu);
    formData.append("categorie", categorie);
    formData.append("descriere", descriere);
    formData.append("dataExpirare", dataExpirare);
    formData.append("afiseazaContact", afiseazaContact);
    if (imagine) {
      formData.append("imagine", imagine);
    }
  
    try {
      const response = await axios.post("http://localhost:4000/forum-studenti", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      if (response.status === 201) {
        const anuntNou = response.data.anunt || {
          ...formData,
          imagine: imagine?.name || null,
          data_postare: new Date().toISOString(),
        };
  
        // Setează titlul ultimului anunț trimis
        setLastSentTitle(titlu);
  
        if (onAnuntCreat) onAnuntCreat(anuntNou);
        setMesaj("Anunț trimis cu succes!");
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
      setTitlu("");
      setCategorie("");
      setDescriere("");
      setImagine(null);
      setDataExpirare("");
      setAfiseazaContact(true);
    } catch (error) {
      console.error(error);
      setMesaj("Eroare la trimiterea anunțului.");
    } finally {
      setIsLoading(false);
    }
  };

  const dataMax = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const dataMaximăFormatată = dataMax.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="container mt-4">
      {mesaj && <div className="alert alert-info mt-2">{mesaj}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label className="form-label">Titlu</label>
          <input
            type="text"
            className="form-control"
            value={titlu}
            onChange={(e) => setTitlu(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Descriere</label>
          <textarea
            className="form-control"
            rows="4"
            value={descriere}
            onChange={(e) => setDescriere(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="mb-3">
          <label className="form-label">Imagine (opțional)</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => setImagine(e.target.files[0])}
          />
          {imagine && (
            <div className="mb-3">
              <p className="text-muted">Previzualizare imagine:</p>
              <img
                src={URL.createObjectURL(imagine)}
                alt="preview"
                className="img-fluid rounded border"
                style={{ maxHeight: "200px" }}
              />
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Valabil până la:</label>
          <input
            type="date"
            className="form-control"
            value={dataExpirare}
            onChange={(e) => setDataExpirare(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            max={new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
            required
          />
          <small className="text-muted">
            Poți alege o dată între azi și {dataMaximăFormatată}
          </small>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Se trimite..." : "Trimite anunțul"}
        </button>
      </form>
    </div>
  );
};

export default FormularAnuntStudent;
