import { useState, useEffect } from "react";
import { HiX } from "react-icons/hi";
import { API_BASE_URL } from "../../config/api"; // Ajustez le chemin selon votre structure

export default function VisiteModal({ isOpen, onClose, visite, navireId, onSave }) {
  const [formData, setFormData] = useState({
    date_visite: "",
    expiration_permis: "",
    lieu_visite: ""
  });

  useEffect(() => {
    if (visite) {
      setFormData(visite);
    } else {
      setFormData({
        date_visite: "",
        expiration_permis: "",
        lieu_visite: ""
      });
    }
  }, [visite]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = visite 
        ? `${API_BASE_URL}/visites/${visite.id}/`
        : `${API_BASE_URL}/visites/`;
      
      const method = visite ? "PUT" : "POST";
      
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
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {visite ? "Modifier la visite" : "Ajouter une visite"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <HiX className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date de visite *
            </label>
            <input
              type="date"
              required
              value={formData.date_visite}
              onChange={(e) => setFormData({...formData, date_visite: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Expiration du permis *
            </label>
            <input
              type="date"
              required
              value={formData.expiration_permis}
              onChange={(e) => setFormData({...formData, expiration_permis: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lieu de visite *
            </label>
            <input
              type="text"
              required
              value={formData.lieu_visite}
              onChange={(e) => setFormData({...formData, lieu_visite: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Port de Toamasina"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
            >
              {visite ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}