import { FaShip } from "react-icons/fa";

export default function GeneralInfoSection({ navire, handleChange }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <FaShip className="text-lg text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Informations Générales</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Nom du navire <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="nom_navire"
            value={navire.nom_navire}
            onChange={handleChange}
            placeholder="Ex: Le Titan"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Numéro d'immatriculation <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="num_immatricule"
            value={navire.num_immatricule}
            onChange={handleChange}
            placeholder="Ex: TMM-00123"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Type de navire</label>
          <input
            type="text"
            name="type_navire"
            value={navire.type_navire}
            onChange={handleChange}
            placeholder="Ex: Pirogue, Cargo, Pêcheur"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Numéro IMO</label>
          <input
            type="text"
            name="imo"
            value={navire.imo}
            onChange={handleChange}
            placeholder="Ex: 9000000 (facultatif)"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Numéro MMSI</label>
          <input
            type="text"
            name="mmsi"
            value={navire.mmsi}
            onChange={handleChange}
            placeholder="Ex: 600000000 (facultatif)"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>
      </div>
    </div>
  );
}