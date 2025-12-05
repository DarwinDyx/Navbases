import { FaHammer } from "react-icons/fa";

export default function ConstructionSection({ navire, handleChange, natureCoqueOptions }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <FaHammer className="text-lg text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Construction et Capacité</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Lieu de construction</label>
          <input
            type="text"
            name="lieu_de_construction"
            value={navire.lieu_de_construction}
            onChange={handleChange}
            placeholder="Ex: Antananarivo, Port-Louis"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Année de construction</label>
          <input
            type="number"
            name="annee_de_construction"
            value={navire.annee_de_construction}
            onChange={handleChange}
            placeholder="Ex: 2010"
            min="1800"
            max={new Date().getFullYear()}
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Nature de la coque</label>
          <select
            name="nature_coque"
            value={navire.nature_coque}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
          >
            <option value="">-- Sélectionner --</option>
            {natureCoqueOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Capacité passagers</label>
          <input
            type="number"
            name="nbr_passager"
            value={navire.nbr_passager}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Nombre d'équipage</label>
          <input
            type="number"
            name="nbr_equipage"
            value={navire.nbr_equipage}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>
      </div>
    </div>
  );
}