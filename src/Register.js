import React from "react";
import axios from "axios";

function Register() {
  const [register, setRegister] = React.useState({
    name: "",
    email: "",
    password: "",
  });

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
      alert("User added successfully!");
    } catch (error) {
      console.error("Error while registering:", error);
      alert("Failed to register user.");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Register</h2>

        <label htmlFor="username">Name:</label>
        <input
          type="text"
          id="username"
          name="name"
          placeholder="Enter your name"
          value={register.name}
          onChange={handleChange}
        />
        <br />
        <br />

        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
          value={register.email}
          onChange={handleChange}
        />
        <br />
        <br />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Enter your password"
          value={register.password}
          onChange={handleChange}
        />
        <br />
        <br />

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;

