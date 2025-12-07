import React, { useState, useEffect, useRef } from "react";
import { HiX } from "react-icons/hi";
import ConfirmationModal from "./ConfirmationModal";
import { API_BASE_URL } from "../../config/api";

export default function VisiteModal({ isOpen, onClose, visite, navireId, onSave }) {
  const [formData, setFormData] = useState({
    date_visite: "",
    expiration_permis: "",
    lieu_visite: ""
  });
  const [originalFormData, setOriginalFormData] = useState({
    date_visite: "",
    expiration_permis: "",
    lieu_visite: ""
  });
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const formInitialized = useRef(false);

  const resetForm = () => {
    if (visite) {
      const newFormData = {
        date_visite: visite.date_visite || "",
        expiration_permis: visite.expiration_permis || "",
        lieu_visite: visite.lieu_visite || ""
      };
      setFormData(newFormData);
      setOriginalFormData(newFormData);
    } else {
      const emptyFormData = {
        date_visite: "",
        expiration_permis: "",
        lieu_visite: ""
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
  }, [visite, isOpen]);

  // Vérifier les changements non sauvegardés
  useEffect(() => {
    if (formInitialized.current) {
      const hasChanges = 
        formData.date_visite !== originalFormData.date_visite ||
        formData.expiration_permis !== originalFormData.expiration_permis ||
        formData.lieu_visite !== originalFormData.lieu_visite;
      
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
    
    if (!formData.date_visite) {
      setError("❌ La date de visite est requise.");
      return false;
    }
    
    if (!formData.expiration_permis) {
      setError("❌ La date d'expiration du permis est requise.");
      return false;
    }
    
    if (!formData.lieu_visite.trim()) {
      setError("❌ Le lieu de visite est requis.");
      return false;
    }
    
    // Vérifier que la date d'expiration est après la date de visite
    if (formData.date_visite && formData.expiration_permis) {
      const dateVisite = new Date(formData.date_visite);
      const dateExpiration = new Date(formData.expiration_permis);
      
      if (dateExpiration <= dateVisite) {
        setError("❌ La date d'expiration doit être postérieure à la date de visite.");
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
      const url = visite 
        ? `${API_BASE_URL}/visites/${visite.id}/`
        : `${API_BASE_URL}/visites/`;
      
      const method = visite ? "PUT" : "POST";
      
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
        const errorMessage = errorData.detail || errorData.date_visite?.[0] || "Erreur lors de l'enregistrement.";
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
    if (!dateString) return "(vide)";
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
                {visite ? "Modifier la visite" : "Ajouter une visite"}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {visite ? "Mettre à jour les informations" : "Nouvelle visite pour le navire"}
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

            {/* Date de visite */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date de visite *
                {hasUnsavedChanges && formData.date_visite !== originalFormData.date_visite && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (modifiée)
                  </span>
                )}
              </label>
              <input
                type="date"
                name="date_visite"
                required
                value={formData.date_visite}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  hasUnsavedChanges && formData.date_visite !== originalFormData.date_visite
                    ? 'border-amber-300'
                    : 'border-slate-300'
                }`}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Date d'expiration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expiration du permis *
                {hasUnsavedChanges && formData.expiration_permis !== originalFormData.expiration_permis && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (modifiée)
                  </span>
                )}
              </label>
              <input
                type="date"
                name="expiration_permis"
                required
                value={formData.expiration_permis}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  hasUnsavedChanges && formData.expiration_permis !== originalFormData.expiration_permis
                    ? 'border-amber-300'
                    : 'border-slate-300'
                }`}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Lieu de visite */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lieu de visite *
                {hasUnsavedChanges && formData.lieu_visite !== originalFormData.lieu_visite && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (modifié)
                  </span>
                )}
              </label>
              <input
                type="text"
                name="lieu_visite"
                required
                value={formData.lieu_visite}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  hasUnsavedChanges && formData.lieu_visite !== originalFormData.lieu_visite
                    ? 'border-amber-300'
                    : 'border-slate-300'
                }`}
                placeholder="Ex: Port de Toamasina"
                disabled={isSubmitting}
              />
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
                disabled={isSubmitting || (!hasUnsavedChanges && visite)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isSubmitting || (!hasUnsavedChanges && visite)
                    ? "bg-slate-400 cursor-not-allowed text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title={!hasUnsavedChanges && visite ? "Aucune modification détectée" : ""}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Enregistrement...
                  </>
                ) : visite ? "Modifier" : "Ajouter"}
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
          title={visite ? "Modifier la visite" : "Ajouter une visite"}
          message={
            <div className="space-y-2">
              <p>
                {visite ? "Confirmez-vous la modification de la visite" : "Confirmez-vous l'ajout de la visite"}
                au <span className="font-bold text-black">{formData.lieu_visite}</span> ?
              </p>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-medium text-slate-700">Détails :</p>
                <ul className="text-sm text-slate-600 mt-1 space-y-1">
                  <li className="flex">
                    <span className="w-28 font-medium">Date visite :</span>
                    <span className="font-bold text-black">{formatDate(formData.date_visite)}</span>
                  </li>
                  <li className="flex">
                    <span className="w-28 font-medium">Expiration :</span>
                    <span className="font-bold text-black">{formatDate(formData.expiration_permis)}</span>
                  </li>
                  <li className="flex">
                    <span className="w-28 font-medium">Lieu :</span>
                    <span className="font-bold text-black">{formData.lieu_visite}</span>
                  </li>
                </ul>
              </div>
            </div>
          }
          confirmButtonText={visite ? "Modifier" : "Ajouter"}
          type={visite ? "warning" : "info"}
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
                {formData.date_visite !== originalFormData.date_visite && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Date visite modifiée : <span className="font-bold text-black">{formatDate(formData.date_visite)}</span>
                    </span>
                  </p>
                )}
                {formData.expiration_permis !== originalFormData.expiration_permis && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Date expiration modifiée : <span className="font-bold text-black">{formatDate(formData.expiration_permis)}</span>
                    </span>
                  </p>
                )}
                {formData.lieu_visite !== originalFormData.lieu_visite && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Lieu modifié : <span className="font-bold text-black">{formData.lieu_visite || "(vide)"}</span>
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