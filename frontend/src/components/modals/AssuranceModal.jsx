import React, { useState, useEffect, useRef } from "react";
import { HiPlus, HiPencil, HiX, HiCheck, HiOfficeBuilding, HiCalendar } from "react-icons/hi";
import Select from "react-select";
import axios from "axios";

import AssureurModal from "./AssureurModal"; 
import ConfirmationModal from "./ConfirmationModal";
import { API_BASE_URL } from "../../config/api";

export default function AssuranceModal({ isOpen, onClose, assurance, navireId, onSave }) {
    const [formData, setFormData] = useState({
        assureur_id: "",
        date_debut: "",
        date_fin: ""
    });
    const [originalFormData, setOriginalFormData] = useState({
        assureur_id: "",
        date_debut: "",
        date_fin: ""
    });
    const [assureurs, setAssureurs] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isAssureurModalOpen, setIsAssureurModalOpen] = useState(false);
    
    // États pour les modals de confirmation
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const formInitialized = useRef(false);

    // --- Fonctions de chargement et d'initialisation ---

    const fetchAssureurs = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/assureurs/`);
            setAssureurs(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Erreur chargement assureurs:", err);
            setError("Impossible de charger la liste des assureurs.");
        }
    };

    const resetForm = () => {
        if (assurance) {
            const newFormData = {
                assureur_id: (assurance.assureur?.id || assurance.assureur_id || "").toString(),
                date_debut: assurance.date_debut || "",
                date_fin: assurance.date_fin || ""
            };
            setFormData(newFormData);
            setOriginalFormData(newFormData);
        } else {
            const emptyFormData = {
                assureur_id: "",
                date_debut: "",
                date_fin: ""
            };
            setFormData(emptyFormData);
            setOriginalFormData(emptyFormData);
        }
        setError("");
        setHasUnsavedChanges(false);
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
            fetchAssureurs();
            resetForm();
            formInitialized.current = true;
        }
    }, [assurance, isOpen]);

    // Vérifier les changements non sauvegardés
    useEffect(() => {
        if (formInitialized.current) {
            const hasChanges = 
                formData.assureur_id !== originalFormData.assureur_id ||
                formData.date_debut !== originalFormData.date_debut ||
                formData.date_fin !== originalFormData.date_fin;
            
            setHasUnsavedChanges(hasChanges);
        }
    }, [formData, originalFormData]);

    // --- Gestion des champs et de la sélection ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError("");
    };
    
    const handleAssureurSelectChange = (selectedOption) => {
        const assureurId = selectedOption ? selectedOption.value : "";
        setFormData(prev => ({ ...prev, assureur_id: assureurId }));
        if (error) setError("");
    };

    const assureurOptions = assureurs.map(a => ({
        value: a.id.toString(),
        label: a.nom_assureur + (a.contact_assureur ? ` (${a.contact_assureur})` : ''),
    }));

    const selectedAssureurOption = assureurOptions.find(
        option => option.value === formData.assureur_id
    );
    
    const handleAssureurSuccess = (newAssureurId) => {
        fetchAssureurs().then(() => {
            if (newAssureurId) {
                setFormData(prev => ({ ...prev, assureur_id: newAssureurId.toString() }));
            }
            setIsAssureurModalOpen(false);
        });
    };

    // --- Validation et soumission du formulaire ---
    
    const validateForm = () => {
        setError("");
        
        if (formData.date_debut && formData.date_fin && formData.date_debut > formData.date_fin) {
            setError("❌ La date de fin doit être postérieure ou égale à la date de début.");
            return false;
        }
        if (!formData.assureur_id) {
            setError("❌ Veuillez sélectionner un assureur.");
            return false;
        }
        if (!formData.date_debut) {
            setError("❌ La date de début est requise.");
            return false;
        }
        if (!formData.date_fin) {
            setError("❌ La date de fin est requise.");
            return false;
        }
        
        return true;
    };

    // Fonction pour ouvrir le modal de confirmation avant sauvegarde
    const handleSubmitClick = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Ouvrir le modal de confirmation
        setIsSaveModalOpen(true);
    };

    // Fonction pour exécuter la sauvegarde après confirmation
    const confirmSave = async () => {
        setIsSubmitting(true);
        setIsSaveModalOpen(false);
        
        try {
            const url = assurance 
                ? `${API_BASE_URL}/assurances/${assurance.id}/`
                : `${API_BASE_URL}/assurances/`;
            
            const method = assurance ? "PUT" : "POST";
            
            const requestBody = {
                assureur_id: parseInt(formData.assureur_id),
                navire_id: parseInt(navireId),
                date_debut: formData.date_debut,
                date_fin: formData.date_fin
            };

            const response = await axios({
                method,
                url,
                data: requestBody,
                headers: { "Content-Type": "application/json" }
            });
            
            onSave(response.data);
            onClose();
            
        } catch (err) {
            console.error("Erreur soumission assurance :", err.response?.data || err);
            const errorData = err.response?.data;
            let errorMessage = "Erreur lors de l'enregistrement. Vérifiez les données.";
            
            if (errorData) {
                 errorMessage = Object.values(errorData).flat().join(" ; ");
            }
            setError(`❌ ${errorMessage}`);
            
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour confirmer la fermeture avec perte de données
    const confirmClose = () => {
        setIsCloseModalOpen(false);
        forceClose();
    };

    // Récupérer le nom de l'assureur pour les messages
    const getSelectedAssureurName = () => {
        const assureur = assureurs.find(a => a.id.toString() === formData.assureur_id);
        return assureur ? assureur.nom_assureur : "l'assureur sélectionné";
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                <div 
                    className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* En-tête */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <HiOfficeBuilding className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {assurance ? "Modifier l'assurance" : "Nouvelle assurance"}
                                </h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    {assurance ? "Mettre à jour le contrat" : "Ajouter un nouveau contrat"}
                                </p>
                                {hasUnsavedChanges && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                                            Modifications non sauvegardées
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={handleCloseModal} 
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-150"
                            disabled={isSubmitting}
                            title="Fermer"
                        >
                            <HiX className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                    
                    {/* Formulaire */}
                    <form onSubmit={handleSubmitClick} className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Message d'erreur */}
                        {error && (
                            <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${
                                error.includes("❌") 
                                    ? "bg-red-50 border border-red-200 text-red-700"
                                    : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                            }`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    error.includes("❌") ? "bg-red-600" : "bg-yellow-600"
                                }`}>
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <span className="font-medium">{error.replace(/^[❌⚠️]\s*/, '')}</span>
                            </div>
                        )}
                        
                        {/* Sélection de l'assureur */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-700">
                                Assureur *
                                {hasUnsavedChanges && formData.assureur_id !== originalFormData.assureur_id && (
                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                        (modifié)
                                    </span>
                                )}
                            </label>
                            <div className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <Select
                                        name="assureur_id_select" 
                                        options={assureurOptions}
                                        value={selectedAssureurOption}
                                        onChange={handleAssureurSelectChange}
                                        isClearable
                                        placeholder="Sélectionner un assureur..."
                                        isDisabled={isSubmitting}
                                        styles={{ 
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '3rem',
                                                borderRadius: '0.75rem',
                                                borderColor: hasUnsavedChanges && formData.assureur_id !== originalFormData.assureur_id ? '#f59e0b' : '#e2e8f0',
                                                boxShadow: 'none',
                                                '&:hover': { borderColor: '#3b82f6' },
                                            }),
                                            placeholder: (base) => ({ 
                                                ...base, 
                                                color: '#94a3b8',
                                                fontSize: '0.875rem'
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                borderRadius: '0.75rem',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            })
                                        }}
                                    />
                                </div>
                                
                                {/* Bouton de gestion des assureurs */}
                                <button
                                    type="button"
                                    onClick={() => setIsAssureurModalOpen(true)}
                                    className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors duration-200 flex items-center justify-center"
                                    title="Gérer les assureurs"
                                    disabled={isSubmitting}
                                >
                                    <HiPlus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Date de début */}
                            <div className="space-y-3">
                                <label htmlFor="date_debut" className="block text-sm font-semibold text-slate-700">
                                    Date de début *
                                    {hasUnsavedChanges && formData.date_debut !== originalFormData.date_debut && (
                                        <span className="ml-2 text-xs text-amber-600 font-normal">
                                            (modifié)
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <HiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        id="date_debut"
                                        name="date_debut"
                                        type="date"
                                        required
                                        value={formData.date_debut}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                                            hasUnsavedChanges && formData.date_debut !== originalFormData.date_debut
                                                ? 'border-amber-300'
                                                : 'border-slate-300'
                                        }`}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            
                            {/* Date de fin */}
                            <div className="space-y-3">
                                <label htmlFor="date_fin" className="block text-sm font-semibold text-slate-700">
                                    Date de fin *
                                    {hasUnsavedChanges && formData.date_fin !== originalFormData.date_fin && (
                                        <span className="ml-2 text-xs text-amber-600 font-normal">
                                            (modifié)
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <HiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        id="date_fin"
                                        name="date_fin"
                                        type="date"
                                        required
                                        value={formData.date_fin}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                                            hasUnsavedChanges && formData.date_fin !== originalFormData.date_fin
                                                ? 'border-amber-300'
                                                : 'border-slate-300'
                                        }`}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Pied de page avec boutons */}
                    <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50"
                        >
                            <HiX className="w-4 h-4" />
                            Annuler
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmitClick}
                            disabled={isSubmitting || !hasUnsavedChanges}
                            className={`flex items-center gap-2 px-6 py-2.5 font-semibold rounded-xl transition-all duration-200 ${
                                isSubmitting || !hasUnsavedChanges
                                    ? "bg-slate-400 cursor-not-allowed text-white"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
                            }`}
                            title={!hasUnsavedChanges ? "Aucune modification détectée" : ""}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Enregistrement...
                                </>
                            ) : assurance ? (
                                <>
                                    <HiPencil className="w-4 h-4" />
                                    Modifier
                                </>
                            ) : (
                                <>
                                    <HiPlus className="w-4 h-4" />
                                    Ajouter
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Modal de gestion des Assureurs */}
                <AssureurModal
                    isOpen={isAssureurModalOpen}
                    onClose={() => setIsAssureurModalOpen(false)}
                    onSuccess={handleAssureurSuccess}
                />
            </div>

            {/* Modal de confirmation pour la sauvegarde */}
            {isSaveModalOpen && (
                <ConfirmationModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    onConfirm={confirmSave}
                    title={assurance ? "Modifier l'assurance" : "Ajouter une assurance"}
                    message={
                        <div className="space-y-2">
                            <p>
                                {assurance ? "Confirmez-vous la modification de l'assurance" : "Confirmez-vous l'ajout de l'assurance"} 
                                pour le navire ?
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="font-medium text-slate-700">Détails :</p>
                                <ul className="text-sm text-slate-600 mt-1 space-y-1">
                                    <li className="flex">
                                        <span className="w-24 font-medium">Assureur :</span>
                                        <span className="font-bold text-black">{getSelectedAssureurName()}</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-24 font-medium">Date début :</span>
                                        <span className="font-bold text-black">{formData.date_debut}</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-24 font-medium">Date fin :</span>
                                        <span className="font-bold text-black">{formData.date_fin}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    }
                    confirmButtonText={assurance ? "Modifier" : "Ajouter"}
                    type={assurance ? "warning" : "info"}
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
                                {formData.assureur_id !== originalFormData.assureur_id && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Assureur modifié : <span className="font-bold text-black">{getSelectedAssureurName()}</span>
                                        </span>
                                    </p>
                                )}
                                {formData.date_debut !== originalFormData.date_debut && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Date début modifiée : <span className="font-bold text-black">{formData.date_debut || "(vide)"}</span>
                                        </span>
                                    </p>
                                )}
                                {formData.date_fin !== originalFormData.date_fin && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Date fin modifiée : <span className="font-bold text-black">{formData.date_fin || "(vide)"}</span>
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