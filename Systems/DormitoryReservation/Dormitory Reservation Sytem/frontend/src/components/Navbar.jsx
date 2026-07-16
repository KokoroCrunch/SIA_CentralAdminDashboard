import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        DormReserve
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/rooms">Rooms</Link>
            {user.role === 'admin' ? (
              <>
                <Link to="/admin">Admin Panel</Link>
                <Link to="/admin/reservations">Reservations</Link>
                <Link to="/admin/analytics">Reports</Link>
              </>
            ) : (
              <Link to="/my-reservations">My Reservations</Link>
            )}
            <span className="navbar-user">{user.name}</span>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
