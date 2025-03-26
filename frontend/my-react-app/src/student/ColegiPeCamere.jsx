import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Form, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import useUserInfo from "../hooks/useUserInfo";

function ColegiPeCamere() {
  const [camere, setCamere] = useState([]);
  const [etaje, setEtaje] = useState([]);
  const [etajSelectat, setEtajSelectat] = useState("");
  const user = useUserInfo();

  useEffect(() => {
    if (!user) return;

    const fetchCamere = async () => {
      try {
        const response = await axios.get("http://localhost:4000/studenti/camere", {
          withCredentials: true
        });

        const camere = response.data;
        setCamere(camere);

        const etajeUnice = Array.from(new Set(camere.map((c) => c.etaj))).sort((a, b) => a - b);
        setEtaje(etajeUnice);
      } catch (err) {
        console.error("Eroare la încărcarea camerelor:", err);
      }
    };

    fetchCamere();
  }, [user]);

  if (!user) return <p>Se încarcă datele utilizatorului...</p>;

  const camereFiltrate = etajSelectat === ""
    ? []
    : camere.filter((c) => c.etaj === parseInt(etajSelectat));

    const renderStudent = (numeComplet) => {
        if (!numeComplet) return "-";
      
        // Obține doar numele de familie
        const nume = numeComplet.split(" ")[0];
      
        return (
          <Link
            to={
              user.nume === nume
                ? `/profil-personal/${encodeURIComponent(nume)}`
                : `/vizualizare-profil/${encodeURIComponent(nume)}`
            }
            className="text-decoration-none"
          >
            {numeComplet}
          </Link>
        );
      };

  return (
    <div className="d-flex page-container">
      <NavBar />
      <div className="custom-container">
        <h3 className="mb-4">👥 Colegii pe camere</h3>

        <Card className="p-3 shadow-sm mb-3 border-2 border-dark">
          <Form.Group>
            <Form.Label>🔍 Filtrează după etaj</Form.Label>
            <Form.Select
              value={etajSelectat}
              onChange={(e) => setEtajSelectat(e.target.value)}
            >
              <option value="">Selectează etajul</option>
              {etaje.map((etaj) => (
                <option key={etaj} value={etaj}>
                  {etaj === 0 ? "Parter" : `Etaj ${etaj}`}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card>

        <Card className="p-3 shadow-lg border-2 border-dark">
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Etaj</th>
                <th>Nr. Cameră</th>
                <th>Student 1</th>
                <th>Student 2</th>
                <th>Student 3</th>
                <th>Student 4</th>
              </tr>
            </thead>
            <tbody>
              {etajSelectat === "" ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    Selectează un etaj pentru a putea vedea camerele.
                  </td>
                </tr>
              ) : camereFiltrate.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    Nu există camere pentru etajul selectat.
                  </td>
                </tr>
              ) : (
                camereFiltrate.map((camera) => (
                  <tr key={camera.id}>
                    <td>{camera.etaj === 0 ? "Parter" : camera.etaj}</td>
                    <td>{camera.numar_camera}</td>
                    <td>{renderStudent(camera.student1)}</td>
                    <td>{renderStudent(camera.student2)}</td>
                    <td>{renderStudent(camera.student3)}</td>
                    <td>{renderStudent(camera.student4)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

export default ColegiPeCamere;
