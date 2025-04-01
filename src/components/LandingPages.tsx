
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Farm, Leaf, TrendingUp, Users } from 'lucide-react';

interface LandingPageProps {
  onComplete: () => void;
}

const LandingPages: React.FC<LandingPageProps> = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const pages = [
    {
      title: "Bienvenue sur Maintso Vola",
      icon: <Leaf className="w-16 h-16 text-green-500" />,
      content: "Maintso Vola est une plateforme qui relie les agriculteurs aux investisseurs, créant des opportunités pour tous. Notre mission est de démocratiser l'accès au financement agricole et de promouvoir une agriculture durable à Madagascar.",
      color: "bg-green-50"
    },
    {
      title: "Pour les Agriculteurs",
      icon: <Farm className="w-16 h-16 text-amber-500" />,
      content: "Accédez à des financements pour vos projets agricoles, bénéficiez de l'accompagnement de techniciens qualifiés et développez votre activité. Enregistrez vos terrains, créez des projets et trouvez des investisseurs facilement.",
      color: "bg-amber-50"
    },
    {
      title: "Pour les Investisseurs",
      icon: <TrendingUp className="w-16 h-16 text-blue-500" />,
      content: "Investissez dans des projets agricoles vérifiés par des techniciens sur le terrain. Suivez la progression de vos investissements en temps réel et recevez des retours sur investissement proportionnels à votre participation.",
      color: "bg-blue-50"
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="ghost" 
          onClick={prevPage} 
          disabled={currentPage === 0}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>
        
        <div className="flex space-x-2">
          {pages.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentPage ? 'bg-primary' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentPage(index)}
            />
          ))}
        </div>
        
        {currentPage < pages.length - 1 ? (
          <Button 
            variant="ghost" 
            onClick={nextPage}
            className="flex items-center"
          >
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant="primary" 
            onClick={onComplete}
            className="flex items-center"
          >
            Accéder à l'application
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      
      <Card className={`overflow-hidden ${pages[currentPage].color}`}>
        <CardContent className="p-10 text-center">
          <div className="flex justify-center mb-6">
            {pages[currentPage].icon}
          </div>
          <h2 className="text-2xl font-bold mb-4">{pages[currentPage].title}</h2>
          <p className="text-lg">{pages[currentPage].content}</p>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center">
        <Button 
          variant="link" 
          onClick={onComplete}
        >
          Passer l'introduction
        </Button>
      </div>
    </div>
  );
};

export default LandingPages;
