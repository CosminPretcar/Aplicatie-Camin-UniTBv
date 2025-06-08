import React, {useContext} from "react";
import { userContext } from "./ContextProvider";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({children , roles}) => {
    const {user, authenticated, loading} = useContext(userContext)

    if(loading) {
      return <p>Se verifica sesiunea...</p>;
    }

    if(!authenticated) {
      return <Navigate to='/' />
    }

    if (!user) {
      return <p>Se încarcă datele...</p>; 
    }
    
    const userRole = user.esteAdmin ? 'admin' : 'user';

    if(!roles.includes(userRole)){
      return <Navigate to="/unauthorized" />
    }

    return children;
}

export default ProtectedRoute


