import { FaArrowLeft, FaShip, FaFileCsv } from "react-icons/fa";

export default function NavireFormHeader({ isEditing, navigate, onImportCSV }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/navires")}
          className="flex items-center gap-3 text-blue-700 hover:text-blue-900 font-semibold transition-colors duration-200 group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-200">
            <FaArrowLeft className="text-sm text-blue-600" />
          </div>
          <span>Retour à la liste</span>
        </button>
        
        
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
            <FaShip className="text-2xl text-white" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? "Modifier le Navire" : "Nouveau Navire"}
                </h1>
                <p className="text-blue-600 mt-2 font-medium">
                  {isEditing 
                    ? "Modifiez les informations du navire" 
                    : "Ajoutez un nouveau navire à la flotte"
                  }
                </p>
              </div>
              
              {/* Indicateur de mode */}
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                isEditing 
                  ? "bg-blue-100 text-blue-800 border border-blue-200" 
                  : "bg-green-100 text-green-800 border border-green-200"
              }`}>
                {isEditing ? "Mode Édition" : "Mode Création"}
              </div>
            </div>
          </div>
        </div>
        
        {/* Informations supplémentaires */}
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-blue-800">
            <div className="flex-1">
              <p className="font-semibold mb-1">💡 Instructions :</p>
              <p>
                {isEditing 
                  ? "Modifiez les informations nécessaires et sauvegardez vos changements."
                  : "Remplissez tous les champs obligatoires pour créer un nouveau navire."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}