import React, { useState, useContext } from "react";
import { userContext } from "./utils/ContextProvider";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./styles/Login.css"
import HomeStudent from "./student/HomeStudent";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// import imagineCamin from "./assets/studenti_iarba.jpeg";


function Login({setUser}) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [eroare, setEroare] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { refetchUser } = useContext(userContext);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    try {
      const response = await axios.post("http://localhost:4000/login",
        { username, password },
        { withCredentials: true }
      );
  
      if (response.status === 200) {
        const { nume, prenume, esteAdmin } = response.data;
        setToastMsg("Autentificare reușită! Redirectionare în curs...");
        setShowToast(true);
        await refetchUser(); // sincronizezi ContextProvider-ul
        setUser({ nume, prenume, esteAdmin }); // doar local, dar nu mai e vital
        console.log("User după login:", { nume, prenume, esteAdmin });
  
        setTimeout(() => {
          if (esteAdmin) {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/home", { replace: true });
          }
        }, 750);
      }
    } catch (error) {
      if (error.response) {
        setEroare(error.response.data.message || "Date incorecte.");
      } else {
        setEroare("A apărut o eroare. Încearcă din nou.");
      }
    }
  };

  return (
    
    <div className="containerLogin">
      {/* <img className="imgBanner" src={imagineCamin} alt="Imagine-intrare-camin"></img> */}
      <h1>Autentificare - Camin@UniTBv</h1>
      <div className="formLogin">
        <form onSubmit={handleSubmit}>
        <label className="labelLogin" htmlFor="username">Username</label><br/>
        <input
          className="inputLogin"
          name="username"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <label className="labelLogin" htmlFor="password">Password</label><br/>
        <div style={{ position: "relative" }}>
          <input
            className="inputLogin"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ paddingRight: "40px" }}
          />
          <span
            onClick={() => setShowPassword(prev => !prev)}
            style={{
              position: "absolute",
              top: "35%",
              right: "12px",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#555",
              fontSize: "1.2rem"
            }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button className="butonLogin" type="submit">Submit</button>
      </form>
      {eroare && (
        <div style={{ color: "red", marginTop: "10px", fontWeight: "bold" }}>
          {eroare}
        </div>
      )}
      <p className="text-center mt-3">
       <Link to="/resetare-parola">Ai uitat parola?</Link>
      </p>

      </div>
      <div style={{marginTop: "100px"}}>
        <p>
          Prezentare pentru studentii noi{" "}
            <span 
              style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }} 
                onClick={() => navigate("/prezentare-camine")}
                  >
                    aici!
            </span>
        </p>
      </div>
      {showToast && (
  <div
    className="toast show position-fixed bottom-0 end-0 m-4"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
    style={{ zIndex: 9999, minWidth: "250px" }}
  >
    <div className="toast-header bg-success text-white">
      <strong className="me-auto">Succes</strong>
      <button
        type="button"
        className="btn-close btn-close-white"
        onClick={() => setShowToast(false)}
      ></button>
    </div>
    <div className="toast-body">
      {toastMsg}
    </div>
  </div>
)}
    </div>
  );
}


export default Login;