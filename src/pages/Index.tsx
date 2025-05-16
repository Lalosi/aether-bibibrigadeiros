
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to Dashboard
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-confectionery-gray/10">
      <div className="animate-pulse text-center">
        <h1 className="text-2xl font-semibold mb-4">Redirecionando...</h1>
        <p className="text-gray-500">Por favor, aguarde um momento.</p>
      </div>
    </div>
  );
};

export default Index;
