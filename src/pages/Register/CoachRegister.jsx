import "./auth.css";
import Button from "../../components/ui/Button";

/* ================= DATA ================= */

const countries = [
  "Serbia",
  "Croatia",
  "Bosnia and Herzegovina",
  "Montenegro",
  "Slovenia",
  "North Macedonia",
  "Italy",
  "Spain",
  "France",
  "Germany",
  "Austria",
  "Switzerland",
  "United Kingdom",
  "Ireland",
  "Netherlands",
  "Belgium",
  "Portugal",
  "Greece",
  "Turkey",
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "Chile",
  "Australia",
  "New Zealand",
  "Japan",
  "China",
  "South Korea",
  "India",
  "South Africa",
  "Egypt",
  "Morocco",
];

const regions = [
  "Europe",
  "North America",
  "South America",
  "Asia",
  "Africa",
  "Australia & Oceania",
];

const phoneCodes = [
  { code: "+381", label: "🇷🇸 Serbia" },
  { code: "+385", label: "🇭🇷 Croatia" },
  { code: "+387", label: "🇧🇦 Bosnia and Herzegovina" },
  { code: "+382", label: "🇲🇪 Montenegro" },
  { code: "+386", label: "🇸🇮 Slovenia" },
  { code: "+39", label: "🇮🇹 Italy" },
  { code: "+34", label: "🇪🇸 Spain" },
  { code: "+33", label: "🇫🇷 France" },
  { code: "+49", label: "🇩🇪 Germany" },
  { code: "+44", label: "🇬🇧 United Kingdom" },
  { code: "+1", label: "🇺🇸 USA / 🇨🇦 Canada" },
  { code: "+61", label: "🇦🇺 Australia" },
  { code: "+81", label: "🇯🇵 Japan" },
  { code: "+86", label: "🇨🇳 China" },
  { code: "+91", label: "🇮🇳 India" },
];

/* ================= COMPONENT ================= */

export default function CoachRegister() {
  return (
    <div className="authPage">
      <div className="authCard">

        {/* LOGO */}
        <img
          src="/images/logo.png"
          alt="Tennis Coach Careers"
          className="authLogo"
        />

        <h2 style={{ textAlign: "center", marginBottom: 4 }}>
          Create Coach Profile
        </h2>

        <p className="authSubtitle">
          Create your professional tennis coaching profile
        </p>

        {/* ================= PERSONAL INFO ================= */}
        <div className="formSection">
          <h3>Personal Information</h3>

          <input type="text" placeholder="Full Name" />
          <input type="number" placeholder="Age" />

          <div className="twoCols">
            {/* NATIONALITY */}
            <input
              list="countries"
              type="text"
              placeholder="Nationality"
            />

            {/* RESIDENCE */}
            <input
              type="text"
              placeholder="Current Residence"
            />
          </div>

          {/* COUNTRY DATALIST */}
          <datalist id="countries">
            {countries.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {/* PHONE */}
          <div className="twoCols">
            <select>
              {phoneCodes.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label} ({p.code})
                </option>
              ))}
            </select>

            <input
              type="tel"
              placeholder="Phone number"
            />
          </div>

          <input type="email" placeholder="Email" />
        </div>

        {/* ================= PROFILE INFO ================= */}
        <div className="formSection">
          <h3>Profile Information</h3>

          <textarea
            rows={4}
            placeholder="Tell us about your coaching philosophy, experience and goals"
          />

          <input
            type="text"
            placeholder="Certifications (e.g. ITF Level 2, ATP Certified Coach)"
          />

          <div className="twoCols">
            <input type="url" placeholder="Playing Video URL" />
            <input type="url" placeholder="Coaching Video URL" />
          </div>

          <button className="uploadBtn">
            + Upload Photos (max 5)
          </button>
        </div>

        {/* ================= REGION ================= */}
        <div className="formSection">
          <h3>Region</h3>

          <input
            list="regions"
            type="text"
            placeholder="Choose region (continent)"
          />

          <datalist id="regions">
            {regions.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        {/* ================= RECOMMENDATION ================= */}
        <div className="formSection">
          <h3>Letter of Recommendation</h3>

          <input type="text" placeholder="Recommender Name" />

          <textarea
            rows={3}
            placeholder="Write or paste the recommendation text here"
          />
        </div>

        {/* ================= SUBMIT ================= */}
        <Button className="primaryBtn full">
          Create Profile
        </Button>

        <div className="authFooter">
          Already have an account? <b>Log in</b>
        </div>
      </div>
    </div>
  );
}
