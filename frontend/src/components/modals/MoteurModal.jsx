import React, { useState, useEffect, useRef } from "react";
import { HiX } from "react-icons/hi";
import ConfirmationModal from "./ConfirmationModal";
import { API_BASE_URL } from "../../config/api";

export default function MoteurModal({ isOpen, onClose, moteur, navireId, onSave }) {
    const [formData, setFormData] = useState({
        nom_moteur: "",
        puissance: ""
    });
    const [originalFormData, setOriginalFormData] = useState({
        nom_moteur: "",
        puissance: ""
    });
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const formInitialized = useRef(false);

    // Initialisation du formulaire
    const resetForm = () => {
        if (moteur) {
            setFormData(moteur);
            setOriginalFormData(moteur);
        } else {
            setFormData({
                nom_moteur: "",
                puissance: ""
            });
            setOriginalFormData({
                nom_moteur: "",
                puissance: ""
            });
        }
        setError(null);
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
    }, [moteur, isOpen]);

    // Vérifier les changements non sauvegardés
    useEffect(() => {
        if (formInitialized.current) {
            const hasChanges = 
                formData.nom_moteur !== originalFormData.nom_moteur ||
                formData.puissance !== originalFormData.puissance;
            
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
        
        if (!formData.nom_moteur.trim()) {
            setError("❌ Le nom du moteur est requis.");
            return false;
        }
        if (!formData.puissance.trim()) {
            setError("❌ La puissance est requise.");
            return false;
        }
        
        return true;
    };

    // Ouvre le modal de confirmation au lieu d'appeler l'API
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSaveModalOpen(true);
    };

    // Fonction qui exécute l'appel API après la confirmation
    const handleConfirmSubmit = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setIsSaveModalOpen(false);

        try {
            const isEditing = !!moteur;
            const url = isEditing 
                ? `${API_BASE_URL}/moteurs/${moteur.id}/`
                : `${API_BASE_URL}/moteurs/`;
            
            const method = isEditing ? "PUT" : "POST";
            
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
                const errorMessage = errorData.detail || errorData.nom_moteur?.[0] || "Erreur lors de l'enregistrement.";
                setError(`❌ Échec : ${errorMessage}`);
            }
        } catch (err) {
            setError("❌ Erreur de connexion au serveur.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour confirmer la fermeture avec perte de données
    const confirmClose = () => {
        setIsCloseModalOpen(false);
        forceClose();
    };

    if (!isOpen) return null;

    const isEditing = !!moteur;

    return (
        <>
            {/* ARRIÈRE-PLAN AVEC FLOU */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
                onClick={() => !isSaveModalOpen && handleCloseModal()}
            >
                <div 
                    className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* En-tête */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {isEditing ? "Modifier le moteur" : "Ajouter un moteur"}
                            </h2>
                            <p className="text-slate-600 text-sm mt-1">
                                {isEditing ? "Mettre à jour les informations" : "Nouveau moteur pour le navire"}
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
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                            title="Fermer"
                        >
                            <HiX className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

                        {/* Champs du Formulaire */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nom du moteur *
                                {hasUnsavedChanges && formData.nom_moteur !== originalFormData.nom_moteur && (
                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                        (modifié)
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                name="nom_moteur"
                                required
                                value={formData.nom_moteur}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    hasUnsavedChanges && formData.nom_moteur !== originalFormData.nom_moteur
                                        ? 'border-amber-300'
                                        : 'border-slate-300'
                                }`}
                                placeholder="Ex: Moteur principal"
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Puissance *
                                {hasUnsavedChanges && formData.puissance !== originalFormData.puissance && (
                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                        (modifié)
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                name="puissance"
                                required
                                value={formData.puissance}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    hasUnsavedChanges && formData.puissance !== originalFormData.puissance
                                        ? 'border-amber-300'
                                        : 'border-slate-300'
                                }`}
                                placeholder="Ex: 200 CV"
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!hasUnsavedChanges && isEditing)}
                                className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                                    isSubmitting || (!hasUnsavedChanges && isEditing)
                                        ? 'bg-slate-400 cursor-not-allowed text-white'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                title={!hasUnsavedChanges && isEditing ? "Aucune modification détectée" : ""}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Préparation...
                                    </>
                                ) : isEditing ? "Modifier" : "Ajouter"}
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
                    title={isEditing ? "Modifier le moteur" : "Ajouter un moteur"}
                    message={
                        <div className="space-y-2">
                            <p>
                                {isEditing ? "Confirmez-vous la modification du moteur" : "Confirmez-vous l'ajout du moteur"}
                                <span className="font-bold text-black"> "{formData.nom_moteur}" </span>
                                ?
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="font-medium text-slate-700">Détails :</p>
                                <ul className="text-sm text-slate-600 mt-1 space-y-1">
                                    <li className="flex">
                                        <span className="w-20 font-medium">Nom :</span>
                                        <span className="font-bold text-black">{formData.nom_moteur}</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-20 font-medium">Puissance :</span>
                                        <span className="font-bold text-black">{formData.puissance}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    }
                    confirmButtonText={isEditing ? "Modifier" : "Ajouter"}
                    type={isEditing ? "warning" : "info"}
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
                                {formData.nom_moteur !== originalFormData.nom_moteur && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Nom modifié : <span className="font-bold text-black">{formData.nom_moteur || "(vide)"}</span>
                                        </span>
                                    </p>
                                )}
                                {formData.puissance !== originalFormData.puissance && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Puissance modifiée : <span className="font-bold text-black">{formData.puissance || "(vide)"}</span>
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