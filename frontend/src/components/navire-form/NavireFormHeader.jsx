import { FaArrowLeft, FaShip, FaExclamationTriangle } from "react-icons/fa";

export default function NavireFormHeader({ 
  isEditing, 
  navigate, 
  hasUnsavedChanges = false,
  navireId = null 
}) {
  
  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      if (confirm("Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?")) {
        if (isEditing && navireId) {
          navigate(`/navires/${navireId}`);
        } else {
          navigate("/navires");
        }
      }
    } else {
      // Redirection directe
      if (isEditing && navireId) {
        navigate(`/navires/${navireId}`);
      } else {
        navigate("/navires");
      }
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-3 text-blue-700 hover:text-blue-900 font-semibold transition-colors duration-200 group"
        >
          <div className={`p-2 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200 ${
            hasUnsavedChanges 
              ? "bg-amber-100 border border-amber-300" 
              : "bg-white"
          }`}>
            <FaArrowLeft className={`text-sm ${
              hasUnsavedChanges ? "text-amber-600" : "text-blue-600"
            }`} />
          </div>
          <span>
            {hasUnsavedChanges ? "Retour (modifications)" : "Retour"}
          </span>
        </button>
        
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-4 rounded-2xl shadow-lg ${
            hasUnsavedChanges
              ? "bg-gradient-to-r from-amber-500 to-amber-600"
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          }`}>
            <FaShip className="text-2xl text-white" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? "Modifier le Navire" : "Nouveau Navire"}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-blue-600 font-medium">
                    {isEditing 
                      ? "Modifiez les informations du navire" 
                      : "Ajoutez un nouveau navire à la flotte"
                    }
                  </p>
                  
                  {/* Indicateur de modifications non sauvegardées */}
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                      <FaExclamationTriangle className="text-xs" />
                      <span>Modifications non sauvegardées</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Indicateur de mode */}
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                isEditing 
                  ? hasUnsavedChanges
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-green-100 text-green-800 border border-green-200"
              }`}>
                {isEditing 
                  ? hasUnsavedChanges ? "Édition (modifié)" : "Mode Édition"
                  : "Mode Création"
                }
              </div>
            </div>
          </div>
        </div>
        
        {/* Informations supplémentaires */}
        <div className={`mt-4 p-4 rounded-xl border ${
          hasUnsavedChanges
            ? "bg-amber-50 border-amber-200"
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className={`text-sm ${
            hasUnsavedChanges ? "text-amber-800" : "text-blue-800"
          }`}>
            <p className="font-semibold mb-1">
              {hasUnsavedChanges ? "⚠️ Attention :" : "💡 Instructions :"}
            </p>
            <p>
              {hasUnsavedChanges
                ? "Vous avez des modifications non sauvegardées. Enregistrez vos changements avant de quitter."
                : isEditing 
                  ? "Modifiez les informations nécessaires et sauvegardez vos changements."
                  : "Remplissez tous les champs obligatoires pour créer un nouveau navire."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}