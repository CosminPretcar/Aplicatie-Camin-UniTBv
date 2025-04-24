import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { Container, Form, Button, Row, Col, Card, Table, Spinner, Modal } from "react-bootstrap";

function RaporteazaProblema() {
  const [titlu, setTitlu] = useState("");
  const [descriere, setDescriere] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [eroare, setEroare] = useState("");
  const [probleme, setProbleme] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagini, setImagini] = useState([]);
  const [previewImagini, setPreviewImagini] = useState([]);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imgPreviewList, setImgPreviewList] = useState([]);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sesizareDeSters, setSesizareDeSters] = useState(null);

  const formRef = useRef(null);


  const openPreview = (lista, index) => {
    setImgPreviewList(lista);
    setCurrentImgIndex(index);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMesaj("");
    setEroare("");

    if (!titlu || !descriere) {
      setEroare("Te rugăm să completezi toate câmpurile.");
      return;
    }

    const formData = new FormData();
    formData.append("titlu", titlu);
    formData.append("descriere", descriere);
    imagini.forEach((img) => formData.append("imagini", img));

    try {
      if (editId) {
        await axios.put(`http://localhost:4000/sesizari/${editId}`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMesaj("Sesizarea a fost actualizată.");
      } else {
        await axios.post("http://localhost:4000/sesizari", formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMesaj("Sesizarea a fost trimisă cu succes!");
      }
    
      setTitlu("");
      setDescriere("");
      setImagini([]);
      setPreviewImagini([]);
      setEditId(null);
      getProblemeUser(); // refacem lista după submit
    } catch (error) {
      console.error("Eroare la trimiterea sesizării:", error);
      setEroare("A apărut o problemă. Încearcă din nou.");
    }
    
  };

  const handleConfirmStergere = (id) => {
    setSesizareDeSters(id);
    setShowConfirmModal(true);
  };
  
  const handleEdit = (sesizare) => {
    setTitlu(sesizare.titlu);
    setDescriere(sesizare.descriere);
    setEditId(sesizare.id); // 👈 avem nevoie de un state nou
    setImagini([]);
    setPreviewImagini([]);
      // Scroll cu efect de smooth
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100); // delay mic pentru a asigura re-render
  };

  const getProblemeUser = async () => {
    try {
      const response = await axios.get("http://localhost:4000/sesizari-user", {
        withCredentials: true,
      });
      setProbleme(response.data);
    } catch (err) {
      console.error("Eroare la preluarea sesizărilor:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculeazaTimpScurs = (data) => {
    const secunde = Math.floor((new Date() - new Date(data)) / 1000);
    const minute = Math.floor(secunde / 60);
    const ore = Math.floor(minute / 60);
    const zile = Math.floor(ore / 24);
  
    if (zile > 0) return `în urmă cu ${zile} ${zile === 1 ? "zi" : "zile"}`;
    if (ore > 0) return `în urmă cu ${ore} ${ore === 1 ? "oră" : "ore"}`;
    if (minute > 0) return `în urmă cu ${minute} ${minute === 1 ? "minut" : "minute"}`;
    return "acum câteva secunde";
  };

  useEffect(() => {
    getProblemeUser();
  }, []);

  return (
    <div className="d-flex page-container">
      <NavBar />
      <div className="custom-container">
        <Row>
          <Col md={8}>
            <Card className="p-4 shadow-lg review-card border-2 border-dark rounded">
              <h2 className="mb-4 text-center">🚨 Raportează o problemă</h2>
              <Form ref={formRef} onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>📌 Titlul problemei</Form.Label>
                  <Form.Control
                    type="text"
                    value={titlu}
                    onChange={(e) => setTitlu(e.target.value)}
                    placeholder="Ex: Țeavă spartă în baie"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>📝 Descriere detaliată</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={descriere}
                    onChange={(e) => setDescriere(e.target.value)}
                    placeholder="Descrie problema cât mai detaliat..."
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>📎 Atașează imagine (opțional)</Form.Label>
                    <Form.Control
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setImagini(files);
                      
                        const previews = files.map(file => URL.createObjectURL(file));
                        setPreviewImagini(previews);
                      }}
                    />
                </Form.Group>
                {previewImagini.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2 justify-content-center">
                    {previewImagini.map((src, index) => (
                      <img key={index} src={src} alt={`preview-${index}`} width="100" />
                    ))}
                  </div>
                )}
                <br />
                <div className="text-center">
                  <Button variant="danger" type="submit" className="custom-button">
                    <i className="bi bi-exclamation-triangle"></i> Trimite sesizarea
                  </Button>
                </div>

                {mesaj && <p className="text-success text-center mt-3">{mesaj}</p>}
                {eroare && <p className="text-danger text-center mt-3">{eroare}</p>}
              </Form>
              
            </Card>
          </Col>

          <Col md={4}>
            <Card className="p-4 shadow-lg border-2 border-dark rounded rules-card">
              <h4 className="mb-3 text-center">ℹ️ Cum raportezi o problemă?</h4>
              <p className="text-muted text-center">
                🛠️ Dacă ai descoperit o defecțiune sau o situație neplăcută în cămin,
                poți folosi acest formular pentru a anunța administrația. <br />
                📍 Adaugă un titlu clar și o descriere cât mai detaliată.
              </p>

              <ul className="list-group small-text">
                <li className="list-group-item">🚿 Probleme la baie sau bucătărie</li>
                <li className="list-group-item">💡 Iluminat nefuncțional</li>
                <li className="list-group-item">📶 Internet inexistent</li>
                <li className="list-group-item">🔧 Defecțiuni la mobilier</li>
                <li className="list-group-item"> Probleme cu colegii de camin</li>
                <li className="list-group-item"> Alte probleme</li>
              </ul>

              <p className="text-muted text-center mt-3">
                📨 Administrația va primi sesizarea și va încerca să intervină cât mai repede.
              </p>
            </Card>
          </Col>
        </Row>
        <Row className="mt-4">
            <Col md={12}>
              <Card className="p-4 shadow-lg border-2 border-dark rounded">
                <h4 className="mb-3 text-center">📄 Problemele tale raportate</h4>
                {loading ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : probleme.length === 0 ? (
                  <p className="text-center text-muted">Nu ai raportat nicio problemă.</p>
                ) : (
                  <Table striped bordered hover responsive className="align-middle text-center">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Titlu</th>
                        <th>Descriere</th>
                        <th>Imagini</th>
                        <th>Status</th>
                        <th>Trimis la</th>
                        <th>Timp scurs</th>
                        <th>Ultima actualizare</th>
                        <th>Actiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {probleme.map((p, idx) => (
                        <tr key={p.id}>
                          <td>{idx + 1}</td>
                          <td className="text-start">{p.titlu}</td>
                          <td className="text-start">{p.descriere}</td>
                          <td>
                            {p.imagine ? (
                              p.imagine.split(",").map((src, index) => {
                                const lista = p.imagine.split(",");
                                return (
                                  <img
                                    key={index}
                                    src={`http://localhost:4000${src}`}
                                    alt={`sesizare-${index}`}
                                    width="60"
                                    className="me-1 mb-1 rounded border"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => openPreview(lista, index)}
                                  />
                                );
                              })
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>

                          <td>
                            {p.status === "rezolvata" && (
                              <span className="badge bg-success">Rezolvată</span>
                            )}
                            {p.status === "in_lucru" && (
                              <span className="badge bg-info text-dark">În lucru</span>
                            )}
                            {p.status === "neprocesata" && (
                              <span className="badge bg-warning text-dark">Neprocesată</span>
                            )}
                          </td>
                          <td>{new Date(p.data_trimitere).toLocaleString("ro-RO", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })}</td>
                          <td>{calculeazaTimpScurs(p.data_trimitere)}</td>
                          <td>{p.data_update ? new Date(p.data_update).toLocaleString("ro-RO", {
                            dateStyle: "short",
                            timeStyle: "short"
                          }) : "—"}</td>
                          <td>
                            {p.status === "neprocesata" ? (
                              <>
                                <Button variant="outline-primary" size="sm" onClick={() => handleEdit(p)}>
                                  ✏️
                                </Button>{" "}
                                <Button variant="outline-danger" size="sm" onClick={() => handleConfirmStergere(p.id)}>
                                  🗑️
                                </Button>
                              </>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Col>
        </Row>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Imagine {currentImgIndex + 1} din {imgPreviewList.length}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={`http://localhost:4000${imgPreviewList[currentImgIndex]}`}
            alt="previzualizare"
            style={{ maxWidth: "100%", maxHeight: "70vh" }}
            className="rounded shadow"
          />
          <div className="d-flex justify-content-between mt-3">
            <Button
              variant="secondary"
              onClick={() => setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : prev))}
              disabled={currentImgIndex === 0}
            >
              ◀️ Anterior
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setCurrentImgIndex((prev) =>
                  prev < imgPreviewList.length - 1 ? prev + 1 : prev
                )
              }
              disabled={currentImgIndex === imgPreviewList.length - 1}
            >
              Următoare ▶️
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmare ștergere</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Ești sigur(ă) că vrei să ștergi această sesizare? Această acțiune este permanentă.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Anulează
          </Button>
          <Button variant="danger" onClick={async () => {
            try {
              await axios.delete(`http://localhost:4000/sesizari/${sesizareDeSters}`, {
                withCredentials: true,
              });
              setMesaj("Sesizarea a fost ștearsă.");
              getProblemeUser();
            } catch (err) {
              console.error("Eroare la ștergere:", err);
              setEroare("Nu s-a putut șterge sesizarea.");
            } finally {
              setShowConfirmModal(false);
            }
          }}>
            Confirmă ștergerea
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default RaporteazaProblema;
