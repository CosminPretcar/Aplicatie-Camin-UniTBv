import React, { useState } from "react";
import axios from "axios";
import { Form, Card } from "react-bootstrap";

function ResetareParola() {
  const [etapa, setEtapa] = useState("email"); // "email", "cod", "parola", "final"
  const [email, setEmail] = useState("");
  const [cod, setCod] = useState("");
  const [parolaNoua, setParolaNoua] = useState("");
  const [confirmare, setConfirmare] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingCod, setLoadingCod] = useState(false);
  const [loadingParola, setLoadingParola] = useState(false);



  const trimiteCod = async (e) => {
    e.preventDefault();
    setLoadingEmail(true);
    try {
      const response = await axios.post("http://localhost:4000/cerere-schimbare-parola", { email });
      setFeedback({ success: true, message: response.data.message });
      setEtapa("cod");
    } catch (err) {
      setFeedback({
        success: false,
        message: err.response?.data?.message || "Eroare la trimiterea codului.",
      });
    } finally {
      setLoadingEmail(false);
    }
  };

  const verificaCod = async (e) => {
    e.preventDefault();
    setLoadingCod(true);
    try {
      const response = await axios.post("http://localhost:4000/verifica-cod", { email, cod });
      setFeedback({ success: true, message: response.data.message });
      setEtapa("parola");
    } catch (err) {
      setFeedback({
        success: false,
        message: err.response?.data?.message || "Cod invalid sau expirat.",
      });
    } finally {
      setLoadingCod(false);
    }
  };

  const schimbaParola = async (e) => {
    e.preventDefault();
    setLoadingParola(true);
    if (parolaNoua !== confirmare) {
      return setFeedback({ success: false, message: "Parolele nu coincid." });
    }

    try {
      const response = await axios.post("http://localhost:4000/confirmare-schimbare-parola", {
        email,
        cod,
        parolaNoua,
      });

      setFeedback({ success: true, message: response.data.message });
      setEtapa("final");
      setCod("");
      setParolaNoua("");
      setConfirmare("");
    } catch (err) {
      setFeedback({
        success: false,
        message: err.response?.data?.message || "Eroare la schimbarea parolei.",
      });
    } finally {
      setLoadingParola(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "90vh" }}>
      <Card style={{ width: "100%", maxWidth: "500px" }} className="p-4 shadow-lg border-2 border-dark">
        <h3 className="text-center mb-4">🔐 Resetare Parolă</h3>

        {/* Etapa 1 – Introducere email */}
        {etapa === "email" && (
          <Form onSubmit={trimiteCod}>
            <Form.Group className="mb-3">
              <Form.Label>Adresa de email</Form.Label>
              <Form.Control
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <button className="btn btn-primary w-100" type="submit" disabled={loadingEmail}>
              { loadingEmail ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Se trimite...
                </span>
              ) : (
                "Trimite cod pe email"
              )}
            </button>
          </Form>
        )}

        {/* Etapa 2 – Cod de verificare */}
        {etapa === "cod" && (
          <Form onSubmit={verificaCod}>
            <Form.Group className="mb-3">
              <Form.Label>Cod primit prin email</Form.Label>
              <Form.Control
                type="text"
                required
                value={cod}
                onChange={(e) => setCod(e.target.value)}
              />
            </Form.Group>
            <button className="btn btn-success w-100" type="submit" disabled={loadingCod}>
              {loadingCod ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Se verifică...
                </span>
              ) : (
                "Verifică codul"
              )}
            </button>
          </Form>
        )}

        {/* Etapa 3 – Setează parola nouă */}
        {etapa === "parola" && (
          <Form onSubmit={schimbaParola}>
            <Form.Group className="mb-3">
              <Form.Label>Parolă nouă</Form.Label>
              <Form.Control
                type="password"
                required
                value={parolaNoua}
                onChange={(e) => setParolaNoua(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirmă parola nouă</Form.Label>
              <Form.Control
                type="password"
                required
                value={confirmare}
                onChange={(e) => setConfirmare(e.target.value)}
              />
            </Form.Group>
            <button className="btn btn-success w-100 mt-2" type="submit" disabled={loadingParola}>
              {loadingParola ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Se schimbă parola...
                </span>
              ) : (
                "Schimbă parola"
              )}
            </button>
          </Form>
        )}

        {/* Etapa finală */}
        {etapa === "final" && (
          <div className="text-center">
            <p className="text-success fw-bold">{feedback?.message}</p>
            <a className="btn btn-outline-primary mt-3" href="/">
              Mergi la autentificare
            </a>
          </div>
        )}

        {/* Feedback general */}
        {feedback && etapa !== "final" && (
          <p className={`mt-3 text-center fw-bold ${feedback.success ? "text-success" : "text-danger"}`}>
            {feedback.message}
          </p>
        )}
      </Card>
    </div>
  );
}

export default ResetareParola;
