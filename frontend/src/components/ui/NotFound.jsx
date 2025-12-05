import { HiArrowLeft, HiOutlineInformationCircle } from "react-icons/hi";

export default function NotFound({ navigate }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center p-8">
        <HiOutlineInformationCircle className="mx-auto h-16 w-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Navire non trouvé</h2>
        <p className="text-slate-600 font-medium mb-6">
          Le navire que vous cherchez n'existe pas ou a été déplacé.
        </p>
        <button
          onClick={() => navigate("/navires")}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold mx-auto"
        >
          <HiArrowLeft className="w-4 h-4" />
          Retourner à la liste des navires
        </button>
      </div>
    </div>
  );
}