import { useEffect, useState } from "react";
import axios from "axios";

export default function useUserInfo() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:4000/me", { withCredentials: true })
      .then(res => {
        setUser(res.data);
      })
      .catch(err => {
        console.error("Eroare la obținerea informațiilor utilizatorului (/me):", err);
      });
  }, []);

  return user;
}
