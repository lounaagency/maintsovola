
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PaymentTrend {
  month: string;
  amount: number;
}

interface PaymentMethod {
  name: string;
  value: number;
  fill: string;
}

interface PaymentAnalyticsProps {
  paymentTrends: PaymentTrend[];
  paymentMethods: PaymentMethod[];
}

const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({ 
  paymentTrends, 
  paymentMethods 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [
                  new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'MGA',
                    minimumFractionDigits: 0,
                  }).format(value),
                  'Montant'
                ]}
              />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition par Méthode</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [
                  new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'MGA',
                    minimumFractionDigits: 0,
                  }).format(value),
                  'Montant'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentAnalytics;
