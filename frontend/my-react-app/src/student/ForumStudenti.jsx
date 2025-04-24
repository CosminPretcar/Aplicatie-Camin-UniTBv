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
  

  const handleSubmit = async (e) => {
    e.preventDefault();
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
            withCredentials: true, // dacă folosești cookie-uri
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
      
       // trimite anunțul nou către HomeStudent
       if (onAnuntCreat) onAnuntCreat(anuntNou);
      setMesaj("Anunț trimis cu succes!");
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1000); // închide modalul după 1 secundă
      }
    }
      // Resetare formular
      setTitlu("");
      setCategorie("");
      setDescriere("");
      setImagine(null);
      setDataExpirare("");
      setAfiseazaContact(true);
    } catch (error) {
      console.error(error);
      setMesaj("Eroare la trimiterea anunțului.");
    }
  };

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
        </div>
        <div className="mb-3">
          <label className="form-label">Valabil până la:</label>
          <input
            type="date"
            className="form-control"
            value={dataExpirare}
            onChange={(e) => setDataExpirare(e.target.value)}
            required
          />
          <p style={{color:"red"}}><small>Anunturile ce au o valabilitate mai mare de 15 zile vor fi sterse!</small></p>
        </div>
        <button type="submit" className="btn btn-primary">Trimite anunțul</button>
      </form>
    </div>
  );
};

export default FormularAnuntStudent;
