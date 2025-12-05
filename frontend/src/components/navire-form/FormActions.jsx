import { FaTimes, FaSave, FaEdit } from "react-icons/fa";

export default function FormActions({ isLoading, isEditing, navigate }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
      <div className="flex flex-col sm:flex-row justify-end gap-6">
        <button
          type="button"
          onClick={() => navigate("/navires")}
          className="px-10 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-200 flex items-center justify-center gap-3 hover:shadow-lg"
        >
          <FaTimes className="text-sm" />
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-10 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enregistrement...
            </>
          ) : isEditing ? (
            <>
              <FaEdit className="text-sm" />
              Modifier le Navire
            </>
          ) : (
            <>
              <FaSave className="text-sm" />
              Créer le Navire
            </>
          )}
        </button>
      </div>
    </div>
  );
}