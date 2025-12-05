import { FaList, FaEdit } from "react-icons/fa";

export default function ActivitesSection({ activites, selectedActivites, handleActiviteChange, onOpenModal }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <FaList className="text-lg text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Activités</h2>
        </div>
        <button
          type="button"
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold shadow-md"
        >
          <FaEdit /> Gérer les activités
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {activites.length === 0 ? (
          <p className="col-span-4 text-gray-500">
            Aucune activité disponible. Cliquez sur "Gérer les activités" pour en ajouter.
          </p>
        ) : (
          activites.map(activite => (
            <div key={activite.id} className="flex items-center">
              <input
                id={`activite-${activite.id}`}
                type="checkbox"
                checked={selectedActivites.includes(activite.id)}
                onChange={() => handleActiviteChange(activite.id)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label 
                htmlFor={`activite-${activite.id}`} 
                className="ml-3 text-sm font-medium text-gray-700 cursor-pointer"
              >
                {activite.nom_activite}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}