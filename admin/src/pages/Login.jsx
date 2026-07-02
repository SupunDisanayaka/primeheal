import React, { useState, useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [state, setState] = useState("Admin"); // 'Admin', 'Doctor', 'Receptionist', 'Accountant'
  const [email, setEmail] = useState("admin@primeheal.com");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");

  const { login: adminLogin } = useContext(AdminContext);
  const { login: doctorLogin } = useContext(DoctorContext);
  const { doctors, loginReceptionist, loginAccountant } = useContext(AppContext);

  const navigate = useNavigate();

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (state === "Admin") {
      const success = await adminLogin(email, password);
      if (success) {
        navigate("/admin-dashboard");
      } else {
        setError("Invalid Admin email or password. (Hint: admin@primeheal.com / admin)");
      }
    } else if (state === "Doctor") {
      const success = await doctorLogin(email, password);
      if (success) {
        navigate("/doctor-dashboard");
      } else {
        setError("Invalid Doctor email or password. (Hint: chelakanishshanka@gmail.com / manuja123)");
      }
    } else if (state === "Receptionist") {
      const success = await loginReceptionist(email, password);
      if (success) {
        navigate("/receptionist-dashboard");
      } else {
        setError("Invalid Receptionist email or password. (Hint: alice@primeheal.com / receptionist)");
      }
    } else if (state === "Accountant") {
      const success = await loginAccountant(email, password);
      if (success) {
        navigate("/accountant-dashboard");
      } else {
        setError("Invalid Accountant email or password. (Hint: sarah.j@primeheal.com / accountant)");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmitHandler}
        className="bg-white p-8 sm:p-10 rounded-2xl border border-zinc-100 shadow-xl w-full max-w-[420px] transition-all"
      >
        {/* Header Title */}
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight text-center">
          <span className="text-primary">{state}</span> Portal
        </h2>
        <p className="text-sm text-gray-500 text-center mt-2">
          Enter credentials below to access your account.
        </p>

        {/* Inline Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs leading-relaxed font-medium">
            {error}
          </div>
        )}

        {/* Input Fields */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Email Address
            </label>
            <input
              className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all placeholder:text-gray-400 bg-gray-50/50"
              type="email"
              placeholder={`e.g. ${state.toLowerCase()}@primeheal.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Password
            </label>
            <input
              className="border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-indigo-100 outline-none rounded-xl p-3 w-full text-sm text-gray-800 transition-all placeholder:text-gray-400 bg-gray-50/50"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Action Login Button */}
        <button
          type="submit"
          className="mt-6 w-full bg-primary hover:bg-[#4f5fef] text-white py-3 rounded-xl font-semibold shadow-md active:scale-98 transition-all"
        >
          Sign In
        </button>

        {/* Role Toggle Console */}
        <div className="mt-6 text-center text-sm text-gray-600 border-t border-zinc-100 pt-5 flex flex-col gap-2.5">
          <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider select-none">Switch Role Access</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Admin", "Doctor", "Receptionist", "Accountant"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setState(role);
                  setError("");
                  if (role === "Admin") {
                    setEmail("admin@primeheal.com");
                    setPassword("admin");
                  } else if (role === "Doctor") {
                    setEmail("chelakanishshanka@gmail.com");
                    setPassword("manuja123");
                  } else if (role === "Receptionist") {
                    setEmail("alice@primeheal.com");
                    setPassword("receptionist");
                  } else if (role === "Accountant") {
                    setEmail("sarah.j@primeheal.com");
                    setPassword("accountant");
                  }
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  state === role
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-slate-50 text-gray-600 border-zinc-200 hover:bg-slate-100 hover:text-gray-900"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;