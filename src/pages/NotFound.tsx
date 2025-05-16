
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Usuário tentou acessar rota inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-confectionery-pink/10 px-4 text-center">
      <Logo size="large" />
      <h1 className="text-7xl font-bold mt-8 mb-4 gradient-text">404</h1>
      <p className="text-xl text-gray-600 mb-6">Oops! Página não encontrada</p>
      <p className="text-gray-500 max-w-md mb-8">
        A página que você está procurando pode ter sido removida, renomeada ou está temporariamente indisponível.
      </p>
      <Link to="/">
        <Button className="bg-confectionery-pink hover:bg-confectionery-pink/80">
          Voltar para a Página Inicial
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
