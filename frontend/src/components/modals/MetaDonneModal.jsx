import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPlus, FaEdit, FaShip, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import ConfirmationModal from "./ConfirmationModal";
import { API_BASE_URL } from "../../config/api";

// --- Définition des Types de Métadonnées (TEXTE fusionné) ---
const META_TYPES = [
    { value: 'TEXTE', label: 'Texte (Court ou Long)' },
    { value: 'NOMBRE', label: 'Nombre (Entier ou Décimal)' },
    { value: 'DATE', label: 'Date' },
    { value: 'HEURE', label: 'Heure' },
    { value: 'BOOLEEN', label: 'Vrai/Faux' },
    { value: 'URL', label: 'Lien Internet (URL)' },
    { value: 'FICHIER', label: 'Fichier (Document)' },
    { value: 'IMAGE', label: 'Image' },
];

// Constante pour l'URL complète des métadonnées
const META_DONNEES_URL = `${API_BASE_URL}/meta_donnees/`;

// ====================================================================
// Composant interne pour le champ de saisie de la VALEUR dynamique
// ====================================================================

/**
 * Affiche le champ de saisie adapté au type de métadonnée.
 */
const ValueInput = ({ type, value, onChange, isSubmitting, hasUnsavedChanges, originalValue }) => {
    // Styles de base pour les inputs
    const baseClass = `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed ${
        hasUnsavedChanges && value !== originalValue
            ? 'border-amber-300'
            : 'border-slate-300'
    }`;

    // Fonction pour gérer le changement de valeur
    const handleInputChange = (e) => {
        onChange({
            target: {
                name: 'valeur_meta_donne',
                value: e.target.value
            }
        });
    };

    // Fonction pour gérer le changement de fichier
    const handleFileChange = (e) => {
        onChange({
            target: {
                name: 'valeur_meta_donne',
                value: e.target.files[0] || ""
            }
        });
    };

    switch (type) {
        case 'TEXTE':
            return (
                <textarea
                    value={value || ""}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className={`${baseClass} resize-none`}
                    disabled={isSubmitting}
                    placeholder="Saisissez votre texte ici..."
                />
            );
        
        case 'URL':
            return (
                <input
                    type="url"
                    value={value || ""}
                    onChange={handleInputChange}
                    required
                    className={baseClass}
                    disabled={isSubmitting}
                    placeholder="https://exemple.com"
                />
            );

        case 'HEURE':
            return (
                <input
                    type="time"
                    value={value || ""}
                    onChange={handleInputChange}
                    required
                    className={baseClass}
                    disabled={isSubmitting}
                />
            );

        case 'NOMBRE':
            return (
                <input
                    type="number"
                    step="any"
                    value={value || ""}
                    onChange={handleInputChange}
                    required
                    className={baseClass}
                    disabled={isSubmitting}
                    placeholder="0"
                />
            );

        case 'DATE':
            return (
                <input
                    type="date"
                    value={value || ""}
                    onChange={handleInputChange}
                    required
                    className={baseClass}
                    disabled={isSubmitting}
                />
            );
            
        case 'BOOLEEN':
            return (
                <label className="flex items-center space-x-3 py-2">
                    <input 
                        type="checkbox" 
                        checked={value === "True" || value === true} 
                        onChange={(e) => onChange({ 
                            target: { 
                                name: 'valeur_meta_donne', 
                                value: e.target.checked ? "True" : "False" 
                            } 
                        })}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                        disabled={isSubmitting}
                    />
                    <span className="text-base text-slate-700 font-medium">
                        {value === "True" || value === true ? "Oui (Actif)" : "Non (Inactif)"}
                    </span>
                </label>
            );

        case 'FICHIER':
        case 'IMAGE':
            const accept = type === 'IMAGE' ? 'image/*' : '*/*';
            return (
                <div className="space-y-2">
                    {value && value !== 'Fichier en attente' && !(value instanceof File) && (
                        <p className="text-sm text-slate-600 truncate">
                            Fichier actuel : <span className="font-semibold">
                                {typeof value === 'string' ? value.split('/').pop() : value?.name || "Fichier"}
                            </span>
                        </p>
                    )}
                    {value instanceof File && (
                        <p className="text-sm text-green-600 truncate">
                            Nouveau fichier sélectionné : <span className="font-semibold">{value.name}</span>
                        </p>
                    )}
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className={`${baseClass} file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer`}
                        disabled={isSubmitting}
                    />
                </div>
            );

        default:
            return (
                <input
                    type="text"
                    value={value || ""}
                    onChange={handleInputChange}
                    required={!type}
                    className={`${baseClass} bg-slate-50 italic`}
                    placeholder="Veuillez d'abord sélectionner un Type de donnée"
                    disabled={isSubmitting || !type}
                />
            );
    }
};

