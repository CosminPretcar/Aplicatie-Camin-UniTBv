import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Card, Button, Spinner, Badge, Form, Modal } from "react-bootstrap";
import NavBarAdmin from "../components/NavBarAdmin";

function SesizariAdministrare() {
  const [sesizari, setSesizari] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [imgPreviewList, setImgPreviewList] = useState([]);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [subiectEmail, setSubiectEmail] = useState("");
  const [mesajEmail, setMesajEmail] = useState("");


  const [filtruStatus, setFiltruStatus] = useState("toate");
  
  const [paginaCurenta, setPaginaCurenta] = useState(1);
  const sesizariPerPagina = 5;
  const sesizariFiltrate = filtruStatus === "toate"
  ? sesizari
  : sesizari.filter(s => s.status === filtruStatus);
  const indexStart = (paginaCurenta - 1) * sesizariPerPagina;
  const indexEnd = indexStart + sesizariPerPagina;
  const sesizariDeAfisat = sesizariFiltrate.slice(indexStart, indexEnd);
  const totalPagini = Math.ceil(sesizariFiltrate.length / sesizariPerPagina);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const openPreview = (lista, index) => {
    setImgPreviewList(lista);
    setCurrentImgIndex(index);
    setShowModal(true);
  };
  
  const getSesizari = async () => {
    try {
      const response = await axios.get("http://localhost:4000/sesizari-admin", {
        withCredentials: true,
      });
      setSesizari(response.data);
    } catch (error) {
      console.error("Eroare la preluarea sesizărilor:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, nouStatus) => {
    try {
      await axios.put(
        `http://localhost:4000/sesizari-admin/${id}`,
        { status: nouStatus },
        { withCredentials: true }
      );
      getSesizari(); // Refresh
    } catch (err) {
      console.error("Eroare la actualizarea statusului:", err);
    }
  };

  const deschideEmailModal = (sesizare) => {
    setEmailTarget(sesizare); // conține studentul și id-ul sesizării
    setSubiectEmail("");
    setMesajEmail("");
    setShowEmailModal(true);
  };

  useEffect(() => {
    getSesizari();
  }, []);

  const exportSesizariToExcel = async () => {
    try {
      const response = await axios.get("http://localhost:4000/sesizari/export-excel", {
        responseType: "blob",
        withCredentials: true,
      });
  
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Sesizari_${new Date().toLocaleDateString("ro-RO").replace(/\//g, "-")}.xlsx`;
      link.click();
    } catch (error) {
      console.error("Eroare la exportul sesizărilor:", error);
      showToast("A apărut o eroare la export.", "danger");
    }
  };

  const actualizeazaNotita = async (id, text) => {
    try {
      await axios.put(
        `http://localhost:4000/sesizari/${id}/notita`,
        { notita: text },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Eroare la salvarea notiței:", err);
    }
  }; 
  
  const showCustomToast = (message, type = "success") => {
    setToastMsg(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };


  
  return (
    <div className="d-flex page-container">
      <NavBarAdmin />
      <div className="custom-container w-100">
        <Card className="p-4 shadow-lg border-2 border-dark rounded">
          <h3 className="text-center mb-4">🛠️ Sesizări primite de la studenți</h3>
          <div className="d-flex justify-content-end mb-3">
            <Button variant="success" onClick={exportSesizariToExcel}>
              ⬇️ Exportă cererile în Excel
            </Button>
          </div>
          <Form.Select
            className="mb-3 w-auto"
            value={filtruStatus}
            onChange={(e) => {
              setFiltruStatus(e.target.value);
              setPaginaCurenta(1); // resetăm pagina la 1 la schimbare filtru
            }}
          >
            <option value="toate">Toate</option>
            <option value="neprocesata">Neprocesate</option>
            <option value="in_lucru">În lucru</option>
            <option value="rezolvata">Rezolvate</option>
          </Form.Select>
          {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : sesizari.length === 0 ? (
            <p className="text-center text-muted">Nu există sesizări înregistrate.</p>
          ) : (
            <Table striped bordered hover responsive className="align-middle">
              <thead className="table-dark text-center">
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Titlu</th>
                  <th>Descriere</th>
                  <th>Imagine</th>
                  <th>Status</th>
                  <th>Trimis</th>
                  <th>Ultima actualizare</th>
                  <th>Notita admin</th>
                  <th>Contact</th>
                  <th>Actualizează</th>
                </tr>
              </thead>
              <tbody>
                {sesizariDeAfisat.map((s, idx) => (
                  <tr key={s.id}>
                    <td>{(paginaCurenta -1) * sesizariPerPagina + idx +1 }</td>
                    <td>{s.nume_student}</td>
                    <td>{s.titlu}</td>
                    <td>{s.descriere}</td>
                    <td>
                      {s.imagine ? (
                        s.imagine.split(",").map((src, index) => (
                          <img
                            key={index}
                            src={`http://localhost:4000${src}`}
                            alt={`sesizare-${index}`}
                            width="60"
                            className="mb-1 me-1 rounded border"
                            style={{ cursor: "pointer" }}
                            onClick={() => openPreview(
                              s.imagine.split(",").map((img) => `http://localhost:4000${img}`),
                              index
                            )}
                          />
                        ))
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Badge bg={
                        s.status === "rezolvata" ? "success" :
                        s.status === "in_lucru" ? "info" : "warning"
                      }>
                        {s.status}
                      </Badge>
                    </td>
                    <td>{new Date(s.data_trimitere).toLocaleDateString("ro-RO")}</td>
                    <td>{s.data_update ? new Date(s.data_update).toLocaleDateString("ro-RO") : "—"}</td>
                    <td>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        defaultValue={s.notita_admin || ""}
                        placeholder="Ex: Contactat tehnicul, urmează intervenția"
                        onBlur={(e) => actualizeazaNotita(s.id, e.target.value)}
                      />
                    </td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => deschideEmailModal(s)}>
                        📧 Trimite email
                      </Button>
                    </td>
                    <td>
                      <Form.Select
                        value={s.status}
                        onChange={(e) => updateStatus(s.id, e.target.value)}
                      >
                        <option value="neprocesata">neprocesata</option>
                        <option value="in_lucru">in_lucru</option>
                        <option value="rezolvata">rezolvata</option>
                      </Form.Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        {totalPagini > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <Button
              variant="outline-secondary"
              onClick={() => setPaginaCurenta((prev) => Math.max(prev - 1, 1))}
              disabled={paginaCurenta === 1}
              className="me-2"
            >
              ◀️ Anterior
            </Button>
            <span className="align-self-center">Pagina {paginaCurenta} din {totalPagini}</span>
            <Button
              variant="outline-secondary"
              onClick={() => setPaginaCurenta((prev) => Math.min(prev + 1, totalPagini))}
              disabled={paginaCurenta === totalPagini}
              className="ms-2"
            >
              Următoare ▶️
            </Button>
          </div>
        )}
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Previzualizare imagine</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={imgPreviewList[currentImgIndex]}
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
      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Trimite email studentului</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Subiect</Form.Label>
            <Form.Control
              value={subiectEmail}
              onChange={(e) => setSubiectEmail(e.target.value)}
              placeholder="Ex: Răspuns la sesizarea dvs."
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mesaj</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={mesajEmail}
              onChange={(e) => setMesajEmail(e.target.value)}
              placeholder="Scrie mesajul aici..."
            />
          </Form.Group>
          <div className="text-end">
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  await axios.post("http://localhost:4000/sesizari/email", {
                    email: emailTarget.email,
                    subiect: subiectEmail,
                    mesaj: mesajEmail,
                  }, { withCredentials: true });
                
                  showCustomToast("Email trimis cu succes!", "success");
                  setShowEmailModal(false);
                } catch (err) {
                  console.error("Eroare la trimiterea emailului:", err);
                  showCustomToast("A apărut o eroare la trimiterea emailului.", "danger");
                }
              }}
            >
              Trimite
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      {showToast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999 }}>
          <div className={`toast-header text-white ${toastType === "success" ? "bg-success" : "bg-danger"}`}>
            <strong className="me-auto">{toastType === "success" ? "Succes" : "Eroare"}</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)}></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}
    </div>
    
  );
  
}

export default SesizariAdministrare;
