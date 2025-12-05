import { useState, useEffect } from "react";
import { HiX } from "react-icons/hi";
import { FaCheck } from "react-icons/fa"; 

export default function MoteurModal({ isOpen, onClose, moteur, navireId, onSave }) {
    const [formData, setFormData] = useState({
        nom_moteur: "",
        puissance: ""
    });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (moteur) {
            setFormData(moteur);
        } else {
            setFormData({
                nom_moteur: "",
                puissance: ""
            });
        }
        setError(null);
        setIsConfirmModalOpen(false); 
    }, [moteur, isOpen]); 

    // Ouvre le modal de confirmation au lieu d'appeler l'API
    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        // Vérifiez ici que les champs obligatoires ne sont pas vides avant d'ouvrir la confirmation (bonne pratique)
        if (!formData.nom_moteur || !formData.puissance) {
             setError("Veuillez remplir tous les champs obligatoires.");
             return;
        }
        setIsConfirmModalOpen(true);
    };

    // Fonction qui exécute l'appel API après la confirmation
    const handleConfirmSubmit = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setIsConfirmModalOpen(false); // Ferme le modal de confirmation

        try {
            const isEditing = !!moteur;
            const url = isEditing 
                ? `http://127.0.0.1:8000/api/moteurs/${moteur.id}/`
                : "http://127.0.0.1:8000/api/moteurs/";
            
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
                setError(`Échec : ${errorMessage}`);
            }
        } catch (err) {
            setError("Erreur de connexion au serveur.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClose = () => {
        setIsConfirmModalOpen(false);
        onClose();
    };

    if (!isOpen) return null;

    const isEditing = !!moteur;
    // Détermine la couleur du modal : Jaune pour Modification, Vert pour Ajout
    const modalColor = isEditing ? 'yellow' : 'green';

    // Rendu conditionnel du modal de confirmation basé sur le type d'action
    const renderConfirmationModal = () => {
        // Définition des classes de style
        const baseClasses = "rounded-2xl w-full max-w-sm shadow-xl";
        const theme = {
            yellow: {
                bg: "bg-yellow-50 border border-yellow-300",
                title: "text-yellow-800 border-yellow-200",
                text: "text-yellow-700",
                button: "bg-yellow-600 hover:bg-yellow-700"
            },
            green: {
                bg: "bg-green-50 border border-green-300",
                title: "text-green-800 border-green-200",
                text: "text-green-700",
                button: "bg-green-600 hover:bg-green-700"
            }
        };

        const currentTheme = theme[modalColor];

        return (
            <div 
                // Z-index supérieur pour s'assurer qu'il est au-dessus du modal principal
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4"
                onClick={() => setIsConfirmModalOpen(false)} 
            >
                <div 
                    className={`${baseClasses} ${currentTheme.bg}`}
                    onClick={e => e.stopPropagation()} 
                >
                    <div className="p-6">
                        <h3 className={`text-xl font-bold flex items-center gap-2 border-b pb-3 mb-4 ${currentTheme.title}`}>
                            {isEditing ? '⚠️ Confirmer la Modification' : '✅ Confirmer l\'Ajout'}
                        </h3>
                        <p className={`${currentTheme.text} mb-6`}>
                            Êtes-vous certain de vouloir **{isEditing ? 'modifier' : 'ajouter'}** le moteur "{formData.nom_moteur}" ?
                        </p>
                        
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                className={`px-5 py-2 text-gray-700 border border-slate-300 rounded-xl hover:bg-slate-100 font-medium transition-colors`}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSubmit}
                                className={`px-5 py-2 text-white rounded-xl font-medium flex items-center gap-2 transition-colors ${currentTheme.button}`}
                                disabled={isSubmitting}
                            >
                                <FaCheck /> {isSubmitting ? 'En cours...' : 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        // ARRIÈRE-PLAN AVEC FLOU (backdrop-blur-sm)
        <div 
            className="fixed inset-0 bg-black/50 **backdrop-blur-sm** flex items-center justify-center z-50 p-4" 
            onClick={() => !isConfirmModalOpen && handleClose()}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* En-tête */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">
                        {isEditing ? "Modifier le moteur" : "Ajouter un moteur"}
                    </h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                        <HiX className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Message d'erreur */}
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl font-medium text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Champs du Formulaire */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nom du moteur *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.nom_moteur}
                            onChange={(e) => setFormData({...formData, nom_moteur: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Moteur principal"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Puissance *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.puissance}
                            onChange={(e) => setFormData({...formData, puissance: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: 200 CV"
                            disabled={isSubmitting}
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                            disabled={isSubmitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className={`px-6 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors ${isSubmitting ? 'bg-blue-400' : 'hover:bg-blue-700'}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Préparation...' : (isEditing ? "Modifier" : "Ajouter")}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* Rendu conditionnel du modal de confirmation */}
            {isConfirmModalOpen && renderConfirmationModal()}
        </div>
    );
}