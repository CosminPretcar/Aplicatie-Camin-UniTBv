import React, { useState, useEffect } from "react";
import axios from "axios";
import NavBarAdmin from "../components/NavBarAdmin";
import GraficRecenzii from "../utils/GraficRecenzii";
import { Container, Card, Form, Row, Col } from "react-bootstrap";
import "../styles/ReviewLunar.css";

function ReviewLunarAdmin() {
    const [comentarii, setComentarii] = useState([]);
    const [lunaSelectata, setLunaSelectata] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        const fetchComentarii = async () => {
            try {
                const response = await axios.get("http://localhost:4000/feedback/comentarii", {
                    withCredentials: true
                });
                setComentarii(response.data);
            } catch (err) {
                console.error("Eroare la încărcarea comentariilor:", err);
            }
        };

        fetchComentarii();
    }, []);

    const handleLunaChange = (e) => {
        setLunaSelectata(parseInt(e.target.value));
    };

    const comentariiFiltrate = comentarii.filter(
        (c) =>
            parseInt(c.luna_recenzie.split("-")[1]) === lunaSelectata &&
            c.comentarii?.trim() !== ""
    );

    const luni = [
        "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
        "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
    ];

    return (
        <div className="d-flex page-container">
            <NavBarAdmin />
            <div className="custom-container">
                <Row>
                    <Col md={12}>
                        <Card className="p-4 shadow-lg border-2 border-dark rounded mb-4">
                            <h2 className="mb-4 text-center">📊 Evoluția Recenziilor</h2>
                            <GraficRecenzii />
                        </Card>

                        <Card className="p-4 shadow-lg border-2 border-dark rounded">
                            <h4 className="mb-3">📝 Comentarii din recenzii</h4>

                            <Form.Group className="mb-3">
                                <Form.Label>Selectează luna</Form.Label>
                                <Form.Select value={lunaSelectata} onChange={handleLunaChange}>
                                    {luni.map((nume, index) => (
                                        <option key={index + 1} value={index + 1}>
                                            {nume}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            {comentariiFiltrate.length === 0 ? (
                                <p className="text-muted">Nu există comentarii pentru luna selectată.</p>
                            ) : (
                                comentariiFiltrate.map((c, idx) => (
                                    <Card key={idx} className="mb-3 p-3">
                                        <p><strong>Luna:</strong> {c.luna_recenzie}</p>
                                        <p>{c.comentarii}</p>
                                    </Card>
                                ))
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default ReviewLunarAdmin;
