import React, { useState, useEffect, useRef } from "react";
import { HiX } from "react-icons/hi";
import ConfirmationModal from "./ConfirmationModal";
import { API_BASE_URL } from "../../config/api";

export default function DossierModal({ isOpen, onClose, dossier, navireId, onSave }) {
  const [formData, setFormData] = useState({
    type_dossier: "",
    date_emission: "",
    date_expiration: ""
  });
  const [originalFormData, setOriginalFormData] = useState({
    type_dossier: "",
    date_emission: "",
    date_expiration: ""
  });
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const formInitialized = useRef(false);

  const resetForm = () => {
    if (dossier) {
      const newFormData = {
        type_dossier: dossier.type_dossier || "",
        date_emission: dossier.date_emission || "",
        date_expiration: dossier.date_expiration || ""
      };
      setFormData(newFormData);
      setOriginalFormData(newFormData);
    } else {
      const emptyFormData = {
        type_dossier: "",
        date_emission: "",
        date_expiration: ""
      };
      setFormData(emptyFormData);
      setOriginalFormData(emptyFormData);
    }
    setError("");
    setHasUnsavedChanges(false);
    formInitialized.current = false;
  };

  const handleCloseModal = () => {
    // Vérifier s'il y a des changements non sauvegardés
    if (hasUnsavedChanges) {
      setIsCloseModalOpen(true);
      return;
    }
    onClose();
  };

  const forceClose = () => {
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      formInitialized.current = true;
    }
  }, [dossier, isOpen]);

  // Vérifier les changements non sauvegardés
  useEffect(() => {
    if (formInitialized.current) {
      const hasChanges = 
        formData.type_dossier !== originalFormData.type_dossier ||
        formData.date_emission !== originalFormData.date_emission ||
        formData.date_expiration !== originalFormData.date_expiration;
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, originalFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Validation du formulaire
  const validateForm = () => {
    setError("");
    
    if (!formData.type_dossier.trim()) {
      setError("❌ Le type de dossier est requis.");
      return false;
    }
    
    if (!formData.date_emission) {
      setError("❌ La date d'émission est requise.");
      return false;
    }
    
    // Vérifier que la date d'expiration est après la date d'émission si fournie
    if (formData.date_emission && formData.date_expiration) {
      const dateEmission = new Date(formData.date_emission);
      const dateExpiration = new Date(formData.date_expiration);
      
      if (dateExpiration <= dateEmission) {
        setError("❌ La date d'expiration doit être postérieure à la date d'émission.");
        return false;
      }
    }
    
    return true;
  };

  // Ouverture du modal de confirmation avant sauvegarde
  const handleSubmitClick = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaveModalOpen(true);
  };

  // Fonction pour exécuter la sauvegarde après confirmation
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setIsSaveModalOpen(false);

    try {
      const url = dossier 
        ? `${API_BASE_URL}/dossiers/${dossier.id}/`
        : `${API_BASE_URL}/dossiers/`;
      
      const method = dossier ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          navire: navireId
        }),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || errorData.type_dossier?.[0] || "Erreur lors de l'enregistrement.";
        setError(`❌ Échec : ${errorMessage}`);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("❌ Erreur de connexion au serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour confirmer la fermeture
  const confirmClose = () => {
    setIsCloseModalOpen(false);
    forceClose();
  };

  // Formater une date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return "(non spécifiée)";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
        <div 
          className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {dossier ? "Modifier le dossier" : "Ajouter un dossier"}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {dossier ? "Mettre à jour les informations" : "Nouveau dossier pour le navire"}
              </p>
              {hasUnsavedChanges && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    Modifications non sauvegardées
                  </span>
                </div>
              )}
            </div>
            <button 
              onClick={handleCloseModal} 
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Fermer"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmitClick} className="p-6 space-y-6">
            {/* Message d'erreur */}
            {error && (
              <div className={`p-3 border rounded-xl font-medium text-sm ${
                error.includes("❌") 
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700"
              }`}>
                {error}
              </div>
            )}

            {/* Type de dossier */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type de dossier *
                {hasUnsavedChanges && formData.type_dossier !== originalFormData.type_dossier && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (modifié)
                  </span>
                )}
              </label>
              <input
                type="text"
                name="type_dossier"
                required
                value={formData.type_dossier}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  hasUnsavedChanges && formData.type_dossier !== originalFormData.type_dossier
                    ? 'border-amber-300'
                    : 'border-slate-300'
                }`}
                placeholder="Ex: Permis de navigation, Certificat, Assurance..."
                disabled={isSubmitting}
              />
            </div>
            
            {/* Date d'émission */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date d'émission *
                {hasUnsavedChanges && formData.date_emission !== originalFormData.date_emission && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (modifiée)
                  </span>
                )}
              </label>
              <input
                type="date"
                name="date_emission"
                required
                value={formData.date_emission}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  hasUnsavedChanges && formData.date_emission !== originalFormData.date_emission
                    ? 'border-amber-300'
                    : 'border-slate-300'
                }`}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Date d'expiration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date d'expiration
                {hasUnsavedChanges && formData.date_expiration !== originalFormData.date_expiration && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (modifiée)
                  </span>
                )}
              </label>
              <input
                type="date"
                name="date_expiration"
                value={formData.date_expiration || ""}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  hasUnsavedChanges && formData.date_expiration !== originalFormData.date_expiration
                    ? 'border-amber-300'
                    : 'border-slate-300'
                }`}
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-500 mt-1">
                Optionnel - laisser vide si non applicable
              </p>
            </div>
            
            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!hasUnsavedChanges && dossier)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isSubmitting || (!hasUnsavedChanges && dossier)
                    ? "bg-slate-400 cursor-not-allowed text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title={!hasUnsavedChanges && dossier ? "Aucune modification détectée" : ""}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Enregistrement...
                  </>
                ) : dossier ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de confirmation pour la sauvegarde */}
      {isSaveModalOpen && (
        <ConfirmationModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onConfirm={handleConfirmSubmit}
          title={dossier ? "Modifier le dossier" : "Ajouter un dossier"}
          message={
            <div className="space-y-2">
              <p>
                {dossier ? "Confirmez-vous la modification du dossier" : "Confirmez-vous l'ajout du dossier"}
                <span className="font-bold text-black"> "{formData.type_dossier}" </span>
                ?
              </p>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-medium text-slate-700">Détails :</p>
                <ul className="text-sm text-slate-600 mt-1 space-y-1">
                  <li className="flex">
                    <span className="w-28 font-medium">Type :</span>
                    <span className="font-bold text-black">{formData.type_dossier}</span>
                  </li>
                  <li className="flex">
                    <span className="w-28 font-medium">Émission :</span>
                    <span className="font-bold text-black">{formatDate(formData.date_emission)}</span>
                  </li>
                  <li className="flex">
                    <span className="w-28 font-medium">Expiration :</span>
                    <span className="font-bold text-black">{formatDate(formData.date_expiration)}</span>
                  </li>
                </ul>
              </div>
            </div>
          }
          confirmButtonText={dossier ? "Modifier" : "Ajouter"}
          type={dossier ? "warning" : "info"}
          isLoading={isSubmitting}
          disableConfirm={isSubmitting}
          cancelButtonText="Annuler"
        />
      )}

      {/* Modal de confirmation pour fermer avec modifications non sauvegardées */}
      {isCloseModalOpen && (
        <ConfirmationModal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          onConfirm={confirmClose}
          title="Modifications non sauvegardées"
          message={
            <div>
              <p className="mb-2">Vous avez des modifications non sauvegardées :</p>
              <div className="bg-slate-50 p-3 rounded-lg mb-3 space-y-1">
                {formData.type_dossier !== originalFormData.type_dossier && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Type modifié : <span className="font-bold text-black">{formData.type_dossier || "(vide)"}</span>
                    </span>
                  </p>
                )}
                {formData.date_emission !== originalFormData.date_emission && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Date émission modifiée : <span className="font-bold text-black">{formatDate(formData.date_emission)}</span>
                    </span>
                  </p>
                )}
                {formData.date_expiration !== originalFormData.date_expiration && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Date expiration modifiée : <span className="font-bold text-black">{formatDate(formData.date_expiration)}</span>
                    </span>
                  </p>
                )}
              </div>
              <p className="mt-2 text-gray-600">Voulez-vous vraiment fermer et perdre ces modifications ?</p>
            </div>
          }
          confirmButtonText="Fermer sans sauvegarder"
          type="danger"
          cancelButtonText="Continuer l'édition"
        />
      )}
    </>
  );
}