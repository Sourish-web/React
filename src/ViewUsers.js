import axios from "axios";
import React, { useEffect, useState } from "react"; // ✅ Added useState here
import Cookies from "universal-cookie";

function ViewUsers() {
  const cookies = new Cookies();

  const [users, setUsers] = useState([]);

  const fetchAllUsers = async () => {

    const token = cookies.get("token");
    const baseURL = "http://localhost:8090/getUsers";

    try {
      const response = await axios.get(baseURL, {
        headers: {
          'Authorization': `Bearer ${token}`, // ✅ Corrected template literal
        },
      });

      console.log(response.data);

      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.log("Response data is not in valid format");
      }
    } catch (error) {
      console.log("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return (
    <>
      <h1>This is all users in our system</h1>

      <div>
        {users.length > 0 ? (
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                Name: {user.name}, Email: {user.email}
              </li>
            ))}
          </ul>
        ) : (
          <p>No records found</p>
        )}
      </div>
    </>
  );
}

export default ViewUsers;
