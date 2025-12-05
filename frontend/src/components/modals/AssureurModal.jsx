import React, { useState, useEffect } from "react";
import { HiPlus, HiPencil, HiTrash, HiX, HiCheck, HiOfficeBuilding } from "react-icons/hi";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api/assureurs/";

const AssureurModal = ({ isOpen, onClose, onSuccess }) => {
    const [assureurs, setAssureurs] = useState([]);
    const [formData, setFormData] = useState({ nom_assureur: "" }); 
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // --- Fonctions de base ---

    const fetchAssureurs = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(API_BASE_URL);
            setAssureurs(res.data);
            setError(null);
        } catch (err) {
            setError("Impossible de charger la liste des assureurs.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ nom_assureur: "" });
        setEditingId(null);
        setError(null);
    };

    const resetAndClose = () => {
        resetForm();
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            fetchAssureurs();
            resetForm();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);

        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `${API_BASE_URL}${editingId}/` : API_BASE_URL;

        try {
            const res = await axios({
                method,
                url,
                data: formData,
                headers: { "Content-Type": "application/json" }
            });

            await fetchAssureurs();
            onSuccess(res.data.id);
            resetForm(); 

        } catch (err) {
            console.error("Erreur d'enregistrement :", err.response?.data || err);
            const errorData = err.response?.data;
            let errorMessage = "Échec : Veuillez vérifier vos données.";
            
            if (errorData) {
                errorMessage = Object.values(errorData).flat().join(" ; ");
            }
            setError(errorMessage);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (assureur) => {
        setFormData({ nom_assureur: assureur.nom_assureur });
        setEditingId(assureur.id);
        setError(null);
    };

    const handleDelete = async (id, nom) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer l'assureur "${nom}" ?`)) return;

        setFormLoading(true);
        setError(null);

        try {
            await axios.delete(`${API_BASE_URL}${id}/`);
            
            await fetchAssureurs();
            onSuccess(); 
            resetForm();

        } catch (err) {
            console.error("Erreur de suppression :", err.response?.data || err);
            setError(`Échec de la suppression : Cet assureur est peut-être lié à une assurance existante.`);
        } finally {
            setFormLoading(false);
        }
    };

    if (!isOpen) return null;


    return (
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
                        </div>
                    </div>
                    <button 
                        onClick={resetAndClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-150"
                    >
                        <HiX className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                {/* Contenu principal */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Message d'erreur */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                    
                    {/* Formulaire de Création / Modification */}
                    <form onSubmit={handleFormSubmit} className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nom de l'Assureur *
                            </label>
                            <input
                                type="text"
                                name="nom_assureur"
                                value={formData.nom_assureur}
                                onChange={handleChange}
                                placeholder="Ex: Assurances Océan"
                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                required
                            />
                        </div>

                        {/* Boutons du formulaire */}
                        <div className="flex justify-end gap-3 pt-2">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors duration-200"
                                >
                                    <HiX className="w-4 h-4" />
                                    Annuler
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={formLoading}
                                className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition-all duration-200 ${
                                    formLoading 
                                        ? "bg-slate-400 cursor-not-allowed text-white" 
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                                }`}
                            >
                                {formLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : editingId ? (
                                    <HiPencil className="w-4 h-4" />
                                ) : (
                                    <HiPlus className="w-4 h-4" />
                                )}
                                {formLoading ? 'En cours...' : editingId ? "Modifier" : "Ajouter"}
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
                                                ? 'bg-blue-50 border-blue-300 shadow-sm' 
                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${
                                                editingId === assureur.id ? 'bg-blue-100' : 'bg-slate-100'
                                            }`}>
                                                <HiOfficeBuilding className={`w-4 h-4 ${
                                                    editingId === assureur.id ? 'text-blue-600' : 'text-slate-600'
                                                }`} />
                                            </div>
                                            <span className={`font-medium ${
                                                editingId === assureur.id ? 'text-blue-900' : 'text-slate-900'
                                            }`}>
                                                {assureur.nom_assureur}
                                            </span>
                                        </div>
                                        
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(assureur)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                                                title="Modifier"
                                                disabled={formLoading}
                                            >
                                                <HiPencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(assureur.id, assureur.nom_assureur)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-150"
                                                title="Supprimer"
                                                disabled={formLoading}
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
    );
};

export default AssureurModal;