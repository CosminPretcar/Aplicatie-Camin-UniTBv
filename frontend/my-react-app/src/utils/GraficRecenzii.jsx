import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

// Înregistrare module Chart.js necesare pentru grafice
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function GraficRecenzii() {
    const [statistici, setStatistici] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("http://localhost:4000/statistici-recenzii");
                setStatistici(response.data);
            } catch (error) {
                console.error("Eroare la încărcarea datelor:", error);
            }
        };

        fetchData();
    }, []);

    if (statistici.length === 0) return <p>Se încarcă datele...</p>;

    // Extragem lunile și valorile medii pentru fiecare categorie
    const luni = statistici.map(row => row.luna_recenzie);
    const dataset = (cheie, culoare) => ({
        label: cheie.charAt(0).toUpperCase() + cheie.slice(1), // Transformă prima literă în majusculă
        data: statistici.map(row => row[cheie]),
        borderColor: culoare,
        backgroundColor: `${culoare}66`,
        tension: 0.4, // Face graficul mai neted
    });

    // Definirea datelor pentru grafice
    const chartData = {
        labels: luni,
        datasets: [
            dataset("curatenie", "blue"),
            dataset("facilitati", "green"),
            dataset("zgomot", "red"),
            dataset("internet", "purple"),
            dataset("personal_administrativ", "orange"),
            dataset("securitate", "brown"),
        ]
    };

    return (
        <div className="grafice-container">
            <h3 className="text-center">📊 Evoluția Recenziilor în Ultimele 6 Luni</h3>
            <Line data={chartData} />
        </div>
    );
}

export default GraficRecenzii;
