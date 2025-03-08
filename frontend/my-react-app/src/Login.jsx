import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Login.css"
import HomeStudent from "./student/HomeStudent";
// import imagineCamin from "./assets/studenti_iarba.jpeg";


function Login({setUser}) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();

    axios.post("http://localhost:4000/login",
        { username, password }, 
        { withCredentials: true }
    )
    .then(response => {
        if (response.status === 200) {
            const { nume, prenume, esteAdmin } = response.data;
            alert("Login successful!");
            setUser({ nume, prenume, esteAdmin });
            console.log("User după login:", { nume, prenume, esteAdmin });

            if (esteAdmin) {
                navigate("/admin/dashboard");
            } else {
                navigate("/home");
            }
        }
    })
    .catch(error => {
        if (error.response) {
            alert(error.response.data.message);
            console.log('Error response:', error.response);
        } else {
            alert("An error occurred, please try again.");
        }
    });
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
        <input
          className="inputLogin"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="butonLogin" type="submit">Submit</button>
      </form>
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
      
    </div>
  );
}


export default Login;