// ====================================================================
// Composant principal MetaDonneModal
// ====================================================================

export default function MetaDonneModal({ isOpen, onClose, metaDonne, navireId, onSave }) {
    const [formData, setFormData] = useState({
        type_meta_donne: "",
        nom_meta_donne: "",
        valeur_meta_donne: ""
    });
    const [originalFormData, setOriginalFormData] = useState({
        type_meta_donne: "",
        nom_meta_donne: "",
        valeur_meta_donne: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    
    // États pour les modals de confirmation
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const formInitialized = useRef(false);

    const resetForm = () => {
        if (metaDonne && typeof metaDonne === 'object') {
            try {
                const initialValue = metaDonne.valeur_meta_donne != null 
                    ? String(metaDonne.valeur_meta_donne)
                    : "";
                    
                const newFormData = {
                    type_meta_donne: metaDonne.type_meta_donne || "",
                    nom_meta_donne: metaDonne.nom_meta_donne || "",
                    valeur_meta_donne: initialValue
                };
                
                setFormData(newFormData);
                setOriginalFormData(newFormData);
            } catch (error) {
                console.error("Erreur lors de l'initialisation du formulaire:", error);
                const emptyFormData = {
                    type_meta_donne: "",
                    nom_meta_donne: "",
                    valeur_meta_donne: ""
                };
                setFormData(emptyFormData);
                setOriginalFormData(emptyFormData);
            }
        } else {
            const emptyFormData = {
                type_meta_donne: "",
                nom_meta_donne: "",
                valeur_meta_donne: ""
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
    }, [metaDonne, isOpen]);

    // Vérifier les changements non sauvegardés
    useEffect(() => {
        if (formInitialized.current) {
            const hasChanges = 
                formData.type_meta_donne !== originalFormData.type_meta_donne ||
                formData.nom_meta_donne !== originalFormData.nom_meta_donne ||
                formData.valeur_meta_donne !== originalFormData.valeur_meta_donne;
            
            setHasUnsavedChanges(hasChanges);
        }
    }, [formData, originalFormData]);

    // Gestion centralisée des changements de formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'type_meta_donne') {
            setFormData(prev => ({
                ...prev,
                type_meta_donne: value,
                valeur_meta_donne: "", 
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        if (error) setError("");
    };

    // Validation du formulaire
    const validateForm = () => {
        setError("");
        
        if (!formData.type_meta_donne) {
            setError("❌ Le type de donnée est requis.");
            return false;
        }
        
        if (!formData.nom_meta_donne.trim()) {
            setError("❌ Le nom de la métadonnée est requis.");
            return false;
        }
        
        const isFileOrImage = formData.type_meta_donne === 'FICHIER' || formData.type_meta_donne === 'IMAGE';
        const isValueProvided = isFileOrImage 
            ? true 
            : (formData.valeur_meta_donne !== "" && formData.valeur_meta_donne != null);
        
        if (!isValueProvided) {
            setError("❌ La valeur est requise pour ce type de donnée.");
            return false;
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
        setError("");

        const { type_meta_donne, nom_meta_donne, valeur_meta_donne } = formData;
        
        try {
            const url = metaDonne && metaDonne.id
                ? `${META_DONNEES_URL}${metaDonne.id}/`
                : META_DONNEES_URL;
            
            const method = metaDonne ? "PUT" : "POST";
            
            let requestData;
            let headers = { "Content-Type": "application/json" };
            
            // 1. Gestion des fichiers (Multipart/form-data)
            if (valeur_meta_donne instanceof File) {
                requestData = new FormData();
                requestData.append('type_meta_donne', type_meta_donne);
                requestData.append('nom_meta_donne', nom_meta_donne);
                requestData.append('valeur_meta_donne', valeur_meta_donne);
                requestData.append('navire', navireId);
                headers = {}; 
                
            } else {
                // 2. Gestion des données JSON standard
                requestData = {
                    type_meta_donne,
                    nom_meta_donne,
                    valeur_meta_donne: valeur_meta_donne, 
                    navire: navireId
                };
            }

            const response = await axios({
                method,
                url,
                data: requestData,
                headers: headers
            });

            if (response.status === 200 || response.status === 201) {
                onSave(response.data);
                onClose();
            } else {
                setError("❌ Erreur lors de l'enregistrement. Code: " + response.status);
            }
            
        } catch (err) {
            console.error("Erreur de soumission:", err.response?.data || err);
            const errorData = err.response?.data;
            let errorMessage = "❌ Erreur réseau ou du serveur.";
            
            if (errorData) {
                if (typeof errorData === 'object') {
                    errorMessage = `❌ ${Object.values(errorData).flat().join(" ; ")}`;
                } else if (typeof errorData === 'string') {
                    errorMessage = `❌ ${errorData}`;
                }
            }
            setError(errorMessage);
            
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour confirmer la fermeture
    const confirmClose = () => {
        setIsCloseModalOpen(false);
        forceClose();
    };

    // Obtenir le label du type de métadonnée
    const getTypeLabel = (typeValue) => {
        const type = META_TYPES.find(t => t.value === typeValue);
        return type ? type.label : "Non spécifié";
    };

    // Format de la valeur pour l'affichage
    const formatValueForDisplay = (value, type) => {
        if (value instanceof File) {
            return `Fichier: ${value.name}`;
        }
        
        if (type === 'BOOLEEN') {
            return value === "True" || value === true ? "Oui" : "Non";
        }
        
        return value || "(vide)";
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                <div 
                    className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* En-tête */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gray-50 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <FaShip className="w-5 h-5 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {metaDonne ? "Modifier la métadonnée" : "Ajouter une métadonnée"}
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    Info personnalisée pour le Navire ID: {navireId}
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
                            className="text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded-lg hover:bg-slate-100"
                            disabled={isSubmitting}
                            title="Fermer"
                        >
                            <FaTimes className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Formulaire */}
                    <form onSubmit={handleSubmitClick} className="p-6 space-y-6">
                        {/* Message d'erreur */}
                        {error && (
                            <div className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 ${
                                error.includes("❌") 
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : "bg-yellow-50 border-yellow-200 text-yellow-700"
                            }`}>
                                <FaExclamationTriangle className="w-4 h-4" /> 
                                {error.replace(/^[❌⚠️]\s*/, '')}
                            </div>
                        )}

                        {/* 1. Sélection du Type */}
                        <div>
                            <label htmlFor="type_meta_donne" className="block text-sm font-medium text-slate-700 mb-2">
                                Type de donnée *
                                {hasUnsavedChanges && formData.type_meta_donne !== originalFormData.type_meta_donne && (
                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                        (modifié)
                                    </span>
                                )}
                            </label>
                            <select
                                id="type_meta_donne"
                                name="type_meta_donne"
                                required
                                value={formData.type_meta_donne || ""}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    hasUnsavedChanges && formData.type_meta_donne !== originalFormData.type_meta_donne
                                        ? 'border-amber-300'
                                        : 'border-slate-300'
                                }`}
                                disabled={isSubmitting}
                            >
                                <option value="">-- Sélectionner un Type --</option>
                                {META_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Nom/Clé de la Métadonnée */}
                        <div>
                            <label htmlFor="nom_meta_donne" className="block text-sm font-medium text-slate-700 mb-2">
                                Nom (Clé) de la métadonnée *
                                {hasUnsavedChanges && formData.nom_meta_donne !== originalFormData.nom_meta_donne && (
                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                        (modifié)
                                    </span>
                                )}
                            </label>
                            <input
                                id="nom_meta_donne"
                                name="nom_meta_donne"
                                type="text"
                                required
                                value={formData.nom_meta_donne || ""}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                    hasUnsavedChanges && formData.nom_meta_donne !== originalFormData.nom_meta_donne
                                        ? 'border-amber-300'
                                        : 'border-slate-300'
                                }`}
                                placeholder="Ex: Pression_Max_Moteur, Certificat_Validite..."
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        {/* 3. Champ de Valeur DYNAMIQUE */}
                        <div>
                            <label htmlFor="valeur_meta_donne_input" className="block text-sm font-medium text-slate-700 mb-2">
                                Valeur *
                                {hasUnsavedChanges && formData.valeur_meta_donne !== originalFormData.valeur_meta_donne && (
                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                        (modifiée)
                                    </span>
                                )}
                            </label>
                            <ValueInput
                                type={formData.type_meta_donne}
                                value={formData.valeur_meta_donne}
                                onChange={handleChange}
                                isSubmitting={isSubmitting}
                                hasUnsavedChanges={hasUnsavedChanges}
                                originalValue={originalFormData.valeur_meta_donne}
                            />
                        </div>
                        
                        {/* Boutons d'action */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={isSubmitting}
                                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                            >
                                <FaTimes className="w-4 h-4" />
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!hasUnsavedChanges && metaDonne)}
                                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                                    isSubmitting || (!hasUnsavedChanges && metaDonne)
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                                }`}
                                title={!hasUnsavedChanges && metaDonne ? "Aucune modification détectée" : ""}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin h-4 w-4" />
                                        Enregistrement...
                                    </>
                                ) : metaDonne ? (
                                    <>
                                        <FaEdit className="w-4 h-4" />
                                        Modifier
                                    </>
                                ) : (
                                    <>
                                        <FaPlus className="w-4 h-4" />
                                        Ajouter
                                    </>
                                )}
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
                    title={metaDonne ? "Modifier la métadonnée" : "Ajouter une métadonnée"}
                    message={
                        <div className="space-y-2">
                            <p>
                                {metaDonne ? "Confirmez-vous la modification de la métadonnée" : "Confirmez-vous l'ajout de la métadonnée"}
                                <span className="font-bold text-black"> "{formData.nom_meta_donne}" </span>
                                ?
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="font-medium text-slate-700">Détails :</p>
                                <ul className="text-sm text-slate-600 mt-1 space-y-1">
                                    <li className="flex">
                                        <span className="w-24 font-medium">Type :</span>
                                        <span className="font-bold text-black">{getTypeLabel(formData.type_meta_donne)}</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-24 font-medium">Nom :</span>
                                        <span className="font-bold text-black">{formData.nom_meta_donne}</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-24 font-medium">Valeur :</span>
                                        <span className="font-bold text-black">
                                            {formatValueForDisplay(formData.valeur_meta_donne, formData.type_meta_donne)}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    }
                    confirmButtonText={metaDonne ? "Modifier" : "Ajouter"}
                    type={metaDonne ? "warning" : "info"}
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
                                {formData.type_meta_donne !== originalFormData.type_meta_donne && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Type modifié : <span className="font-bold text-black">{getTypeLabel(formData.type_meta_donne)}</span>
                                        </span>
                                    </p>
                                )}
                                {formData.nom_meta_donne !== originalFormData.nom_meta_donne && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Nom modifié : <span className="font-bold text-black">{formData.nom_meta_donne || "(vide)"}</span>
                                        </span>
                                    </p>
                                )}
                                {formData.valeur_meta_donne !== originalFormData.valeur_meta_donne && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Valeur modifiée : <span className="font-bold text-black">
                                                {formatValueForDisplay(formData.valeur_meta_donne, formData.type_meta_donne)}
                                            </span>
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