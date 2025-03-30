import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ro";
import { Container, Row, Col, Form, Card, Button, Modal, Toast, Table, Alert } from "react-bootstrap";
import NavBar from "../components/NavBar";
import "../styles/ProgramariResurse.css"

dayjs.locale("ro");
dayjs.extend(utc);

function ProgramareResurse() {
  const [tipResursa, setTipResursa] = useState("masina_spalat");
  const [resurse, setResurse] = useState([]);
  const [idResursa, setIdResursa] = useState("");
  const [programari, setProgramari] = useState([]);
  const [programarileMele, setProgramarileMele] = useState([]);
  const [slotSelectat, setSlotSelectat] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [eroare, setEroare] = useState("");
  

  const zile = [...Array(5)].map((_, i) => dayjs().add(i, "day"));

  const generareOre = () => {
    const oreGenerate = [];
  
    if (tipResursa === "masina_spalat") {
      for (let h = 8; h <= 22; h += 2) {
        oreGenerate.push(`${h.toString().padStart(2, "0")}:00`);
      }
    } else {
      // Sala de lectură – sloturi orare (cu excepția 08:00)
      for (let h = 9; h <= 23; h++) {
        oreGenerate.push(`${h.toString().padStart(2, "0")}:00`);
      }
    }
  
    return oreGenerate;
  };
  
  const ore = generareOre();

  const incarcareResurse = async () => {
    const res = await axios.get(`http://localhost:4000/resurse?tip=${tipResursa}`, {
      withCredentials: true,
    });
    setResurse(res.data);
    setIdResursa("");
  };

  const incarcareProgramari = async () => {
    if (!idResursa) return;

    const start = dayjs().format("YYYY-MM-DD");
    const end = dayjs().add(5, "day").format("YYYY-MM-DD");

    const res = await axios.get(
      `http://localhost:4000/programari?start=${start}&end=${end}&id_resursa=${parseInt(idResursa,10)}`,
      { withCredentials: true }
    );
    setProgramari(res.data);

    const me = await axios.get(
      `http://localhost:4000/programari/me?start=${start}&end=${end}&id_resursa=${idResursa}`,
      { withCredentials: true }
    );
    setProgramarileMele(me.data);
  };

  const incarcaProgramariResursaSelectata = async () => {
    if (!idResursa) return;
  
    const start = dayjs().format("YYYY-MM-DD");
    const end = dayjs().add(5, "day").format("YYYY-MM-DD");
  
    const res = await axios.get(
      `http://localhost:4000/programari?start=${start}&end=${end}&id_resursa=${parseInt(idResursa,10)}`,
      { withCredentials: true }
    );
    setProgramari(res.data);
  };

  const incarcaProgramarileMele = async () => {
    const start = dayjs().format("YYYY-MM-DD");
    const end = dayjs().add(5, "day").format("YYYY-MM-DD");
  
    const me = await axios.get(
      `http://localhost:4000/programari/me?start=${start}&end=${end}`,
      { withCredentials: true }
    );
    setProgramarileMele(me.data);
  };

  useEffect(() => {
    incarcareResurse();
  }, [tipResursa]);
  
  useEffect(() => {
    incarcaProgramariResursaSelectata();
  }, [idResursa]);
  
  // încarcă programările proprii mereu
  useEffect(() => {
    incarcaProgramariResursaSelectata(); 
    incarcaProgramarileMele();           
  }, [idResursa]);

  const slotOcupat = (zi, ora) =>
    programari.some((p) => {
      const ziDB = dayjs.utc(p.data).local().format("YYYY-MM-DD");
  
      const oraStart = typeof p.ora_start === "string"
        ? p.ora_start.slice(0, 5)
        : dayjs(`2000-01-01T${p.ora_start}`).format("HH:mm");
  
      return ziDB === zi.format("YYYY-MM-DD") && oraStart === ora;
    });

    useEffect(() => {
      if (programari.length > 0) {
        console.log("🧩 Programări din backend:", programari);
      }
    }, [programari]);

    const slotExpirat = (zi, ora) => {
      const acum = dayjs();
      const slot = dayjs(`${zi.format("YYYY-MM-DD")}T${ora}`);
    
      // curățenie la 08:00 pentru sala de lectură
      if (tipResursa === "sala_lectura" && ora === "08:00") return true;
    
      return zi.isSame(acum, "day") && slot.isBefore(acum);
    };

    const eSlotulMeu = (zi, ora) =>
      programarileMele.some((p) => {
        const ziMea = dayjs.utc(p.data).local().format("YYYY-MM-DD");
        const oraMea = p.ora_start.slice(0, 5);
        return ziMea === zi.format("YYYY-MM-DD") && oraMea === ora;
      });
    
    

  const handleClickSlot = (zi, ora) => {
    if (slotOcupat(zi, ora) || slotExpirat(zi, ora)) return;
    setSlotSelectat({ zi, ora });
    setShowModal(true);
  };

  const confirmaProgramare = async () => {
    setEroare("");
    try {
      await axios.post(
        "http://localhost:4000/programari",
        {
          id_resursa: idResursa,
          data: slotSelectat.zi.format("YYYY-MM-DD"),
          ora_start: slotSelectat.ora,
          durata_minute: tipResursa === "masina_spalat" ? 90 : 60,
        },
        { withCredentials: true }
      );
      setShowModal(false);
      setShowToast(true);
      setSlotSelectat(null);
      await incarcaProgramariResursaSelectata();
      await incarcaProgramarileMele();

    } catch (err) {
      setEroare(err.response?.data?.message || "Eroare la programare.");
    }
  };

  const handleAnulare = async (id) => {
    if (!window.confirm("Ești sigur că vrei să ștergi această programare?")) return;
    await axios.delete(`http://localhost:4000/programari/${id}`, {
      withCredentials: true,
    });
    await incarcaProgramariResursaSelectata();
    await incarcaProgramarileMele();
  };

  return (
    <div className="d-flex page-container">
      <NavBar />
      <Container fluid className="mt-4" style={{marginLeft:"280px"}}>
        <Row>
          <Col md={4}>
            <Card className="p-4 shadow border-2 border-dark rounded" style={{ height: "600px", overflowY: "auto" }}>
              <h5 className="text-center mb-3">🔧 Selectează resursa</h5>
              <Form.Group className="mb-3">
                <Form.Label>Tip resursă</Form.Label>
                <Form.Select value={tipResursa} onChange={(e) => setTipResursa(e.target.value)}>
                  <option value="masina_spalat">Mașină de spălat</option>
                  <option value="sala_lectura">Sală de lectură</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>{tipResursa === "masina_spalat" ? "Mașină" : "Sală"}</Form.Label>
                <Form.Select value={idResursa} onChange={(e) => setIdResursa(e.target.value)}>
                  <option value="">-- Alege --</option>
                  {resurse.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nume} – {r.locatie}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <hr />
              <h6 className="text-center">ℹ️ Informații despre programări</h6>

              {/* Legendă explicată */}
              <div className="d-flex flex-wrap gap-2 justify-content-center mt-2 mb-2">
                <span className="badge bg-success">🟢 Liber</span>
                <span className="badge bg-info">🔷 Programarea ta</span>
                <span className="badge bg-danger">🔴 Ocupat</span>
                <span className="badge bg-secondary">⏱ Expirat</span>
              </div>

              <ul className="small mt-2 mb-0 ps-3">
                <li><strong>🟢 Liber</strong> – slotul este disponibil și poate fi rezervat.</li>
                <li><strong>🔷 Programarea ta</strong> – ai deja rezervat acest slot.</li>
                <li><strong>🔴 Ocupat</strong> – slotul este deja rezervat de altcineva.</li>
                <li><strong>⏱ Expirat</strong> – ora este în trecut și nu mai poate fi rezervată.</li>
              </ul>

              <hr className="my-3" />

              {/* Alte reguli */}
              <ul className="small mb-0 ps-3">
                <li>O programare pentru <strong>mașina de spălat</strong> durează <strong>90 de minute</strong> (urmată de <strong>30 minute pauză</strong>).</li>
                <li>O programare pentru <strong>sala de lectură</strong> durează <strong>60 de minute</strong>.</li>
                <li>Slotul <strong>08:00–09:00</strong> este rezervat curățeniei în sălile de lectură și nu poate fi rezervat.</li>
                <li>Poți avea mai multe programări active, în funcție de disponibilitate.</li>
              </ul>
            </Card>
          </Col>

          <Col md={8}>
          {idResursa ? (
            <Card className="p-3 shadow border-2 border-dark rounded" style={{ maxHeight: "600px", overflowY: "auto" , minHeight: "600px"}}>
              <h5 className="text-center mb-3">📆 Calendar (5 zile)</h5>
              <div className="table-responsive">
                <Table bordered className="text-center">
                  <thead className="table-dark">
                    <tr>
                      <th>Ora</th>
                      {zile.map((zi, idx) => (
                        <th key={idx}>{zi.format("dddd, DD MMMM")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ore.map((ora) => (
                      <tr key={ora}>
                        <td className="fw-bold">{ora}</td>
                        {zile.map((zi, idx) => {
                          const ocupat = slotOcupat(zi, ora);
                          const expirat = slotExpirat(zi, ora);
                          const alMeu = eSlotulMeu(zi, ora);
                          return (
                            <td
                              key={idx}
                              className={`text-white fw-bold cursor-pointer ${
                                alMeu
                                  ? "bg-info"
                                  : ocupat
                                  ? "bg-danger"
                                  : expirat
                                  ? "bg-secondary"
                                  : "bg-success"
                              }`}
                              onClick={() => handleClickSlot(zi, ora)}
                              style={{ cursor: ocupat || expirat ? "not-allowed" : "pointer" }}
                            >
                              {alMeu
                                ? "Tu"
                                : ocupat
                                ? "Ocupat"
                                : expirat
                                ? "Expirat"
                                : "Liber"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {eroare && <Alert variant="danger" className="text-center">{eroare}</Alert>}
            </Card>
            ) : (
              <Card className="p-4 shadow border-2 border-dark rounded d-flex align-items-center justify-content-center" style={{ height: "100%" }}>
              <Alert variant="info" className="text-center mb-0">
                Selectează tipul de resursă și o resursă pentru a vizualiza calendarul.
              </Alert>
            </Card>
            )}
          </Col>
        </Row>

        <Row className="mt-4">
          <Col>
            <Card className="p-4 shadow border-2 border-dark rounded">
              <h5 className="text-center mb-3">📋 Programările mele (următoarele 5 zile)</h5>
              {programarileMele.length === 0 ? (
                <p className="text-muted text-center">Nu ai programări viitoare.</p>
              ) : (
                <Table striped bordered responsive>
                  <thead className="table-dark">
                    <tr>
                      <th>Ziua</th>
                      <th>Ora</th>
                      <th>Resursa</th>
                      <th>Acțiune</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programarileMele.map((p) => (
                      <tr key={p.id}>
                        <td>{dayjs(p.data).format("dddd, DD MMM")}</td>
                        <td>{p.ora_start.slice(0, 5)}</td>
                        <td>{p.nume_resursa}</td>
                        <td>
                          <Button variant="danger" size="sm" onClick={() => handleAnulare(p.id)}>
                            Șterge
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Col>
        </Row>

        {/* Modal confirmare */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirmare programare</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Vrei să te programezi pentru {slotSelectat?.zi.format("dddd, DD MMM")} la ora {slotSelectat?.ora}?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Anulează</Button>
            <Button variant="primary" onClick={confirmaProgramare}>Confirmă</Button>
          </Modal.Footer>
        </Modal>

        {/* Toast succes */}
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 9999
          }}
        >
          <Toast.Header>
            <strong className="me-auto">Succes</strong>
          </Toast.Header>
          <Toast.Body>Programarea a fost realizată cu succes!</Toast.Body>
        </Toast>
      </Container>
    </div>
  );
}

export default ProgramareResurse;
