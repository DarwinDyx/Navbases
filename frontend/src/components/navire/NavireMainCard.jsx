import { Link } from "react-router-dom";
import { HiPhotograph, HiClipboardList, HiUsers, HiTag, HiOfficeBuilding, HiHashtag, HiIdentification } from "react-icons/hi";
import { FaShip, FaIdCard, FaCalendarAlt, FaCertificate, FaSatelliteDish, FaBarcode } from "react-icons/fa";

export default function NavireMainCard({ navire }) {
  
  // Fonction pour obtenir l'icône selon le type de propriétaire
  const getProprietaireIcon = (type) => {
    switch (type) {
      case 'entreprise': return <HiOfficeBuilding className="w-4 h-4" />;
      case 'gouvernement': return '🏛️';
      case 'association': return '👥';
      default: return <HiUsers className="w-4 h-4" />;
    }
  };

  // Fonction pour obtenir le libellé du type
  const getProprietaireTypeLabel = (type) => {
    switch (type) {
      case 'particulier': return 'Particulier';
      case 'entreprise': return 'Entreprise';
      case 'gouvernement': return 'Gouvernement';
      case 'association': return 'Association';
      case 'autre': return 'Autre';
      default: return type || 'Non spécifié';
    }
  };

  // Fonction pour obtenir la couleur du badge selon le type
  const getProprietaireTypeColor = (type) => {
    switch (type) {
      case 'particulier': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'entreprise': return 'bg-green-100 text-green-800 border-green-200';
      case 'gouvernement': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'association': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderProprietaire = () => {
    if (navire.proprietaire) {
      const nom = navire.proprietaire.nom_proprietaire || `ID: ${navire.proprietaire.id}`;
      return (
        <Link 
          to={`/proprietaires/${navire.proprietaire.id}`} 
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {nom}
        </Link>
      );
    }
    return "—";
  };

  return (
    <div className="space-y-6">
      
      {/* EN-TÊTE AVEC PHOTO ET IDENTITÉ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          
          {/* Photo du navire */}
          <div className="lg:w-80 xl:w-96 h-64 lg:h-auto bg-slate-100 relative">
            {navire.photo_navire ? (
              <img 
                src={navire.photo_navire} 
                alt={navire.nom_navire} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <HiPhotograph className="w-16 h-16 mb-3" />
                <p className="font-medium">Aucune photo disponible</p>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-full shadow-lg">
                {navire.type_navire || "Non spécifié"}
              </span>
            </div>
          </div>

          {/* Identité du navire */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FaShip className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{navire.nom_navire}</h1>
                <p className="text-slate-600 mt-1 text-sm">ID: {navire.id}</p>
              </div>
            </div>

            {/* Cartes d'informations principales */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaIdCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-700">Immatriculation</h3>
                </div>
                <p className="text-base font-semibold text-slate-900">{navire.num_immatricule || "—"}</p>
              </div>

              <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaCertificate className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-700">IMO</h3>
                </div>
                <p className="text-base font-semibold text-slate-900">{navire.imo || "—"}</p>
              </div>

              <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaSatelliteDish className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-700">MMSI</h3>
                </div>
                <p className="text-base font-semibold text-slate-900">{navire.mmsi || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION CARACTÉRISTIQUES DÉTAILLÉES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-3">
            <FaCalendarAlt className="w-5 h-5 text-blue-600" />
            Construction et caractéristiques
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Colonne 1 : Construction */}
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4 text-blue-600" />
                  Construction
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-600 text-sm">Année</span>
                    <span className="font-medium text-slate-900">{navire.annee_de_construction || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-600 text-sm">Lieu</span>
                    <span className="font-medium text-slate-900">{navire.lieu_de_construction || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600 text-sm">Nature coque</span>
                    <span className="font-medium text-slate-900">{navire.nature_coque || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 2 : informations complémentaires */}
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FaBarcode className="w-4 h-4 text-blue-600" />
                  Informations complémentaires
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-600 text-sm">Type du navire</span>
                    <span className="font-medium text-slate-900">
                      {navire.type_navire || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-slate-600 text-sm">Nombre d'équipage</span>
                    <span className="font-medium text-slate-900">
                      {navire.nbr_equipage || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600 text-sm">Nombre de passagers</span>
                    <span className="font-medium text-slate-900">
                      {navire.nbr_passager || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION ACTIVITÉS */}
      {navire.activites && navire.activites.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 lg:p-8">
            <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <HiClipboardList className="w-4 h-4 text-blue-600" />
              Activités pratiquées
            </h3>
            <div className="flex flex-wrap gap-2">
              {navire.activites.map(activite => (
                <span 
                  key={activite.id}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-normal"
                >
                  {activite.nom_activite}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION PROPRIÉTAIRE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <HiUsers className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Propriétaire</h2>
              <p className="text-slate-600 text-sm">Informations du propriétaire du navire</p>
            </div>
          </div>

          {navire.proprietaire ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Nom du propriétaire</h3>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-medium text-slate-900">
                    {renderProprietaire()}
                  </p>
                </div>
              </div>

              {/* NOUVEAU : Type de propriétaire */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Type de propriétaire</h3>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getProprietaireTypeColor(navire.proprietaire.type_proprietaire)}`}>
                    {getProprietaireIcon(navire.proprietaire.type_proprietaire)}
                    {getProprietaireTypeLabel(navire.proprietaire.type_proprietaire)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Contact</h3>
                <p className="text-base text-slate-900 font-normal">
                  {navire.proprietaire.contact || "—"}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Adresse</h3>
                <p className="text-slate-900 text-sm">
                  {navire.proprietaire.adresse || "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <HiUsers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700 mb-2">Aucun propriétaire assigné</h3>
              <p className="text-slate-500 text-sm">Ce navire n'a pas de propriétaire associé pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}