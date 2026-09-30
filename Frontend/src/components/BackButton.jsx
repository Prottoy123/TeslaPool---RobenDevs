import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ to, label = "Back", className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
