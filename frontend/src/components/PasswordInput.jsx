import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./PasswordInput.css";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Enter password",
  className = "glass-input",
  id,
  required = false,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        required={required}
        disabled={disabled}
        autoComplete="current-password"
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        disabled={disabled}
      >
        {visible ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  );
}
