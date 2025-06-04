
import React from 'react';

interface Investment {
  id: number;
  project: string;
  amount: number;
  date: string;
}

interface InvestmentTableProps {
  investments: Investment[];
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({ investments }) => {
  if (investments.length === 0) {
    return <p className="text-muted-foreground">Aucun investissement à afficher.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Projet</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {investments.map((investment) => (
            <tr key={investment.id}>
              <td className="px-4 py-2">{investment.project}</td>
              <td className="px-4 py-2">{new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(investment.amount)}</td>
              <td className="px-4 py-2">{new Date(investment.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvestmentTable;
