import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
    HiX, HiPlus, HiPencil, HiTrash, HiUser, HiOfficeBuilding, 
    HiSearch, HiCheck, HiExclamation
} from "react-icons/hi";
import axios from "axios";
import ConfirmationModal from "./ConfirmationModal";
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
    const [originalFormData, setOriginalFormData] = useState({ 
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
    
    // États pour les modals de confirmation
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const formInitialized = useRef(false);

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
            icon: HiUser,
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

    // Filtrer les propriétaires
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
            const res = await axios.get(`${API_BASE_URL}/proprietaires/`);
            setProprietaires(res.data);
            setError(null);
        } catch (err) {
            setError("❌ Impossible de charger la liste des propriétaires.");
        } finally {
            setIsLoading(false);
        }
    };

    // Réinitialiser le formulaire
    const resetForm = () => {
        const emptyFormData = { 
            nom_proprietaire: "",
            type_proprietaire: "particulier",
            contact: "",
            adresse: ""
        };
        setFormData(emptyFormData);
        setOriginalFormData(emptyFormData);
        setEditingId(null);
        setError(null);
        setSuccess(null);
        setSelectedProprietaire(null);
        setSearchTerm("");
        setSelectedType("all");
        setHasUnsavedChanges(false);
        formInitialized.current = false;
    };

    const handleCloseModal = () => {
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

    const handleCancelEdit = () => {
        if (hasUnsavedChanges) {
            setIsCancelModalOpen(true);
        } else {
            resetForm();
        }
    };

    // Charger les données à l'ouverture
    useEffect(() => {
        if (isOpen) {
            fetchProprietaires();
            resetForm();
            formInitialized.current = true;
        }
    }, [isOpen]);

    // Vérifier les changements non sauvegardés
    useEffect(() => {
        if (formInitialized.current) {
            const hasChanges = 
                formData.nom_proprietaire !== originalFormData.nom_proprietaire ||
                formData.type_proprietaire !== originalFormData.type_proprietaire ||
                formData.contact !== originalFormData.contact ||
                formData.adresse !== originalFormData.adresse;
            
            setHasUnsavedChanges(hasChanges);
        }
    }, [formData, originalFormData]);

    // Gestion des changements de formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError("");
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

    // Validation du formulaire
    const validateForm = () => {
        setError("");
        
        if (!formData.nom_proprietaire.trim()) {
            setError("❌ Le nom du propriétaire est requis.");
            return false;
        }
        
        return true;
    };

    // Ouverture du modal de confirmation avant sauvegarde
    const handleFormSubmitClick = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSaveModalOpen(true);
    };

    // Soumission du formulaire (Création/Modification) après confirmation
    const handleFormSubmit = async () => {
        setIsSaving(true);
        setIsSaveModalOpen(false);
        setError(null);
        setSuccess(null);

        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `${API_BASE_URL}/proprietaires/${editingId}/` : `${API_BASE_URL}/proprietaires/`;

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
            const successMessage = `✅ Propriétaire ${action} avec succès !`;
            
            setSuccess(successMessage);
            setTimeout(() => {
                setSuccess(null);
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

    // Modifier un propriétaire
    const handleEdit = (proprietaire) => {
        // Vérifier s'il y a des changements non sauvegardés avant d'éditer
        if (hasUnsavedChanges && proprietaire.id !== editingId) {
            setError("⚠️ Veuillez sauvegarder ou annuler vos modifications avant d'éditer un autre propriétaire.");
            return;
        }
        
        const newFormData = { 
            nom_proprietaire: proprietaire.nom_proprietaire,
            type_proprietaire: proprietaire.type_proprietaire || "particulier",
            contact: proprietaire.contact || "",
            adresse: proprietaire.adresse || ""
        };
        
        setFormData(newFormData);
        setOriginalFormData(newFormData);
        setEditingId(proprietaire.id);
        setSelectedProprietaire(proprietaire);
        setError(null);
        setSuccess(null);
    };

    // Ouvrir le modal de confirmation de suppression
    const handleDeleteClick = (id, nom, e) => {
        if (e) e.stopPropagation();
        
        // Vérifier s'il y a des changements non sauvegardés
        if (hasUnsavedChanges) {
            setError("⚠️ Veuillez sauvegarder ou annuler vos modifications avant de supprimer un propriétaire.");
            return;
        }
        
        setItemToDelete({ id, nom });
        setIsDeleteModalOpen(true);
    };

    // Supprimer un propriétaire après confirmation
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        
        setIsDeleting(true);
        setIsDeleteModalOpen(false);
        
        const { id, nom } = itemToDelete;

        try {
            await axios.delete(`${API_BASE_URL}/proprietaires/${id}/`);
            await fetchProprietaires();
            onSuccess();
            showSuccess("✅ Propriétaire supprimé avec succès !");
            resetForm();
        } catch (err) {
            console.error("Erreur de suppression :", err.response?.data || err);
            setError("❌ Échec de la suppression : Ce propriétaire est peut-être lié à des navires existants.");
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    // Fonction pour confirmer la fermeture
    const confirmClose = () => {
        setIsCloseModalOpen(false);
        forceClose();
    };

    // Fonction pour confirmer l'annulation
    const confirmCancel = () => {
        setIsCancelModalOpen(false);
        resetForm();
    };

    // Récupérer le label du type
    const getTypeLabel = (type) => {
        return typeConfig[type]?.label || "Autre";
    };

    if (!isOpen) return null;

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
                } ${isDeleting || isSaving ? 'opacity-75' : ''}`}
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
                                {isSelected && hasUnsavedChanges && (
                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                        (modification en cours)
                                    </span>
                                )}
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
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Modifier"
                        disabled={formLoading || isDeleting || isSaving || hasUnsavedChanges}
                    >
                        <HiPencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleDeleteClick(proprietaire.id, proprietaire.nom_proprietaire, e)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Supprimer"
                        disabled={formLoading || isDeleting || isSaving || hasUnsavedChanges}
                    >
                        <HiTrash className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
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
                            title="Fermer"
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
                                            onClick={handleCancelEdit}
                                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50"
                                            disabled={isSaving || isDeleting}
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
                                    <div className={`px-4 py-3 rounded-xl flex items-center gap-3 mb-6 ${
                                        error.includes("❌") 
                                            ? "bg-red-50 border border-red-200 text-red-700"
                                            : error.includes("⚠️")
                                            ? "bg-yellow-50 border border-yellow-200 text-yellow-700"
                                            : "bg-red-50 border border-red-200 text-red-700"
                                    }`}>
                                        <HiExclamation className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-medium">{error.replace(/^[❌⚠️]\s*/, '')}</span>
                                    </div>
                                )}
                                
                                {success && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                                        <HiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <span className="font-medium">{success}</span>
                                    </div>
                                )}
                                
                                {/* Formulaire de Création / Modification */}
                                <form onSubmit={handleFormSubmitClick} className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Nom du propriétaire *
                                                {hasUnsavedChanges && formData.nom_proprietaire !== originalFormData.nom_proprietaire && (
                                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                                        (modifié)
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                type="text"
                                                name="nom_proprietaire"
                                                value={formData.nom_proprietaire}
                                                onChange={handleChange}
                                                placeholder="Ex: Société Maritime ABC"
                                                className={`w-full border rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 ${
                                                    hasUnsavedChanges && formData.nom_proprietaire !== originalFormData.nom_proprietaire
                                                        ? 'border-amber-300'
                                                        : 'border-slate-300'
                                                }`}
                                                required
                                                disabled={isSaving || isDeleting}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Type de propriétaire *
                                                {hasUnsavedChanges && formData.type_proprietaire !== originalFormData.type_proprietaire && (
                                                    <span className="ml-2 text-xs text-amber-600 font-normal">
                                                        (modifié)
                                                    </span>
                                                )}
                                            </label>
                                            <select
                                                name="type_proprietaire"
                                                value={formData.type_proprietaire}
                                                onChange={handleChange}
                                                className={`w-full border rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 bg-white ${
                                                    hasUnsavedChanges && formData.type_proprietaire !== originalFormData.type_proprietaire
                                                        ? 'border-amber-300'
                                                        : 'border-slate-300'
                                                }`}
                                                required
                                                disabled={isSaving || isDeleting}
                                            >
                                                {Object.entries(typeConfig).map(([value, config]) => (
                                                    <option key={value} value={value}>
                                                        {config.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Contact
                                            {hasUnsavedChanges && formData.contact !== originalFormData.contact && (
                                                <span className="ml-2 text-xs text-amber-600 font-normal">
                                                    (modifié)
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            name="contact"
                                            value={formData.contact}
                                            onChange={handleChange}
                                            placeholder="Ex: +261 34 00 000 00"
                                            className={`w-full border rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 ${
                                                hasUnsavedChanges && formData.contact !== originalFormData.contact
                                                    ? 'border-amber-300'
                                                    : 'border-slate-300'
                                            }`}
                                            disabled={isSaving || isDeleting}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Adresse
                                            {hasUnsavedChanges && formData.adresse !== originalFormData.adresse && (
                                                <span className="ml-2 text-xs text-amber-600 font-normal">
                                                    (modifié)
                                                </span>
                                            )}
                                        </label>
                                        <textarea
                                            name="adresse"
                                            value={formData.adresse}
                                            onChange={handleChange}
                                            placeholder="Ex: Lot 123, Andavamamba, Antananarivo"
                                            rows="4"
                                            className={`w-full border rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 resize-none ${
                                                hasUnsavedChanges && formData.adresse !== originalFormData.adresse
                                                    ? 'border-amber-300'
                                                    : 'border-slate-300'
                                            }`}
                                            disabled={isSaving || isDeleting}
                                        />
                                    </div>

                                    {/* Boutons du formulaire */}
                                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50"
                                            disabled={isSaving || isDeleting}
                                        >
                                            <HiX className="w-4 h-4" />
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving || isDeleting || (!hasUnsavedChanges && editingId)}
                                            className={`flex items-center gap-2 px-8 py-3 font-semibold rounded-xl transition-all duration-200 ${
                                                isSaving || isDeleting
                                                    ? "bg-slate-400 cursor-not-allowed text-white" 
                                                    : editingId 
                                                    ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800 shadow-sm hover:shadow-md"
                                                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md"
                                            } ${!hasUnsavedChanges && editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={!hasUnsavedChanges && editingId ? "Aucune modification détectée" : ""}
                                        >
                                            {isSaving ? (
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

            {/* Modal de confirmation pour la sauvegarde */}
            {isSaveModalOpen && (
                <ConfirmationModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    onConfirm={handleFormSubmit}
                    title={editingId ? "Modifier le propriétaire" : "Ajouter un propriétaire"}
                    message={
                        <div className="space-y-2">
                            <p>
                                {editingId ? "Confirmez-vous la modification du propriétaire" : "Confirmez-vous l'ajout du propriétaire"}
                                <span className="font-bold text-black"> "{formData.nom_proprietaire}" </span>
                                ?
                            </p>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="font-medium text-slate-700">Détails :</p>
                                <ul className="text-sm text-slate-600 mt-1 space-y-1">
                                    <li className="flex">
                                        <span className="w-20 font-medium">Nom :</span>
                                        <span className="font-bold text-black">{formData.nom_proprietaire}</span>
                                    </li>
                                    <li className="flex">
                                        <span className="w-20 font-medium">Type :</span>
                                        <span className="font-bold text-black">{getTypeLabel(formData.type_proprietaire)}</span>
                                    </li>
                                    {formData.contact && (
                                        <li className="flex">
                                            <span className="w-20 font-medium">Contact :</span>
                                            <span className="font-bold text-black">{formData.contact}</span>
                                        </li>
                                    )}
                                    {formData.adresse && (
                                        <li className="flex">
                                            <span className="w-20 font-medium">Adresse :</span>
                                            <span className="font-bold text-black">{formData.adresse}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
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
                    title="Supprimer le propriétaire"
                    message={
                        <div>
                            Êtes-vous certain de vouloir supprimer définitivement le propriétaire 
                            <span className="font-bold text-black"> "{itemToDelete.nom}" </span>
                            ? Cette action est irréversible et peut affecter les navires associés.
                        </div>
                    }
                    confirmButtonText="Supprimer définitivement"
                    type="danger"
                    isLoading={isDeleting}
                    disableConfirm={isDeleting}
                />
            )}

            {/* Modal de confirmation pour annuler l'édition */}
            {isCancelModalOpen && (
                <ConfirmationModal
                    isOpen={isCancelModalOpen}
                    onClose={() => setIsCancelModalOpen(false)}
                    onConfirm={confirmCancel}
                    title="Annuler les modifications"
                    message={
                        <div>
                            Vous avez modifié le propriétaire 
                            <span className="font-bold text-black"> "{formData.nom_proprietaire}" </span>
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
                            <div className="bg-slate-50 p-3 rounded-lg mb-3 space-y-1">
                                {formData.nom_proprietaire !== originalFormData.nom_proprietaire && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Nom modifié : <span className="font-bold text-black">{formData.nom_proprietaire || "(vide)"}</span>
                                        </span>
                                    </p>
                                )}
                                {formData.type_proprietaire !== originalFormData.type_proprietaire && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Type modifié : <span className="font-bold text-black">{getTypeLabel(formData.type_proprietaire)}</span>
                                        </span>
                                    </p>
                                )}
                                {formData.contact !== originalFormData.contact && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Contact modifié : <span className="font-bold text-black">{formData.contact || "(vide)"}</span>
                                        </span>
                                    </p>
                                )}
                                {formData.adresse !== originalFormData.adresse && (
                                    <p className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            Adresse modifiée : <span className="font-bold text-black">{formData.adresse || "(vide)"}</span>
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
};

export default ProprietaireModal;