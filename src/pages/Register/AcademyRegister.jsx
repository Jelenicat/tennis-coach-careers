import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import "../Register/auth.css";

export default function AcademyRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    contactName: "",
    email: "",
    phone: "",
    organisationName: "",
    address: "",
    city: "",
    region: "",
    contactPreferences: [],
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function togglePreference(value) {
    setForm((prev) => ({
      ...prev,
      contactPreferences: prev.contactPreferences.includes(value)
        ? prev.contactPreferences.filter((v) => v !== value)
        : [...prev.contactPreferences, value],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // ⬇️ ovde kasnije ide Firestore / API
    console.log("Academy profile:", form);

    // nakon registracije → dashboard
    navigate("/academy/dashboard");
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <img
          src="/images/logo.png"
          alt="Tennis Coach Careers"
          className="authLogo"
        />

        <h2 style={{ textAlign: "center", marginBottom: 6 }}>
          Academy / Club Registration
        </h2>

        <p className="authSubtitle">
          Create your organisation profile
        </p>

        <form onSubmit={handleSubmit}>
          {/* CONTACT */}
          <div className="formSection">
            <h3>Contact Information</h3>

            <input
              type="text"
              name="contactName"
              placeholder="Contact name *"
              value={form.contactName}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="tel"
              name="phone"
              placeholder="Contact number *"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* ORGANISATION */}
          <div className="formSection">
            <h3>Organisation</h3>

            <input
              type="text"
              name="organisationName"
              placeholder="Organisation name *"
              value={form.organisationName}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="address"
              placeholder="Address *"
              value={form.address}
              onChange={handleChange}
              required
            />

            <div className="twoCols">
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={form.city}
                onChange={handleChange}
                required
              />

              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                required
              >
                <option value="">Choose region *</option>
                <option value="Europe">Europe</option>
                <option value="North America">North America</option>
                <option value="South America">South America</option>
                <option value="Asia">Asia</option>
                <option value="Africa">Africa</option>
                <option value="Australia">Australia</option>
              </select>
            </div>
          </div>

    
         

          <Button className="primaryBtn full" type="submit">
            Create Academy Profile
          </Button>
        </form>

        <div className="authFooter">
          You will be able to post multiple job listings after registration
        </div>
      </div>
    </div>
  );
}
