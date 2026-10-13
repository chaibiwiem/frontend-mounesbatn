import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { installFormValidation } from './utils/formValidation';

// Messages de validation en francais sous chaque champ (au lieu des bulles
// natives du navigateur) - voir utils/formValidation.js.
installFormValidation();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
