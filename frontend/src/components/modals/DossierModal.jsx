import { useState, useEffect } from "react";
import { HiX } from "react-icons/hi";

export default function DossierModal({ isOpen, onClose, dossier, navireId, onSave }) {
  const [formData, setFormData] = useState({
    type_dossier: "",
    date_emission: "",
    date_expiration: ""
  });

  useEffect(() => {
    if (dossier) {
      setFormData(dossier);
    } else {
      setFormData({
        type_dossier: "",
        date_emission: "",
        date_expiration: ""
      });
    }
  }, [dossier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = dossier 
        ? `http://127.0.0.1:8000/api/dossiers/${dossier.id}/`
        : "http://127.0.0.1:8000/api/dossiers/";
      
      const method = dossier ? "PUT" : "POST";
      
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
            {dossier ? "Modifier le dossier" : "Ajouter un dossier"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <HiX className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type de dossier *
            </label>
            <input
              type="text"
              required
              value={formData.type_dossier}
              onChange={(e) => setFormData({...formData, type_dossier: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Permis de navigation, Certificat..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date d'émission *
            </label>
            <input
              type="date"
              required
              value={formData.date_emission}
              onChange={(e) => setFormData({...formData, date_emission: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date d'expiration
            </label>
            <input
              type="date"
              value={formData.date_expiration || ""}
              onChange={(e) => setFormData({...formData, date_expiration: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              {dossier ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}