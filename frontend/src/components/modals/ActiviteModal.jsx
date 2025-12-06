import React, { useState, useEffect } from "react";
import { FaList, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { API_BASE_URL } from "../../config/api"; // Ajustez le chemin selon votre structure

/**
 * Composant Modale pour la gestion complète (CRUD) des Activités.
 * @param {object} props
 * @param {boolean} props.isOpen - Contrôle l'ouverture/fermeture de la modale.
 * @param {function} props.onClose - Fonction à appeler pour fermer la modale.
 * @param {function} props.onSuccess - Fonction à appeler après toute opération réussie (création/modification/suppression) pour rafraîchir la liste dans NavireForm.
 */
const ActiviteModal = ({ isOpen, onClose, onSuccess }) => {
    const [activites, setActivites] = useState([]);
    const [formData, setFormData] = useState({ nom_activite: "" });
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Constante pour l'URL complète des activités
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
        setEditingId(null);
        setError(null);
    };

    const resetAndClose = () => {
        resetForm();
        onClose();
    };

    // Charger les activités lors de l'ouverture
    useEffect(() => {
        if (isOpen) {
            fetchActivites();
            resetForm();
        }
    }, [isOpen]);

    // --- Gestion du Formulaire (Création/Modification) ---

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
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

            // Mettre à jour la liste et notifier NavireForm
            await fetchActivites();
            onSuccess(); 
            resetForm(); 

        } catch (err) {
            console.error("Erreur d'enregistrement :", err);
            setError(`Échec : ${err.message || "Veuillez vérifier vos données."}`);
        } finally {
            setFormLoading(false);
        }
    };
    
    // --- Actions sur les Lignes (Modifier/Supprimer) ---

    const handleEdit = (activite) => {
        setFormData({ nom_activite: activite.nom_activite });
        setEditingId(activite.id);
        setError(null);
    };

    const handleDelete = async (id, nom) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer l'activité "${nom}" ?`)) return;

        setFormLoading(true);
        setError(null);

        try {
            const res = await fetch(`${ACTIVITES_URL}${id}/`, { method: "DELETE" });

            if (!res.ok) {
                throw new Error("L'activité n'a pas pu être supprimée (peut-être utilisée par un navire).");
            }
            
            // Mettre à jour la liste et notifier NavireForm
            await fetchActivites();
            onSuccess(); 
            resetForm();

        } catch (err) {
            console.error("Erreur de suppression :", err);
            setError(`Échec de la suppression : ${err.message}`);
        } finally {
            setFormLoading(false);
        }
    };

    if (!isOpen) return null;

    // --- Rendu du Composant ---

    return (
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
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <FaList /> Gérer les Activités
                    </h3>
                    <button onClick={resetAndClose} className="p-1 text-white/80 hover:text-white rounded-full transition-colors">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    
                    {/* Message d'erreur */}
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl font-medium text-sm">
                            ⚠️ {error}
                        </div>
                    )}
                    
                    {/* Formulaire de Création / Modification */}
                    <form onSubmit={handleFormSubmit} className="flex gap-3 items-end p-4 border border-blue-100 bg-blue-50/50 rounded-xl shadow-inner">
                        <div className="flex-grow">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                Nom de l'activité <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="nom_activite"
                                value={formData.nom_activite}
                                onChange={handleChange}
                                placeholder="Ex: Pêche, Plongée, Transport"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={formLoading}
                            className={`px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow-md flex items-center gap-2 ${
                                formLoading 
                                    ? "bg-gray-400 text-white cursor-not-allowed" 
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                        >
                            {formLoading ? <FaSpinner className="animate-spin" /> : editingId ? <FaEdit /> : <FaPlus />}
                            {formLoading ? 'En cours...' : editingId ? "Modifier" : "Ajouter"}
                        </button>
                        
                        {editingId && (
                             <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                            >
                                <FaTimes /> Annuler
                            </button>
                        )}
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
                                    className={`flex justify-between items-center p-4 border rounded-xl shadow-sm transition-all duration-200 ${editingId === activite.id ? 'bg-yellow-50 border-yellow-300' : 'bg-white hover:bg-slate-50 border-gray-200'}`}
                                >
                                    <span className="font-medium text-gray-700 flex-grow">
                                        {activite.nom_activite}
                                    </span>
                                    
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(activite)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Modifier cette activité"
                                            disabled={formLoading}
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(activite.id, activite.nom_activite)}
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Supprimer cette activité"
                                            disabled={formLoading}
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Pied de la modale / Bouton de fermeture */}
                    <div className="flex justify-end pt-4 border-t border-slate-200 mt-6">
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-all duration-200 shadow-md"
                        >
                            <FaCheckCircle /> Terminer la gestion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiviteModal;