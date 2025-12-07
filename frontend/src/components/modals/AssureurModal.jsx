import React, { useState, useEffect, useRef } from "react";
import { HiPlus, HiPencil, HiTrash, HiX, HiCheck, HiOfficeBuilding } from "react-icons/hi";
import axios from "axios";
import ConfirmationModal from "./ConfirmationModal"; // Import du modal de confirmation
import { API_BASE_URL } from "../../config/api";

const AssureurModal = ({ isOpen, onClose, onSuccess }) => {
    const [assureurs, setAssureurs] = useState([]);
    const [formData, setFormData] = useState({ nom_assureur: "" }); 
    const [originalFormData, setOriginalFormData] = useState({ nom_assureur: "" });
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
    
    // États pour la gestion des modifications
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const formInitialized = useRef(false);

    // Constante pour l'URL complète des assureurs
    const ASSUREURS_URL = `${API_BASE_URL}/assureurs/`;

    // --- Fonctions de base ---

    const fetchAssureurs = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(ASSUREURS_URL);
            setAssureurs(res.data);
            setError(null);
        } catch (err) {
            setError("❌ Impossible de charger la liste des assureurs.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ nom_assureur: "" });
        setOriginalFormData({ nom_assureur: "" });
        setEditingId(null);
        setError(null);
        setHasUnsavedChanges(false);
        formInitialized.current = false;
    };

    const resetAndClose = () => {
        // Vérifier s'il y a des changements non sauvegardés
        if (hasUnsavedChanges) {
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
            fetchAssureurs();
            resetForm();
            formInitialized.current = true;
        }
    }, [isOpen]);

    // Vérifier les changements non sauvegardés
    useEffect(() => {
        if (formInitialized.current) {
            const hasChanges = formData.nom_assureur !== originalFormData.nom_assureur;
            setHasUnsavedChanges(hasChanges);
        }
    }, [formData.nom_assureur, originalFormData.nom_assureur]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Fonction pour ouvrir le modal de confirmation avant sauvegarde
    const handleFormSubmitClick = (e) => {
        e.preventDefault();
        
        // Validation basique
        if (!formData.nom_assureur.trim()) {
            setError("❌ Le nom de l'assureur est requis.");
            return;
        }
        
        // Ouvrir le modal de confirmation
        setIsSaveModalOpen(true);
    };

    // Fonction pour exécuter la sauvegarde après confirmation
    const handleFormSubmit = async () => {
        setIsSaving(true);
        setIsSaveModalOpen(false);
        setError(null);

        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `${ASSUREURS_URL}${editingId}/` : ASSUREURS_URL;

        try {
            const res = await axios({
                method,
                url,
                data: formData,
                headers: { "Content-Type": "application/json" }
            });

            await fetchAssureurs();
            onSuccess(res.data.id);
            
            // Message de succès
            const successMessage = editingId 
                ? `✅ Assureur "${formData.nom_assureur}" modifié avec succès !`
                : `✅ Assureur "${formData.nom_assureur}" ajouté avec succès !`;
            
            setError(successMessage);
            setTimeout(() => {
                setError(null);
                resetForm();
            }, 2000);

        } catch (err) {
            console.error("Erreur d'enregistrement :", err.response?.data || err);
            const errorData = err.response?.data;
            let errorMessage = "❌ Échec : Veuillez vérifier vos données.";
            
            if (errorData) {
                errorMessage = `❌ ${Object.values(errorData).flat().join(" ; ")}`;
            }
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (assureur) => {
        // Vérifier s'il y a des changements non sauvegardés avant d'éditer
        if (hasUnsavedChanges && assureur.id !== editingId) {
            setError("⚠️ Veuillez sauvegarder ou annuler vos modifications avant d'éditer un autre assureur.");
            return;
        }
        
        setFormData({ nom_assureur: assureur.nom_assureur });
        setOriginalFormData({ nom_assureur: assureur.nom_assureur });
        setEditingId(assureur.id);
        setError(null);
    };

    // Fonction pour annuler l'édition avec confirmation
    const handleCancelEdit = () => {
        if (formData.nom_assureur !== originalFormData.nom_assureur) {
            setIsCancelEditModalOpen(true);
        } else {
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
            setError("⚠️ Veuillez sauvegarder ou annuler vos modifications avant de supprimer un assureur.");
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
            await axios.delete(`${ASSUREURS_URL}${id}/`);
            
            await fetchAssureurs();
            onSuccess(); 
            resetForm();

            setError(`✅ Assureur "${nom}" supprimé avec succès !`);
            setTimeout(() => setError(null), 3000);

        } catch (err) {
            console.error("Erreur de suppression :", err.response?.data || err);
            setError("❌ Échec de la suppression : Cet assureur est peut-être lié à une assurance existante.");
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    // Fonction pour confirmer la fermeture avec perte de données
    const confirmClose = () => {
        setIsCloseModalOpen(false);
        forceClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                onClick={resetAndClose}
            >
                <div 
                    className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* En-tête de la Modale */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <HiOfficeBuilding className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Gestion des Assureurs</h3>
                                <p className="text-slate-600 text-sm mt-1">Ajouter ou modifier des assureurs</p>
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
                            onClick={resetAndClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-150"
                            title="Fermer"
                        >
                            <HiX className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                    
                    {/* Contenu principal */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        
                        {/* Message d'erreur ou de succès */}
                        {error && (
                            <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${
                                error.includes("✅") 
                                    ? "bg-green-50 border border-green-200 text-green-700" 
                                    : error.includes("❌")
                                    ? "bg-red-50 border border-red-200 text-red-700"
                                    : error.includes("⚠️")
                                    ? "bg-yellow-50 border border-yellow-200 text-yellow-700"
                                    : "bg-red-50 border border-red-200 text-red-700"
                            }`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    error.includes("✅") 
                                        ? "bg-green-600"
                                        : error.includes("❌")
                                        ? "bg-red-600"
                                        : "bg-yellow-600"
                                }`}>
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <span className="font-medium">{error.replace(/^[✅❌⚠️]\s*/, '')}</span>
                            </div>
                        )}
                        
                        {/* Formulaire de Création / Modification */}
                        <form onSubmit={handleFormSubmitClick} className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nom de l'Assureur *
                                    {hasUnsavedChanges && (
                                        <span className="ml-2 text-xs text-amber-600 font-normal">
                                            (modifié)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    name="nom_assureur"
                                    value={formData.nom_assureur}
                                    onChange={handleChange}
                                    placeholder="Ex: Assurances Océan"
                                    className={`w-full border rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 disabled:bg-slate-100 ${
                                        hasUnsavedChanges
                                            ? 'border-amber-300'
                                            : 'border-slate-300'
                                    }`}
                                    required
                                    disabled={isSaving || isDeleting}
                                />
                            </div>

                            {/* Boutons du formulaire */}
                            <div className="flex justify-end gap-3 pt-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving || isDeleting}
                                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50"
                                    >
                                        <HiX className="w-4 h-4" />
                                        Annuler
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={formLoading || isSaving || isDeleting || (!hasUnsavedChanges && editingId)}
                                    className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition-all duration-200 ${
                                        formLoading || isSaving || isDeleting
                                            ? "bg-slate-400 cursor-not-allowed text-white" 
                                            : editingId 
                                            ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm hover:shadow-md"
                                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                                    } ${!hasUnsavedChanges && editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={!hasUnsavedChanges && editingId ? "Aucune modification détectée" : ""}
                                >
                                    {isSaving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : editingId ? (
                                        <HiPencil className="w-4 h-4" />
                                    ) : (
                                        <HiPlus className="w-4 h-4" />
                                    )}
                                    {isSaving ? 'En cours...' : editingId ? "Modifier" : "Ajouter"}
                                </button>
                            </div>
                        </form>

                        {/* Liste des Assureurs */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-slate-900">Liste des assureurs</h4>
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                                    {assureurs.length} élément{assureurs.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center p-8 text-slate-600">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                                    Chargement des assureurs...
                                </div>
                            ) : assureurs.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                                    <HiOfficeBuilding className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                    <p className="text-slate-600 font-medium">Aucun assureur enregistré</p>
                                    <p className="text-slate-500 text-sm mt-1">Commencez par ajouter un assureur</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {assureurs.map(assureur => (
                                        <div 
                                            key={assureur.id} 
                                            className={`flex justify-between items-center p-4 border rounded-xl transition-all duration-200 ${
                                                editingId === assureur.id 
                                                    ? 'bg-yellow-50 border-yellow-300 shadow-sm' 
                                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                            } ${isDeleting || isSaving ? 'opacity-75' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${
                                                    editingId === assureur.id ? 'bg-yellow-100' : 'bg-slate-100'
                                                }`}>
                                                    <HiOfficeBuilding className={`w-4 h-4 ${
                                                        editingId === assureur.id ? 'text-yellow-600' : 'text-slate-600'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <span className={`font-medium ${
                                                        editingId === assureur.id ? 'text-yellow-900' : 'text-slate-900'
                                                    }`}>
                                                        {assureur.nom_assureur}
                                                    </span>
                                                    {editingId === assureur.id && hasUnsavedChanges && (
                                                        <span className="block text-xs text-yellow-600 mt-1">
                                                            (en cours de modification)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(assureur)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={editingId === assureur.id ? "Modification en cours" : "Modifier"}
                                                    disabled={isDeleting || isSaving || formLoading || hasUnsavedChanges}
                                                >
                                                    <HiPencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(assureur.id, assureur.nom_assureur)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Supprimer"
                                                    disabled={isDeleting || isSaving || formLoading || hasUnsavedChanges}
                                                >
                                                    <HiTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pied de page */}
                    <div className="flex justify-end p-6 border-t border-slate-200 bg-slate-50">
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors duration-200"
                        >
                            <HiCheck className="w-4 h-4" />
                            Fermer
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de confirmation pour la sauvegarde */}
            {isSaveModalOpen && (
                <ConfirmationModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    onConfirm={handleFormSubmit}
                    title={editingId ? "Modifier l'assureur" : "Ajouter un assureur"}
                    message={
                        <div>
                            {editingId ? (
                                <>
                                    Confirmez-vous la modification de l'assureur 
                                    <span className="font-bold text-black"> "{formData.nom_assureur}" </span>
                                    ?
                                </>
                            ) : (
                                <>
                                    Confirmez-vous l'ajout de l'assureur 
                                    <span className="font-bold text-black"> "{formData.nom_assureur}" </span>
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
            {isDeleteModalOpen && itemToDelete && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title="Supprimer l'assureur"
                    message={
                        <div>
                            Êtes-vous certain de vouloir supprimer définitivement l'assureur 
                            <span className="font-bold text-black"> "{itemToDelete.nom}" </span>
                            ? Cette action est irréversible et peut affecter les assurances associées.
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
                            Vous avez modifié l'assureur 
                            <span className="font-bold text-black"> "{formData.nom_assureur}" </span>
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
                                    L'assureur 
                                    <span className="font-bold text-black"> "{formData.nom_assureur}" </span>
                                    a été modifié mais non enregistré.
                                </p>
                            ) : (
                                <p>
                                    L'assureur 
                                    <span className="font-bold text-black"> "{formData.nom_assureur}" </span>
                                    n'a pas été ajouté.
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

export default AssureurModal;