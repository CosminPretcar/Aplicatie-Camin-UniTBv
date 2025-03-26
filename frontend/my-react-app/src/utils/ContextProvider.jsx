import React from "react";
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const userContext = createContext();

const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    setLoading(true);
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(response => {
        if (response.data.isAuthenticated) {
          setUser({
            nume: response.data.nume,
            prenume: response.data.prenume,
            esteAdmin: response.data.esteAdmin,
          });
          setAuthenticated(true);
        } else {
          setUser(null);
          setAuthenticated(false);
        }
      })
      .catch(error => console.error("Eroare la verificarea sesiunii:", error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <userContext.Provider value={{ user, authenticated, loading, refetchUser: fetchUser }}>
      {children}
    </userContext.Provider>
  );
};

export default ContextProvider