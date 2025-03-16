import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatisticiCereriChart = ({ statistici, etajSelectat, caminSelectat }) => {

  if (!caminSelectat) {
     return <p style={{ textAlign: "center", fontWeight: "bold" }}>Selectează un cămin pentru a vedea statistici.</p>;
     }
  const statisticiFiltrate = etajSelectat
    ? statistici.filter((c) => c.etaj.toString() === etajSelectat)
    : statistici;

  if (statisticiFiltrate.length === 0) {
    return <p style={{ textAlign: "center", fontWeight: "bold" }}>Nu există date pentru etajul selectat.</p>;
  }

  const camere = statisticiFiltrate.map((c) => `Camera ${c.numar_camera}`);
  const optiune1 = statisticiFiltrate.map((c) => c.optiune_1);
  const optiune2 = statisticiFiltrate.map((c) => c.optiune_2);
  const optiune3 = statisticiFiltrate.map((c) => c.optiune_3);

  const baseColors = {
    opt1: "rgba(54, 162, 235, 0.8)",  // Albastru
    opt2: "rgba(255, 159, 64, 0.8)",  // Portocaliu
    opt3: "rgba(153, 102, 255, 0.8)", // Mov
    suprasolicitat: "rgba(200, 50, 50, 1)" // Roșu închis pentru camere suprasolicitate
  };

  const colorsOpt1 = statisticiFiltrate.map((c) =>
    Math.max(c.optiune_1, c.optiune_2, c.optiune_3) > c.numar_paturi ? baseColors.suprasolicitat : baseColors.opt1
  );

  const colorsOpt2 = statisticiFiltrate.map((c) =>
    Math.max(c.optiune_1, c.optiune_2, c.optiune_3) > c.numar_paturi ? baseColors.suprasolicitat : baseColors.opt2
  );

  const colorsOpt3 = statisticiFiltrate.map((c) =>
    Math.max(c.optiune_1, c.optiune_2, c.optiune_3) > c.numar_paturi ? baseColors.suprasolicitat : baseColors.opt3
  );

  const data = {
    labels: camere,
    datasets: [
      {
        label: "Opțiunea 1 (Albastru)",
        data: optiune1,
        backgroundColor: colorsOpt1,
      },
      {
        label: "Opțiunea 2 (Portocaliu)",
        data: optiune2,
        backgroundColor: colorsOpt2,
      },
      {
        label: "Opțiunea 3 (Mov)",
        data: optiune3,
        backgroundColor: colorsOpt3,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true, 
        suggestedMax: 5, 
        ticks: {
          stepSize: 1, 
          color: "black", 
          callback: function (value) {
            return value; 
          },
        },
        grid: {
          color: (context) => (context.tick.value >= 5 ? "red" : "rgba(0, 0, 0, 0.1)"), // Linie roșie pentru 5+
        },
      },
    },
    plugins: {
      legend: { position: "top" },
      title: { 
        display: true, 
        text: `Statistici cereri - ${etajSelectat ? `Etaj ${etajSelectat}` : "Toate etajele"}`
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw} cereri`;
          },
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default StatisticiCereriChart;
