import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transaction = () => {
    const [transactions, setTransactions] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [transactionDate, setTransactionDate] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('jwtToken'); // Assuming JWT token is saved in local storage

    // Fetch all transactions on component mount
    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('http://localhost:8090/transaction/all', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setTransactions(response.data);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        }
    };

    // Handle form submission to add a transaction
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!description || !amount || !category || !transactionDate) {
            setError('All fields are required!');
            return;
        }

        const transactionData = {
            description,
            amount: parseFloat(amount),
            category,
            transactionDate,
        };

        try {
            const response = await axios.post('http://localhost:8090/transaction/add', transactionData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                // Reset form after successful submission
                setDescription('');
                setAmount('');
                setCategory('');
                setTransactionDate('');
                setError('');
                fetchTransactions(); // Fetch updated transactions list
            }
        } catch (err) {
            console.error('Error adding transaction:', err);
            setError('There was an issue adding the transaction.');
        }
    };

    return (
        <div>
            <h2>Add New Transaction</h2>
            <form onSubmit={handleSubmit}>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                <div>
                    <label>Description:</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Amount:</label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Category:</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Transaction Date:</label>
                    <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Add Transaction</button>
            </form>

            <h3>Your Transactions</h3>
            <ul>
                {transactions.map((transaction) => (
                    <li key={transaction.id}>
                        {transaction.description} - {transaction.amount} - {transaction.category} - {transaction.transactionDate}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Transaction;
