import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import NavBarAdmin from "../components/NavBarAdmin";
import { Card, Row, Col, Button } from "react-bootstrap";
import { Pie, Line } from "react-chartjs-2";
import { Bar } from "react-chartjs-2";
import { BarElement } from "chart.js";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement, 
  BarElement
);

const MonitorizareActivitate = () => {
  const pieRef = useRef();
  const evolutieRef = useRef();
  const ratingRef = useRef();
  const timpRef = useRef();
  const activitateRef = useRef();
  const ocupareRef = useRef();



  const [sesizariStatus, setSesizariStatus] = useState([]);
  const [evolutieSesizari, setEvolutieSesizari] = useState([]);
  const [ratingLunar, setRatingLunar] = useState([]);
  const pointColors = ratingLunar.map(item => item.media < 3 ? "red" : "green");
  const [gradOcupare, setGradOcupare] = useState({ ocupate: 0, total: 0 });
  const [ocupareEtaj, setOcupareEtaj] = useState([]);
  const [timpRezolvare, setTimpRezolvare] = useState([]);
  const [activitateZilnica, setActivitateZilnica] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusRes = await axios.get("http://localhost:4000/statistici/sesizari-pe-status", { withCredentials: true });
        setSesizariStatus(Array.isArray(statusRes.data) ? statusRes.data : []);

        const evolutieRes = await axios.get("http://localhost:4000/statistici/evolutie-sesizari", {withCredentials:true});

        const sesizariMock = [
          { luna: "2024-11", total: 2 },
          { luna: "2024-12", total: 3 },
          { luna: "2025-01", total: 1 },
          { luna: "2025-02", total: 7 }
        ];        

        const backendSesizari = Array.isArray(evolutieRes.data) ? evolutieRes.data : [];

        const combinatSesizari = new Map();

        backendSesizari.forEach(item => combinatSesizari.set(item.luna, item.total));

        sesizariMock.forEach(item => combinatSesizari.set(item.luna, item.total));

        const evolutieCompletata = Array.from(combinatSesizari.entries())
          .map(([luna, total]) => ({ luna, total }))
          .sort((a, b) => new Date(`${a.luna}-01`) - new Date(`${b.luna}-01`));

        setEvolutieSesizari(evolutieCompletata);

        const ratingRes = await axios.get("http://localhost:4000/statistici/rating-mediu", {withCredentials:true});
        setRatingLunar(Array.isArray(ratingRes.data) ? ratingRes.data : []);

        const ocupareRes = await axios.get("http://localhost:4000/statistici/grad-ocupare", {withCredentials:true})
        setGradOcupare(ocupareRes.data);

        const etajRes = await axios.get("http://localhost:4000/statistici/locuri-ocupate-pe-etaj", { withCredentials: true });
        setOcupareEtaj(Array.isArray(etajRes.data) ? etajRes.data : []);

        const timpRes = await axios.get("http://localhost:4000/statistici/timp-mediu-rezolvare", { withCredentials: true });

        const timpMock = [
          { luna: "2024-11", ore_medii: 34.5 },
          { luna: "2024-12", ore_medii: 29.8 },
          { luna: "2025-01", ore_medii: 70.9 }
        ];

        const backendTimp = Array.isArray(timpRes.data) ? timpRes.data : [];

        const combinatTimpMediu = new Map();
        // întâi din backend
        backendTimp.forEach(item => combinatTimpMediu.set(item.luna, item.ore_medii));
        // apoi mock
        timpMock.forEach(item => combinatTimpMediu.set(item.luna, item.ore_medii));

        const timpCompletat = Array.from(combinatTimpMediu.entries())
          .map(([luna, ore_medii]) => ({ luna, ore_medii }))
          .sort((a, b) => new Date(`${a.luna}-01`) - new Date(`${b.luna}-01`));

        setTimpRezolvare(timpCompletat);

        const activRes = await axios.get("http://localhost:4000/statistici/activitate-zilnica", { withCredentials: true });
        setActivitateZilnica(activRes.data);

      } catch (error) {
        
      }
    };

    fetchData();
  }, []);

  const pieChartData = {
    labels: sesizariStatus.map(item => item.status),
    datasets: [
      {
        label: "Număr sesizări",
        data: sesizariStatus.map(item => item.valoare),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        borderWidth: 1
      },
    ],
  };
  
  const evolutieChartData = {
    labels: evolutieSesizari?.map(item => item.luna) || [],
    datasets: [
      {
        label: "Sesizări trimise",
        data: evolutieSesizari?.map(item => item.total) || [],
        borderColor: "#36A2EB",
        tension: 0.3,
        fill: false,
      }
    ]
  };

  const ratingChartData = {
    labels: ratingLunar?.map(item => item.luna) || [],
    datasets: [
      {
        label: "Rating mediu lunar",
        data: ratingLunar?.map(item => item.media) || [],
        borderColor: "#4BC0C0", // linia rămâne turcoaz
        tension: 0.3,
        fill: false,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const ratingChartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1
        },
        title: {
          display: true,
          text: "Scor (1–5)"
        }
      },
      x: {
        title: {
          display: true,
          text: "Luna"
        }
      }
    },
    plugins: {
      legend: {
        display: true
      }
    },
    elements: {
      line: {
        borderWidth: 3
      }
    },
    segment: {
      borderColor: ctx => {
        const rating = ctx.p1.raw;
        return rating < 3 ? "red" : "green";
      }
    }
  };

  const etajChartData = {
    labels: ocupareEtaj.map(item => `Etaj ${item.etaj}`),
    datasets: [
      {
        label: "Locuri ocupate",
        data: ocupareEtaj.map(item => item.ocupate),
        backgroundColor: "#8e44ad"
      }
    ]
  };

  const capacitateEtaj = {
    0: 36,
    1: 48,
    2: 48,
    3: 48,
    4:48
  };

  const timpRezolvareData = {
    labels: timpRezolvare.map(item => item.luna),
    datasets: [
      {
        label: "Ore medii",
        data: timpRezolvare.map(item => item.ore_medii),
        borderColor: "#ff6b6b",
        backgroundColor: "#ff6b6b",
        fill: false,
        tension: 0.3
      }
    ]
  };

  const activitateZilnicaData = {
    labels: activitateZilnica.map(item =>
      new Date(item.zi).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })),
    datasets: [
      {
        label: "Acțiuni totale",
        data: activitateZilnica.map(item => item.total),
        backgroundColor: "#36a2eb"
      }
    ]
  };
  

  return (
    <div className="d-flex page-container">
      <NavBarAdmin />
      <div className="custom-container p-4">
        <h2 className="mb-4 text-center">📊 Monitorizare Activitate în Cămin</h2>

        {/* Rând 1 */}
        <Row>
          <Col md={6}>
            <Card className="p-3 mb-4" style={{ height: "500px",  position: "relative" }}>
              <h5 className="text-center">Sesizări în funcție de status</h5>
              <div style={{ height: "400px" }}>
                {sesizariStatus.length > 0 ? <Pie ref={pieRef} data={pieChartData} /> : <p>Se încarcă...</p>}
                <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                  <Button variant="outline-primary" size="sm" onClick={() => {
                    const uri = pieRef.current.toBase64Image();
                    const link = document.createElement("a");
                    link.href = uri;
                    link.download = "grafic-sesizari.png";
                    link.click();
                  }}>
                    💾 Exportă imagine
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="p-3 mb-4" style={{ height: "500px", position:"relative" }}>
              <h5 className="text-center">Evoluția sesizărilor în timp</h5>
              <div style={{ height: "400px" }}>
                <Line ref={evolutieRef} data={evolutieChartData} />
                <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                  <Button variant="outline-primary" size="sm" onClick={() => {
                    const uri = evolutieRef.current.toBase64Image();
                    const link = document.createElement("a");
                    link.href = uri;
                    link.download = "grafic-evolutie-sesizari.png";
                    link.click();
                  }}>
                    💾 Exportă imagine
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Rând 2 */}
        <Row>
          <Col md={6}>
            <Card className="p-3 mb-4" style={{ height: "500px",  position:"relative" }}>
              <h5 className="text-center">Rating lunar mediu</h5>
              <div style={{ height: "400px" }}>
                <Line ref={ratingRef} data={ratingChartData} options={ratingChartOptions} />
                <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                  <Button variant="outline-primary" size="sm" onClick={() => {
                    const uri = ratingRef.current.toBase64Image();
                    const link = document.createElement("a");
                    link.href = uri;
                    link.download = "grafic-rating-lunar-mediu.png";
                    link.click();
                  }}>
                    💾 Exportă imagine
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="p-3 mb-4 text-center" style={{ height: "500px", position:"relative" }}>
              <h5>Grad de ocupare locuri</h5>
              <h2 className="mt-4">
                {gradOcupare.total > 0
                  ? `${Math.round((gradOcupare.ocupate / gradOcupare.total) * 100)}%`
                  : "—"}
              </h2>
              <p>{gradOcupare.ocupate} / {gradOcupare.total} locuri ocupate</p>
              <hr />
              <h6 className="mt-3">Ocupare pe etaje</h6>
              {/* Afișare text + progres vizibil */}
              <div className="text-start px-4" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {ocupareEtaj.length > 0 ? (
                  ocupareEtaj.map(({ etaj, ocupate }) => {
                    const totalEtaj = capacitateEtaj[etaj] || 0;
                    const procent = totalEtaj > 0 ? Math.round((ocupate / totalEtaj) * 100) : 0;
                  
                    return (
                      <div key={etaj} className="mb-2">
                        <strong>{etaj === 0 ? "Parter" : `Etaj ${etaj}`}</strong>: {ocupate} / {totalEtaj} locuri ocupate ({procent}%)
                        <div className="progress mt-1" style={{ height: "8px" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${procent}%` }}
                            aria-valuenow={procent}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>Se încarcă...</p>
                )}
              </div>
              {/* Grafic invizibil pentru export */}
              <div style={{ position: "absolute", left: "-9999px", width: "400px", height: "300px" }}>
                <Bar ref={ocupareRef} data={etajChartData} />
              </div>
              {/* Buton export imagine */}
              <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                <Button variant="outline-primary" size="sm" onClick={() => {
                  const uri = ocupareRef.current?.toBase64Image();
                  if (uri) {
                    const link = document.createElement("a");
                    link.href = uri;
                    link.download = "ocupare-pe-etaje.png";
                    link.click();
                  }
                }}>
                  💾 Exportă imagine
                </Button>
              </div>

            </Card>
          </Col>
        </Row>

        {/* Rând 3 */}
        <Row>
          <Col md={6}>
            <Card className="p-3 mb-4" style={{ height: "500px",  position:"relative" }}>
              <h5 className="text-center">Timp mediu de rezolvare sesizări</h5>
              <div style={{ height: "400px" }}>
                {timpRezolvare.length > 0 ? (
                  <Line ref={timpRef} data={timpRezolvareData} />
                ) : (
                  <p>Se încarcă...</p>
                )}
                <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                  <Button variant="outline-primary" size="sm" onClick={() => {
                    const uri = timpRef.current.toBase64Image();
                    const link = document.createElement("a");
                    link.href = uri;
                    link.download = "grafic-timp-rezolvare.png";
                    link.click();
                  }}>
                    💾 Exportă imagine
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="p-3 mb-4" style={{ height: "500px",  position:"relative" }}>
              <h5 className="text-center">Activitate zilnică pe platformă</h5>
              <div style={{ height: "400px" }}>
                {activitateZilnica.length > 0 ? (
                  <Line ref={activitateRef} data={activitateZilnicaData} />
                ) : (
                  <p>Se încarcă...</p>
                )}
                <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                  <Button variant="outline-primary" size="sm" onClick={() => {
                    const uri = activitateRef.current.toBase64Image();
                    const link = document.createElement("a");
                    link.href = uri;
                    link.download = "grafic-activitate-platforma.png";
                    link.click();
                  }}>
                    💾 Exportă imagine
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default MonitorizareActivitate;
