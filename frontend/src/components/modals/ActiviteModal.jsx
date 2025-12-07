import React, { useState, useEffect, useRef } from "react";
import { FaList, FaPlus, FaEdit, FaTrash, FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import ConfirmationModal from "./ConfirmationModal";
import { API_BASE_URL } from "../../config/api";

const ActiviteModal = ({ isOpen, onClose, onSuccess }) => {
    const [activites, setActivites] = useState([]);
    const [formData, setFormData] = useState({ nom_activite: "" });
    const [originalFormData, setOriginalFormData] = useState({ nom_activite: "" });
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    
    // États pour les modals de confirmation
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isCancelEditModalOpen, setIsCancelEditModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Référence pour suivre si le formulaire a été modifié
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const formInitialized = useRef(false);

    const ACTIVITES_URL = `${API_BASE_URL}/activites/`;

    // --- Fonctions de base ---

    const fetchActivites = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(ACTIVITES_URL);
            const data = await res.json();
            setActivites(data);
            setError(null);
        } catch (err) {
            setError("Impossible de charger la liste des activités.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ nom_activite: "" });
        setOriginalFormData({ nom_activite: "" });
        setEditingId(null);
        setError(null);
        setHasUnsavedChanges(false);
        formInitialized.current = false;
    };

    const resetAndClose = () => {
        // Vérifier s'il y a des changements non sauvegardés
        if (hasUnsavedChanges || (editingId && formData.nom_activite !== originalFormData.nom_activite)) {
            setIsCloseModalOpen(true);
            return;
        }
        
        resetForm();
        onClose();
    };

    const forceClose = () => {
        resetForm();
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            fetchActivites();
            resetForm();
            formInitialized.current = true;
        }
    }, [isOpen]);

    // Vérifier les changements non sauvegardés
    useEffect(() => {
        if (formInitialized.current) {
            const hasChanges = editingId 
                ? formData.nom_activite !== originalFormData.nom_activite
                : formData.nom_activite.trim() !== "";
            
            setHasUnsavedChanges(hasChanges);
        }
    }, [formData.nom_activite, editingId, originalFormData.nom_activite]);

    // Réinitialiser itemToDelete quand le modal de suppression est fermé
    useEffect(() => {
        if (!isDeleteModalOpen) {
            // Petit délai pour laisser l'animation se terminer
            const timer = setTimeout(() => {
                setItemToDelete(null);
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [isDeleteModalOpen]);

    // --- Gestion du Formulaire (Création/Modification) ---

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Fonction pour ouvrir le modal de confirmation avant sauvegarde
    const handleFormSubmitClick = (e) => {
        e.preventDefault();
        
        // Validation basique
        if (!formData.nom_activite.trim()) {
            setError("Le nom de l'activité est requis.");
            return;
        }
        
        // Ouvrir le modal de confirmation
        setIsSaveModalOpen(true);
    };

    // Fonction pour exécuter la sauvegarde après confirmation
    const confirmSave = async () => {
        setIsSaving(true);
        setIsSaveModalOpen(false);
        setError(null);

        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `${ACTIVITES_URL}${editingId}/` : ACTIVITES_URL;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                const errorMessage = errorData.nom_activite 
                    ? `Nom : ${errorData.nom_activite.join(", ")}`
                    : "Erreur lors de l'enregistrement de l'activité.";
                throw new Error(errorMessage);
            }

            await fetchActivites();
            onSuccess(); 
            
            // Message de succès différent selon ajout/modification
            const successMessage = editingId 
                ? `✅ Activité "${formData.nom_activite}" modifiée avec succès !`
                : `✅ Activité "${formData.nom_activite}" ajoutée avec succès !`;
            
            setError(successMessage);
            setTimeout(() => {
                setError(null);
                resetForm();
            }, 2000);

        } catch (err) {
            console.error("Erreur d'enregistrement :", err);
            setError(`❌ Échec : ${err.message || "Veuillez vérifier vos données."}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- Actions sur les Lignes (Modifier/Supprimer) ---

    const handleEdit = (activite) => {
        // Vérifier s'il y a des changements non sauvegardés avant d'éditer
        if (hasUnsavedChanges && activite.id !== editingId) {
            setError("⚠️ Veuillez sauvegarder ou annuler vos modifications avant d'éditer une autre activité.");
            return;
        }
        
        setFormData({ nom_activite: activite.nom_activite });
        setOriginalFormData({ nom_activite: activite.nom_activite });
        setEditingId(activite.id);
        setError(null);
    };

    // Fonction pour annuler l'édition avec confirmation
    const handleCancelEdit = () => {
        if (formData.nom_activite !== originalFormData.nom_activite) {
            // Il y a des modifications non sauvegardées, demander confirmation
            setIsCancelEditModalOpen(true);
        } else {
            // Pas de modifications, annuler directement
            resetForm();
        }
    };

    // Fonction pour confirmer l'annulation de l'édition
    const confirmCancelEdit = () => {
        setIsCancelEditModalOpen(false);
        resetForm();
    };

    // Fonction pour ouvrir le modal de confirmation de suppression
    const handleDeleteClick = (id, nom) => {
        // Vérifier s'il y a des changements non sauvegardés avant de supprimer
        if (hasUnsavedChanges) {
            setError("⚠️ Veuillez sauvegarder ou annuler vos modifications avant de supprimer une activité.");
            return;
        }
        
        setItemToDelete({ id, nom });
        setIsDeleteModalOpen(true);
    };

    // Fonction pour exécuter la suppression après confirmation
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        
        setIsDeleting(true);
        setIsDeleteModalOpen(false);
        
        const { id, nom } = itemToDelete;

        try {
            const res = await fetch(`${ACTIVITES_URL}${id}/`, { method: "DELETE" });

            if (!res.ok) {
                throw new Error("L'activité n'a pas pu être supprimée (peut-être utilisée par un navire).");
            }
            
            await fetchActivites();
            onSuccess(); 
            resetForm();

            setError(`✅ Activité "${nom}" supprimée avec succès !`);
            setTimeout(() => setError(null), 3000);

        } catch (err) {
            console.error("Erreur de suppression :", err);
            setError(`❌ Échec de la suppression : ${err.message}`);
        } finally {
            setIsDeleting(false);
            // Ne pas resetter itemToDelete immédiatement pour éviter le flash
            setTimeout(() => setItemToDelete(null), 100);
        }
    };

    // Fonction pour confirmer la fermeture avec perte de données
    const confirmClose = () => {
        setIsCloseModalOpen(false);
        forceClose();
    };

    // Fonction pour fermer le modal de suppression
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
                onClick={resetAndClose}
            >
                <div 
                    className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform scale-100 transition-transform duration-300"
                    onClick={e => e.stopPropagation()}
                >
                    {/* En-tête de la Modale */}
                    <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <FaList className="text-white" />
                            <h3 className="text-xl font-bold text-white">
                                Gérer les Activités
                            </h3>
                            {hasUnsavedChanges && (
                                <span className="flex items-center gap-1 text-yellow-200 text-sm font-medium bg-yellow-600/30 px-2 py-1 rounded-lg">
                                    <FaExclamationTriangle className="w-3 h-3" />
                                    Modifications non sauvegardées
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={resetAndClose} 
                            className="p-1 text-white/80 hover:text-white rounded-full transition-colors"
                            title="Fermer"
                        >
                            <FaTimes className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        
                        {/* Message d'erreur ou de succès */}
                        {error && (
                            <div className={`p-3 border rounded-xl font-medium text-sm ${
                                error.includes("✅") 
                                    ? "bg-green-100 border-green-300 text-green-700" 
                                    : error.includes("❌")
                                    ? "bg-red-100 border-red-300 text-red-700"
                                    : "bg-yellow-100 border-yellow-300 text-yellow-700"
                            }`}>
                                {error.includes("⚠️") ? (
                                    <div className="flex items-center gap-2">
                                        <FaExclamationTriangle className="flex-shrink-0" />
                                        <span>{error.replace("⚠️ ", "")}</span>
                                    </div>
                                ) : error}
                            </div>
                        )}
                        
                        {/* Formulaire de Création / Modification */}
                        <form onSubmit={handleFormSubmitClick} className="flex gap-3 items-end p-4 border border-blue-100 bg-blue-50/50 rounded-xl shadow-inner">
                            <div className="flex-grow">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    Nom de l'activité <span className="text-red-500">*</span>
                                    {hasUnsavedChanges && (
                                        <span className="text-yellow-600 text-xs font-normal">
                                            (modifié)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    name="nom_activite"
                                    value={formData.nom_activite}
                                    onChange={handleChange}
                                    placeholder="Ex: Pêche, Plongée, Transport"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:bg-gray-100"
                                    required
                                    disabled={isSaving || isDeleting}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={formLoading || isSaving || isDeleting || (!hasUnsavedChanges && editingId)}
                                    className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow-md flex items-center gap-2 ${
                                        formLoading || isSaving || isDeleting
                                            ? "bg-gray-400 text-white cursor-not-allowed" 
                                            : editingId 
                                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                    } ${!hasUnsavedChanges && editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={!hasUnsavedChanges && editingId ? "Aucune modification détectée" : ""}
                                >
                                    {isSaving ? (
                                        <FaSpinner className="animate-spin" />
                                    ) : editingId ? (
                                        <FaEdit />
                                    ) : (
                                        <FaPlus />
                                    )}
                                    {isSaving ? 'En cours...' : editingId ? "Modifier" : "Ajouter"}
                                </button>
                                
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving || isDeleting}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaTimes /> Annuler
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Liste des Activités */}
                        <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mt-4">Liste actuelle</h4>

                        {isLoading ? (
                            <div className="flex items-center justify-center p-8 text-blue-600">
                                <FaSpinner className="animate-spin mr-3" /> Chargement...
                            </div>
                        ) : activites.length === 0 ? (
                            <p className="text-gray-500 p-4 bg-gray-50 rounded-lg">Aucune activité enregistrée. Ajoutez-en une ci-dessus.</p>
                        ) : (
                            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {activites.map(activite => (
                                    <li 
                                        key={activite.id} 
                                        className={`flex justify-between items-center p-4 border rounded-xl shadow-sm transition-all duration-200 ${
                                            editingId === activite.id 
                                                ? 'bg-yellow-50 border-yellow-300' 
                                                : 'bg-white hover:bg-slate-50 border-gray-200'
                                        } ${isDeleting || isSaving ? 'opacity-75' : ''}`}
                                    >
                                        <span className="font-medium text-gray-700 flex-grow">
                                            {activite.nom_activite}
                                            {editingId === activite.id && hasUnsavedChanges && (
                                                <span className="ml-2 text-yellow-600 text-xs font-normal">
                                                    (en cours de modification)
                                                </span>
                                            )}
                                        </span>
                                        
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(activite)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={editingId === activite.id ? "Modification en cours" : "Modifier cette activité"}
                                                disabled={isDeleting || isSaving || formLoading || hasUnsavedChanges}
                                            >
                                                <FaEdit className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteClick(activite.id, activite.nom_activite)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Supprimer cette activité"
                                                disabled={isDeleting || isSaving || formLoading || hasUnsavedChanges}
                                            >
                                                <FaTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Pied de la modale / Bouton de fermeture */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-6">
                            <div className="text-sm text-gray-500">
                                {hasUnsavedChanges && (
                                    <div className="flex items-center gap-2 text-yellow-600">
                                        <FaExclamationTriangle />
                                        <span>Vous avez des modifications non sauvegardées</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={resetAndClose}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-all duration-200 shadow-md"
                                >
                                    <FaCheckCircle /> Terminer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de confirmation pour la sauvegarde (ajout/modification) */}
            {isSaveModalOpen && (
                <ConfirmationModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    onConfirm={confirmSave}
                    title={editingId ? "Modifier l'activité" : "Ajouter une activité"}
                    message={
                        <div>
                            {editingId ? (
                                <>
                                    Confirmez-vous la modification de l'activité 
                                    <span className="font-bold text-black"> "{formData.nom_activite}" </span>
                                    ?
                                </>
                            ) : (
                                <>
                                    Confirmez-vous l'ajout de l'activité 
                                    <span className="font-bold text-black"> "{formData.nom_activite}" </span>
                                    ?
                                </>
                            )}
                        </div>
                    }
                    confirmButtonText={editingId ? "Modifier" : "Ajouter"}
                    type={editingId ? "warning" : "info"}
                    isLoading={isSaving}
                    disableConfirm={isSaving}
                    cancelButtonText="Annuler"
                />
            )}

            {/* Modal de confirmation pour suppression */}
            {isDeleteModalOpen && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={confirmDelete}
                    title="Supprimer l'activité"
                    message={
                        <div>
                            Êtes-vous certain de vouloir supprimer définitivement l'activité 
                            <span className="font-bold text-black"> "{itemToDelete?.nom}" </span>
                            ? Cette action est irréversible.
                        </div>
                    }
                    confirmButtonText="Supprimer définitivement"
                    type="danger"
                    isLoading={isDeleting}
                    disableConfirm={isDeleting}
                />
            )}

            {/* Modal de confirmation pour annuler l'édition */}
            {isCancelEditModalOpen && (
                <ConfirmationModal
                    isOpen={isCancelEditModalOpen}
                    onClose={() => setIsCancelEditModalOpen(false)}
                    onConfirm={confirmCancelEdit}
                    title="Annuler les modifications"
                    message={
                        <div>
                            Vous avez modifié l'activité 
                            <span className="font-bold text-black"> "{formData.nom_activite}" </span>
                            . Voulez-vous vraiment annuler ces modifications ?
                        </div>
                    }
                    confirmButtonText="Oui, annuler"
                    type="warning"
                    cancelButtonText="Non, continuer"
                />
            )}

            {/* Modal de confirmation pour fermer la modale avec modifications non sauvegardées */}
            {isCloseModalOpen && (
                <ConfirmationModal
                    isOpen={isCloseModalOpen}
                    onClose={() => setIsCloseModalOpen(false)}
                    onConfirm={confirmClose}
                    title="Modifications non sauvegardées"
                    message={
                        <div>
                            <p className="mb-2">Vous avez des modifications non sauvegardées :</p>
                            {editingId ? (
                                <p>
                                    L'activité 
                                    <span className="font-bold text-black"> "{formData.nom_activite}" </span>
                                    a été modifiée mais non enregistrée.
                                </p>
                            ) : (
                                <p>
                                    L'activité 
                                    <span className="font-bold text-black"> "{formData.nom_activite}" </span>
                                    n'a pas été ajoutée.
                                </p>
                            )}
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
};

export default ActiviteModal;