import React, { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";
import GraficRecenzii from "../utils/GraficRecenzii";
import "../styles/ReviewLunar.css";

function ReviewLunar() {
    const [formData, setFormData] = useState({
        curatenie: 3,
        facilitati: 3,
        zgomot: 3,
        internet: 3,
        personal_administrativ: 3,
        securitate: 3,
        comentarii: ""
    });

    const [caminId, setCaminId] = useState(null);

    useEffect(() => {
        const fetchCaminId = async () => {
            try {
                const response = await axios.get("http://localhost:4000/camin-student", { withCredentials: true });
                setCaminId(response.data.caminId);
            } catch (error) {
                console.error("Eroare la obținerea căminului:", error);
            }
        };

        fetchCaminId();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
    
        setFormData((prevData) => ({
            ...prevData,
            [name]: name === "comentarii" ? value : isNaN(Number(value)) ? 3 : Number(value)  
        }));
    };
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caminId) {
            alert("Nu poti trimite o recenzie fără să fii înscris într-un cămin.");
            return;
        }

        try {
            await axios.post("http://localhost:4000/feedback", {
                caminId,
                curatenie: formData.curatenie,
                facilitati: formData.facilitati,
                zgomot: formData.zgomot,
                internet: formData.internet,
                personal_administrativ: formData.personal_administrativ,
                securitate: formData.securitate,
                comentarii: formData.comentarii
            });
            alert("Review trimis cu succes!");
        } catch (error) {
            console.error("Eroare la trimiterea feedback-ului", error);
            alert("A apărut o problemă, încearcă din nou.");
        }
    };

    return (
        <div className="d-flex page-container">
            <NavBar />
            <div className="custom-container">
                <Row>
                    <Col md={8}>
                        {/* Formularul de review */}
                        <Card className="p-4 shadow-lg review-card border-2 border-dark rounded">
                            <h2 className="mb-4 text-center">📋 Recenzia Lunara al Căminului</h2>
                            <Form onSubmit={handleSubmit}>

                                {/* Grupare 3 slidere pe un rând */}
                                <Row>
                                    <Col md={4}>
                                        <Card className="p-3 mb-3 category-card">
                                            <Form.Group>
                                                <Form.Label>🧹 Curățenie și Igienă</Form.Label>
                                                <Form.Range name="curatenie" min="1" max="5" value={formData.curatenie} onChange={handleChange} />
                                            </Form.Group>
                                        </Card>
                                    </Col>

                                    <Col md={4}>
                                        <Card className="p-3 mb-3 category-card">
                                            <Form.Group>
                                                <Form.Label>🏗️ Facilități și Echipamente</Form.Label>
                                                <Form.Range name="facilitati" min="1" max="5" value={formData.facilitati} onChange={handleChange} />
                                            </Form.Group>
                                        </Card>
                                    </Col>

                                    <Col md={4}>
                                        <Card className="p-3 mb-3 category-card">
                                            <Form.Group>
                                                <Form.Label>🔇 Nivelul de Zgomot</Form.Label>
                                                <Form.Range name="zgomot" min="1" max="5" value={formData.zgomot} onChange={handleChange} />
                                            </Form.Group>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={4}>
                                        <Card className="p-3 mb-3 category-card">
                                            <Form.Group>
                                                <Form.Label>🌐 Conexiunea la Internet</Form.Label>
                                                <Form.Range name="internet" min="1" max="5" value={formData.internet} onChange={handleChange} />
                                            </Form.Group>
                                        </Card>
                                    </Col>

                                    <Col md={4}>
                                        <Card className="p-3 mb-3 category-card">
                                            <Form.Group>
                                                <Form.Label>👨‍💼 Personal Administrativ</Form.Label>
                                                <Form.Range name="personal_administrativ" min="1" max="5" value={formData.personal_administrativ} onChange={handleChange} />
                                            </Form.Group>
                                        </Card>
                                    </Col>

                                    <Col md={4}>
                                        <Card className="p-3 mb-3 category-card">
                                            <Form.Group>
                                                <Form.Label>🔒 Securitate și Siguranță</Form.Label>
                                                <Form.Range name="securitate" min="1" max="5" value={formData.securitate} onChange={handleChange} />
                                            </Form.Group>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Comentarii suplimentare */}
                                <Form.Group className="mb-3">
                                    <Form.Label>📝 Comentarii</Form.Label>
                                    <Form.Control as="textarea" rows={3} name="comentarii" value={formData.comentarii || ""} onChange={handleChange} placeholder="Scrie aici orice detalii suplimentare..." />
                                </Form.Group>

                                {/* Buton stilizat */}
                                <div className="text-center">
                                    <Button variant="primary" type="submit" className="custom-button">
                                        <i className="bi bi-send"></i> Trimite Review
                                    </Button>
                                </div>
                            </Form>
                        </Card>

                        {/* Cardul cu graficul (sub formular) */}
                        <Card className="p-4 shadow-lg mt-4 border-2 border-dark rounded">
                            <GraficRecenzii />
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="p-4 shadow-lg border-2 border-dark rounded rules-card">
                            <h4 className="mb-3 text-center">📜 Cum să faci o recenzie?</h4>
                        
                            {/* Timpul necesar și importanța recenziei */}
                            <p className="text-muted text-center">
                                ⏳ <strong>Completarea recenziei durează mai puțin de 1 minut!</strong> <br />
                                🏡 <strong>Părerea ta contează!</strong>
                                <br /> Recenziile ajută la îmbunătățirea condițiilor din cămin. <br />
                                📝 Feedback-ul este analizat de administrație pentru a face schimbări.
                            </p>
                        
                            {/* Explicația notării */}
                            <p className="text-muted text-center">
                                🎯 <strong>Folosește sliderul pentru a acorda o notă de la 1 la 5 fiecărei categorii.</strong> <br />
                                1️⃣ <strong>1 este în stânga</strong>, 5️⃣ <strong>5 este în dreapta.</strong> <br />
                                🔍 În general: <strong>1 = Foarte slab</strong>, <strong>5 = Excelent</strong>. <br />
                                🔇 <span className="text-info">Excepție: La zgomot, nota 5 înseamnă că nu au fost probleme cu gălăgia.</span> <br />
                                ✏️ Poți adăuga comentarii pentru a oferi detalii suplimentare.
                            </p> 
                        
                            {/* Explicația fiecărei categorii */}
                            <ul className="list-group small-text">
                                <li className="list-group-item">🧹 <strong>Curățenie și Igienă:</strong> Cum ai găsit curățenia în cămin? Băi, camere, spații comune?</li>
                                <li className="list-group-item">🏗️ <strong>Facilități și Echipamente:</strong> Camerele sunt bine echipate? Mobila este în stare bună?</li>
                                <li className="list-group-item">🔇 <strong>Nivelul de Zgomot:</strong> Cât de liniștit este căminul? 5 = fără probleme cu gălăgia.</li>
                                <li className="list-group-item">🌐 <strong>Internet:</strong> Cum este calitatea conexiunii Wi-Fi?</li>
                                <li className="list-group-item">👨‍💼 <strong>Personal Administrativ:</strong> Personalul este amabil și oferă ajutor?</li>
                                <li className="list-group-item">🔒 <strong>Securitate și Siguranță:</strong> Te simți în siguranță? Accesul este controlat corespunzător?</li>
                            </ul>
                        
                            {/* Exemplu pentru comentarii */}
                            <p className="text-muted text-center mt-3">
                                ✍️ <strong>Nu știi ce să scrii la comentarii?</strong> Poți încerca: <br />
                                <em>"Wi-Fi-ul este instabil noaptea."</em> <br />
                                <em>"Personalul este foarte amabil!"</em> <br />
                                <em>"Camerele sunt curate, dar baia are probleme."</em>
                            </p>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default ReviewLunar;
