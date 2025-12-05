import { HiArrowLeft } from "react-icons/hi";

export default function NavireBackButton({ navigate }) {
  return (
    <button
      onClick={() => navigate("/navires")}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
    >
      <HiArrowLeft className="w-5 h-5" />
      <span>Retour à la liste</span>
    </button>
  );
}