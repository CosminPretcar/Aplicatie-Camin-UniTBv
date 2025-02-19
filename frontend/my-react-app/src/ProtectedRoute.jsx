import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, isAdminRequired, children }) => {

  if (user === null) {
    return <div>Se încarcă...</div>; 
  }
  if (!user) {
    return <Navigate to="/" />;
  }
  if (isAdminRequired && !user.esteAdmin) {
    return <Navigate to="/admin/dashboard" />;
  }
  return children;
};

export default ProtectedRoute;
