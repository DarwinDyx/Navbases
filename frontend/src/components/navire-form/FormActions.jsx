import { FaTimes, FaSave, FaEdit, FaExclamationTriangle } from "react-icons/fa";

export default function FormActions({ 
  isLoading, 
  isEditing, 
  onCancel, 
  onSubmit,
  hasValidationErrors = false,
  validationMessage = "",
  hasUnsavedChanges = false  // Nouvelle prop
}) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
      {/* Indicateur de modifications non sauvegardées */}
      {hasUnsavedChanges && !hasValidationErrors && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-3">
          <FaExclamationTriangle className="text-amber-600" />
          <div>
            <p className="font-medium">Modifications non sauvegardées</p>
            <p className="text-sm mt-1">
              Vous avez des modifications non sauvegardées. 
              {isEditing ? " Enregistrez pour sauvegarder vos modifications." : " Enregistrez pour créer le navire."}
            </p>
          </div>
        </div>
      )}
      
      {hasValidationErrors && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl flex items-center gap-3">
          <FaExclamationTriangle className="text-yellow-600" />
          <div>
            <p className="font-medium">{validationMessage}</p>
            <p className="text-sm mt-1">Veuillez corriger les erreurs avant de continuer.</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-end gap-6">
        <button
          type="button"
          onClick={onCancel}
          className={`px-10 py-4 border-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 hover:shadow-lg ${
            hasUnsavedChanges
              ? "border-amber-400 text-amber-700 hover:bg-amber-50"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <FaTimes className="text-sm" />
          {hasUnsavedChanges ? "Annuler (modifications)" : "Annuler"}
        </button>
        
        <button
          type="submit"
          onClick={onSubmit}
          disabled={isLoading || hasValidationErrors}
          className={`px-10 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 ${
            isLoading || hasValidationErrors
              ? "bg-gray-400 cursor-not-allowed text-white"
              : hasUnsavedChanges
              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          }`}
          title={hasValidationErrors ? "Des erreurs doivent être corrigées" : ""}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enregistrement...
            </>
          ) : isEditing ? (
            <>
              <FaEdit className="text-sm" />
              {hasUnsavedChanges ? "Sauvegarder" : "Modifier le Navire"}
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