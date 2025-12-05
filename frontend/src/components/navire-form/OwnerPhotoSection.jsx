import Select from "react-select";
import { FaUser, FaImage, FaPlus, FaTimes } from "react-icons/fa";

export default function OwnerPhotoSection({ 
  navire, 
  handleChange, 
  proprietaireOptions, 
  selectedProprietaireOption, 
  handleProprietaireSelectChange, 
  onOpenModal,
  imagePreview,
  onRemoveProprietaire 
}) {
  
  const handleSelectChange = (selectedOption) => {
    console.log("Option sélectionnée:", selectedOption);
    handleProprietaireSelectChange(selectedOption);
  };

  const handleRemoveClick = () => {
    console.log("Retrait du propriétaire");
    handleProprietaireSelectChange(null);
    if (onRemoveProprietaire) {
      onRemoveProprietaire();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-blue-100">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <FaUser className="text-lg text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Propriétaire et Visuel</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">
              <FaUser className="inline mr-2 text-blue-500" />
              Propriétaire
            </label>
            
            {selectedProprietaireOption && (
              <button
                type="button"
                onClick={handleRemoveClick}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FaTimes className="text-xs" />
                Retirer
              </button>
            )}
          </div>
          
          <div className="flex gap-3 items-center">
            <Select
              name="proprietaire_id" 
              options={proprietaireOptions}
              value={selectedProprietaireOption}
              onChange={handleSelectChange}
              isClearable
              placeholder="Sélectionner un propriétaire..."
              noOptionsMessage={() => "Aucun propriétaire trouvé"}
              className="flex-grow text-gray-700"
              styles={{ 
                control: (base) => ({
                  ...base,
                  minHeight: '4rem', 
                  borderRadius: '0.75rem',
                  borderColor: '#e5e7eb', 
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#3b82f6', 
                  },
                  backgroundColor: '#eff6ff33', 
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9ca3af', 
                  fontSize: '0.875rem',
                }),
                singleValue: (base) => ({
                  ...base,
                  fontWeight: 500,
                }),
                clearIndicator: (base) => ({
                  ...base,
                  color: '#6b7280',
                  '&:hover': {
                    color: '#374151',
                  }
                }),
              }}
            />
            
            <button
              type="button"
              onClick={onOpenModal}
              className="p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center min-w-[56px] shadow-md"
              title="Ajouter un nouveau propriétaire"
            >
              <FaPlus className="text-lg" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {selectedProprietaireOption ? (
              <span className="text-green-600 font-medium">
                ✓ Propriétaire assigné
              </span>
            ) : (
              <span className="text-gray-500">
                Aucun propriétaire assigné
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            <FaImage className="inline mr-2 text-blue-500" />
            Photo du navire
          </label>
          <div className="space-y-6">
            <input
              type="file"
              name="photo_navire"
              accept="image/*"
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
            />
            
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Aperçu :</p>
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Aperçu du navire" 
                    className="w-56 h-56 object-cover rounded-2xl border-4 border-white shadow-xl"
                  />
                  <div className="absolute inset-0 border-2 border-blue-300 rounded-2xl pointer-events-none"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}