import {
  Home,
  ArrowLeft
} from "lucide-react";

import {
  Link,
  useNavigate
} from "react-router-dom";


const NotFound = () => {

  const navigate =
    useNavigate();


  return (

    <div className="not-found-page">

      <div className="not-found-card">

        <div className="not-found-number">
          404
        </div>


        <h1>
          Page Not Found
        </h1>


        <p>
          The page you are looking for
          does not exist or may have been moved.
        </p>


        <div className="not-found-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>


          <Link
            to="/"
            className="primary-button"
            style={{
              textDecoration: "none"
            }}
          >
            <Home size={16} />
            Home
          </Link>

        </div>

      </div>

    </div>

  );
};


export default NotFound;
