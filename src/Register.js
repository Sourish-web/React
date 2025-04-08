import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [register, setRegister] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    birthDate: "",
    panCard: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setRegister({
      ...register,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(register);

    try {
      const response = await axios.post("http://localhost:8090/auth/signup", register);
      console.log(response.data);
      alert("User registered successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Error while registering:", error);
      alert("Failed to register user.");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Register</h2>

        <label>Name:</label>
        <input type="text" name="name" value={register.name} onChange={handleChange} />

        <br /><br />
        <label>Email:</label>
        <input type="email" name="email" value={register.email} onChange={handleChange} />

        <br /><br />
        <label>Password:</label>
        <input type="password" name="password" value={register.password} onChange={handleChange} />

        <br /><br />
        <label>Phone Number:</label>
        <input type="text" name="phone" value={register.phone} onChange={handleChange} />

        <br /><br />
        <label>Birth Date:</label>
        <input type="date" name="birthDate" value={register.birthDate} onChange={handleChange} />

        <br /><br />
        <label>PAN Card:</label>
        <input type="text" name="panCard" value={register.panCard} onChange={handleChange} />

        <br /><br />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
