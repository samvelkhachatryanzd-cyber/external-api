import { Link } from 'react-router';

export default function NotFound() {
  return (
    <p className="status">
      Page not found. <Link to="/applications">Back to all applications</Link>
    </p>
  );
}
