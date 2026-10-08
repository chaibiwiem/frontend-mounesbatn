import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as authService from '../services/authService';

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authService
      .verifyEmail(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Lien de vérification invalide.');
      });
  }, [token]);

  return (
    <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Vérification de l&apos;email</h1>

        <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
          {status === 'loading' ? 'Vérification en cours...' : message}
        </p>

        <p className="mt-4 text-sm">
          <Link to="/login" className="font-medium text-rose-600 hover:underline">
            Aller à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
