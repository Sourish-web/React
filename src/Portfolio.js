// src/components/Portfolio.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get('http://localhost:8090/getPortfolio');
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error fetching portfolio', error);
    }
  };

  const totalValue = portfolio.reduce((sum, asset) => {
    return sum + asset.currentPrice * asset.quantity;
  }, 0);

  const chartData = {
    labels: portfolio.map((asset) => asset.assetName),
    datasets: [
      {
        label: 'Value in USD',
        data: portfolio.map((asset) => asset.currentPrice * asset.quantity),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: '#36A2EB',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Portfolio Value by Asset' }
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h2 className="text-2xl font-bold mb-4">My Investment Portfolio</h2>

      <div className="mb-6 overflow-x-auto">
        <table className="w-full table-auto border shadow-md rounded">
          <thead className="bg-blue-100 text-left">
            <tr>
              <th className="p-2">Asset Name</th>
              <th className="p-2">Symbol</th>
              <th className="p-2">Type</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Purchase Price</th>
              <th className="p-2">Current Price</th>
              <th className="p-2">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((asset, index) => (
              <tr key={index} className="border-b hover:bg-blue-50">
                <td className="p-2">{asset.assetName}</td>
                <td className="p-2">{asset.symbol.toUpperCase()}</td>
                <td className="p-2 capitalize">{asset.assetType}</td>
                <td className="p-2">{asset.quantity}</td>
                <td className="p-2">${asset.purchasePrice}</td>
                <td className="p-2 text-green-700">${asset.currentPrice.toFixed(2)}</td>
                <td className="p-2 font-semibold">${(asset.currentPrice * asset.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Total Portfolio Value: <span className="text-green-700">${totalValue.toFixed(2)}</span></h3>
      </div>

      <div>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Portfolio;
