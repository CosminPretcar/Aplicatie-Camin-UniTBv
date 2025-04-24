import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBarAdmin from "../components/NavBarAdmin";
import { Table, Form, Card, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";

function CamereCaminAdmin() {
    const [camere, setCamere] = useState([]);
    const [etaje, setEtaje] = useState([]);
    const [etajSelectat, setEtajSelectat] = useState("");

    useEffect(() => {
        const fetchCamere = async () => {
            try {
                const response = await axios.get("http://localhost:4000/camine/camere-cu-studenti", {
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
    }, []);

    const camereFiltrate = etajSelectat === ""
    ? []
    : camere.filter((c) => c.etaj === parseInt(etajSelectat));

        const renderStudent = (nume) => {
            if (!nume) return "-";
            const prenumeUrl = encodeURIComponent(nume.split(" ")[0]);
            return (
                <Link to={`/vizualizare-profil/${prenumeUrl}`} className="text-decoration-none">
                    {nume}
                </Link>
            );
        };

    const getRowColorClass = (camera) => {
        const studenti = [camera.student1, camera.student2, camera.student3, camera.student4];
        const nrOcupate = studenti.filter(Boolean).length;
      
        if (nrOcupate === 0) return "table-success"; // verde
        if (nrOcupate < 4) return "table-warning"; // galben
        return "table-danger"; // roșu
      };
          

    return (
        <div className="d-flex page-container">
            <NavBarAdmin />
            <div className="custom-container">
                <h3 className="mb-4">🏠 Camerele Căminului Administrat</h3>

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
                    <div className="mt-2">
                      <Badge bg="success" className="me-2">Cameră liberă</Badge>
                      <Badge bg="warning" className="me-2 text-dark">Locuri disponibile</Badge>
                      <Badge bg="danger">Cameră ocupată</Badge>
                    </div>
                </Card>

                <Card className="p-3 shadow-lg border-2 border-dark">
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Nr. Cameră</th>
                                <th>Student 1</th>
                                <th>Student 2</th>
                                <th>Student 3</th>
                                <th>Student 4</th>
                            </tr>
                        </thead>
                        <tbody>
                            {camereFiltrate.map((camera) => (
                                <tr key={camera.id} className={getRowColorClass(camera)}>
                                    <td>{camera.numar_camera}</td>
                                    <td>{renderStudent(camera.student1)}</td>
                                    <td>{renderStudent(camera.student2)}</td>
                                    <td>{renderStudent(camera.student3)}</td>
                                    <td>{renderStudent(camera.student4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {camereFiltrate.length === 0 && (
                        <p className="text-muted text-center mt-3">Nu există camere pentru etajul selectat.</p>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default CamereCaminAdmin;
