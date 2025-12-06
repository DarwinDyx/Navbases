import React, { useState, useEffect, useMemo } from "react";
import { 
    HiX, HiPlus, HiPencil, HiTrash, HiUser, HiOfficeBuilding, 
    HiSearch, HiCheck, HiExclamation
} from "react-icons/hi";
import axios from "axios";

import { API_BASE_URL } from "../../config/api";

const ProprietaireModal = ({ isOpen, onClose, onSuccess }) => {
    const [proprietaires, setProprietaires] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [formData, setFormData] = useState({ 
        nom_proprietaire: "",
        type_proprietaire: "particulier",
        contact: "",
        adresse: ""
    });
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [selectedProprietaire, setSelectedProprietaire] = useState(null);

    
    const typeConfig = {
        particulier: { 
            label: "Particulier", 
            icon: HiUser, 
            color: "blue",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-700"
        },
        entreprise: { 
            label: "Entreprise", 
            icon: HiOfficeBuilding, 
            color: "emerald",
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        gouvernement: { 
            label: "Gouvernement", 
            icon: HiOfficeBuilding, 
            color: "purple",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200",
            textColor: "text-purple-700"
        },
        association: { 
            label: "Association", 
            icon: HiUser, // Utiliser HiUser comme alternative
            color: "orange",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-700"
        },
        autre: { 
            label: "Autre", 
            icon: HiUser, 
            color: "gray",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200",
            textColor: "text-gray-700"
        }
    };

    // Filtrer les propriétaires avec useMemo pour optimiser les performances
    const filteredProprietaires = useMemo(() => {
        return proprietaires.filter(proprietaire => {
            const matchesSearch = searchTerm === "" || 
                proprietaire.nom_proprietaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (proprietaire.contact && proprietaire.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (proprietaire.adresse && proprietaire.adresse.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesType = selectedType === "all" || proprietaire.type_proprietaire === selectedType;
            
            return matchesSearch && matchesType;
        });
    }, [proprietaires, searchTerm, selectedType]);

    // Statistiques
    const stats = useMemo(() => {
        const total = proprietaires.length;
        const byType = {};
        Object.keys(typeConfig).forEach(type => {
            byType[type] = proprietaires.filter(p => p.type_proprietaire === type).length;
        });
        return { total, byType };
    }, [proprietaires]);

    // Charger la liste des propriétaires
    const fetchProprietaires = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(API_BASE_URL);
            setProprietaires(res.data);
            setError(null);
        } catch (err) {
            setError("Impossible de charger la liste des propriétaires.");
        } finally {
            setIsLoading(false);
        }
    };

    // Réinitialiser le formulaire
    const resetForm = () => {
        setFormData({ 
            nom_proprietaire: "",
            type_proprietaire: "particulier",
            contact: "",
            adresse: ""
        });
        setEditingId(null);
        setError(null);
        setSuccess(null);
        setSelectedProprietaire(null);
        setSearchTerm("");
        setSelectedType("all");
    };

    const resetAndClose = () => {
        resetForm();
        onClose();
    };

    // Charger les données à l'ouverture
    useEffect(() => {
        if (isOpen) {
            fetchProprietaires();
            resetForm();
        }
    }, [isOpen]);

    // Gestion des changements de formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Gestion de la recherche
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Afficher un message de succès
    const showSuccess = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 4000);
    };

    // Soumission du formulaire (Création/Modification)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);
        setSuccess(null);

        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `${API_BASE_URL}${editingId}/` : API_BASE_URL;

        try {
            const res = await axios({
                method,
                url,
                data: formData,
                headers: { "Content-Type": "application/json" }
            });

            await fetchProprietaires();
            onSuccess(res.data.id);
            
            const action = editingId ? "modifié" : "ajouté";
            showSuccess(`✅ Propriétaire ${action} avec succès !`);
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

    // Modifier un propriétaire
    const handleEdit = (proprietaire) => {
        setFormData({ 
            nom_proprietaire: proprietaire.nom_proprietaire,
            type_proprietaire: proprietaire.type_proprietaire || "particulier",
            contact: proprietaire.contact || "",
            adresse: proprietaire.adresse || ""
        });
        setEditingId(proprietaire.id);
        setSelectedProprietaire(proprietaire);
        setError(null);
        setSuccess(null);
    };

    // Supprimer un propriétaire
    const handleDelete = async (id, nom) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le propriétaire "${nom}" ?\nCette action est irréversible.`)) return;

        setFormLoading(true);
        setError(null);

        try {
            await axios.delete(`${API_BASE_URL}${id}/`);
            await fetchProprietaires();
            onSuccess();
            showSuccess("✅ Propriétaire supprimé avec succès !");
            resetForm();
        } catch (err) {
            console.error("Erreur de suppression :", err.response?.data || err);
            setError(`Échec de la suppression : Ce propriétaire est peut-être lié à des navires existants.`);
        } finally {
            setFormLoading(false);
        }
    };

    // Rendu d'un item de propriétaire
    const renderProprietaireItem = (proprietaire) => {
        const config = typeConfig[proprietaire.type_proprietaire] || typeConfig.autre;
        const Icon = config.icon;
        const isSelected = editingId === proprietaire.id;

        return (
            <div 
                key={proprietaire.id} 
                className={`flex justify-between items-start p-4 border rounded-xl transition-all duration-200 cursor-pointer group ${
                    isSelected 
                        ? `${config.bgColor} ${config.borderColor} shadow-md ring-2 ring-${config.color}-300` 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
                onClick={() => handleEdit(proprietaire)}
            >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? config.bgColor : 'bg-slate-100'} group-hover:${config.bgColor}`}>
                        <Icon className={`w-4 h-4 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold block truncate ${
                                isSelected ? config.textColor : 'text-slate-900'
                            }`}>
                                {proprietaire.nom_proprietaire}
                            </span>
                            {isSelected && (
                                <HiCheck className={`w-4 h-4 ${config.textColor} flex-shrink-0`} />
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 ${config.bgColor} ${config.borderColor} px-2 py-1 rounded-full text-xs font-medium ${config.textColor}`}>
                                <Icon className="w-3 h-3" />
                                {config.label}
                            </span>
                            {proprietaire.contact && (
                                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                    {proprietaire.contact}
                                </span>
                            )}
                        </div>
                        
                        {proprietaire.adresse && (
                            <div className="text-xs text-slate-500 line-clamp-2">
                                {proprietaire.adresse}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(proprietaire);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150"
                        title="Modifier"
                        disabled={formLoading}
                    >
                        <HiPencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(proprietaire.id, proprietaire.nom_proprietaire);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-150"
                        title="Supprimer"
                        disabled={formLoading}
                    >
                        <HiTrash className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div 
                className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* En-tête */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                            <HiUser className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Gestion des Propriétaires</h3>
                            <p className="text-slate-600 text-sm mt-1">Gérez votre liste de propriétaires de navires</p>
                        </div>
                    </div>
                    <button 
                        onClick={resetAndClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-150"
                    >
                        <HiX className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                {/* Contenu principal - DEUX COLONNES */}
                <div className="flex-1 flex overflow-hidden">
                    {/* COLONNE GAUCHE - Liste avec recherche et filtres */}
                    <div className="w-2/5 border-r border-slate-200 flex flex-col bg-slate-50">
                        <div className="p-6 border-b border-slate-200 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-slate-900">Liste des propriétaires</h4>
                                <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                        {filteredProprietaires.length} / {stats.total}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Barre de recherche */}
                            <div className="relative mb-4">
                                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un propriétaire..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-white"
                                />
                            </div>

                            {/* Filtres par type */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedType("all")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                        selectedType === "all" 
                                            ? "bg-blue-600 text-white shadow-sm" 
                                            : "bg-white text-slate-600 border border-slate-300 hover:border-slate-400"
                                    }`}
                                >
                                    Tous
                                </button>
                                {Object.entries(typeConfig).map(([type, config]) => {
                                    const Icon = config.icon;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedType(type)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                                                selectedType === type 
                                                    ? `${config.bgColor} ${config.textColor} border ${config.borderColor} shadow-sm` 
                                                    : "bg-white text-slate-600 border border-slate-300 hover:border-slate-400"
                                            }`}
                                        >
                                            <Icon className="w-3 h-3" />
                                            {config.label}
                                            <span className={`ml-1 ${selectedType === type ? config.textColor : 'text-slate-400'}`}>
                                                ({stats.byType[type] || 0})
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Liste des propriétaires */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center p-8 text-slate-600">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                                    <p>Chargement des propriétaires...</p>
                                </div>
                            ) : filteredProprietaires.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                                    <HiSearch className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                                    <p className="text-slate-600 font-medium text-lg mb-2">
                                        {searchTerm || selectedType !== "all" ? "Aucun résultat trouvé" : "Aucun propriétaire enregistré"}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        {searchTerm || selectedType !== "all" 
                                            ? "Essayez de modifier vos critères de recherche" 
                                            : "Commencez par ajouter votre premier propriétaire"
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredProprietaires.map(renderProprietaireItem)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLONNE DROITE - Formulaire */}
                    <div className="w-3/5 flex flex-col bg-white">
                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">
                                        {editingId ? "Modifier le propriétaire" : "Nouveau propriétaire"}
                                    </h4>
                                    <p className="text-slate-600 text-sm mt-1">
                                        {editingId 
                                            ? "Modifiez les informations du propriétaire sélectionné" 
                                            : "Remplissez les informations pour créer un nouveau propriétaire"
                                        }
                                    </p>
                                </div>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors duration-200"
                                    >
                                        <HiPlus className="w-4 h-4" />
                                        Nouveau
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Messages d'alerte */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                                    <HiExclamation className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}
                            
                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                                    <HiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span className="font-medium">{success}</span>
                                </div>
                            )}
                            
                            {/* Formulaire de Création / Modification */}
                            <form onSubmit={handleFormSubmit} className="space-y-6 max-w-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Nom du propriétaire *
                                        </label>
                                        <input
                                            type="text"
                                            name="nom_proprietaire"
                                            value={formData.nom_proprietaire}
                                            onChange={handleChange}
                                            placeholder="Ex: Société Maritime ABC"
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Type de propriétaire *
                                        </label>
                                        <select
                                            name="type_proprietaire"
                                            value={formData.type_proprietaire}
                                            onChange={handleChange}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-white"
                                            required
                                        >
                                            {Object.entries(typeConfig).map(([value, config]) => {
                                                const Icon = config.icon;
                                                return (
                                                    <option key={value} value={value}>
                                                        {config.label}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Contact
                                    </label>
                                    <input
                                        type="text"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        placeholder="Ex: +261 34 00 000 00"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Adresse
                                    </label>
                                    <textarea
                                        name="adresse"
                                        value={formData.adresse}
                                        onChange={handleChange}
                                        placeholder="Ex: Lot 123, Andavamamba, Antananarivo"
                                        rows="4"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 resize-none"
                                    />
                                </div>

                                {/* Boutons du formulaire */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={resetAndClose}
                                        className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors duration-200"
                                    >
                                        <HiX className="w-4 h-4" />
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className={`flex items-center gap-2 px-8 py-3 font-semibold rounded-xl transition-all duration-200 ${
                                            formLoading 
                                                ? "bg-slate-400 cursor-not-allowed text-white" 
                                                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md"
                                        }`}
                                    >
                                        {formLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                En cours...
                                            </>
                                        ) : editingId ? (
                                            <>
                                                <HiPencil className="w-4 h-4" />
                                                Modifier
                                            </>
                                        ) : (
                                            <>
                                                <HiPlus className="w-4 h-4" />
                                                Ajouter le propriétaire
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProprietaireModal;