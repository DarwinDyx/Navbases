import { HiArrowLeft } from "react-icons/hi";

export default function NavireHeader({ navire, navigate }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/navires")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <HiArrowLeft className="w-5 h-5" />
          <span>Retour à la liste</span>
        </button>
      </div>
    </div>
  );
}