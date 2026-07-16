import { useState } from 'react';
import axios from 'axios';

function StudentForm() {
  const [form, setForm] = useState({
    student_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    birthdate: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('http://localhost:5000/api/students', form);
      setForm({
        student_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        birthdate: '',
      });
      alert('✅ Student added');
    } catch (err) {
      console.error(err);
      alert('⚠️ Failed to add student. Please check required fields and backend connection.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="student_id"
        placeholder="Student ID"
        value={form.student_id}
        onChange={handleChange}
        required
      />
      <input
        name="first_name"
        placeholder="First Name"
        value={form.first_name}
        onChange={handleChange}
        required
      />
      <input
        name="middle_name"
        placeholder="Middle Name"
        value={form.middle_name}
        onChange={handleChange}
      />
      <input
        name="last_name"
        placeholder="Last Name"
        value={form.last_name}
        onChange={handleChange}
        required
      />
      <select name="gender" value={form.gender} onChange={handleChange} required>
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      <input type="date" name="birthdate" value={form.birthdate} onChange={handleChange} required />
      <button type="submit">Add Student</button>
    </form>
  );
}

export default StudentForm;
