import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVLink } from "react-csv";

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = "http://localhost:8090";

  // Retrieve token from cookies
  const getAuthToken = () => {
    return cookies.get("token"); // Getting the token from cookies
  };

  // Fetch all transactions
  const fetchTransactions = async () => {
    const token = getAuthToken();
    if (!token) {
      alert("You are not authenticated");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/transaction/all`, {
        headers: {
          Authorization: `Bearer ${token}`, // Attach JWT token to request
        },
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      alert("Failed to fetch transactions.");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Transaction Report", 20, 10);
    autoTable(doc, {
      head: [["Date", "Description", "Amount", "Category"]],
      body: transactions.map((t) => [
        new Date(t.transactionDate).toLocaleDateString(),
        t.description,
        t.amount,
        t.category,
      ]),
    });
    doc.save("transaction-report.pdf");
  };

  // Calculate tax summary
  const calculateTax = () => {
    const income = transactions
      .filter((t) => t.category.toLowerCase() === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const tax = income * 0.1;
    return { income, tax };
  };

  const { income, tax } = calculateTax();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>

      <div className="flex gap-4 mb-4">
        <button
          onClick={generatePDF}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Download PDF
        </button>

        <CSVLink
          data={transactions}
          filename={"transaction-report.csv"}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Download CSV
        </CSVLink>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-semibold">Tax Summary</h3>
        <p>Estimated Income: ₹{income.toFixed(2)}</p>
        <p>Estimated Tax (10%): ₹{tax.toFixed(2)}</p>
      </div>

      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">
                {new Date(t.transactionDate).toLocaleDateString()}
              </td>
              <td className="border px-4 py-2">{t.description}</td>
              <td className="border px-4 py-2">₹{t.amount}</td>
              <td className="border px-4 py-2">{t.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;
