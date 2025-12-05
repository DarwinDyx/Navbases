import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from 'react-select';
import {
  HiSearch,
  HiPlus,
  HiPhotograph,
  HiUsers,
  HiCalendar,
  HiTag,
  HiUser,
  HiChip,
  HiDownload,
  HiChevronRight,
  HiX,
  HiFilter,
  HiChevronDown
} from "react-icons/hi";
import { FaShip, FaIdCard, FaSatellite } from "react-icons/fa";
import { API_BASE_URL } from "../config/api";

export default function NavireList() {
  const [navires, setNavires] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [typesNavire, setTypesNavire] = useState([]);
  const [proprietaires, setProprietaires] = useState([]);
  const [activites, setActivites] = useState([]);
  const [showFiltres, setShowFiltres] = useState(false);
  
  // États unifiés pour les filtres
  const [filtres, setFiltres] = useState({
    types_navire: [],
    proprietaires: [],
    activites: [],
    annee_min: "",
    annee_max: "",
    has_mmsi: null
  });

  const [naviresFiltres, setNaviresFiltres] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/navires/`).then(res => res.json()),
      fetch(`${API_BASE_URL}/proprietaires/`).then(res => res.json()),
      fetch(`${API_BASE_URL}/activites/`).then(res => res.json())
    ])
    .then(([naviresData, proprietairesData, activitesData]) => {
      setNavires(naviresData);
      setProprietaires(proprietairesData);
      setActivites(activitesData);
      
      const typesUniques = [...new Set(naviresData.map(n => n.type_navire).filter(Boolean))];
      setTypesNavire(typesUniques);
      
      setIsLoading(false);
    })
    .catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, []);

  // Options pour React-Select
  const typeOptions = useMemo(() => 
    typesNavire.map(type => ({ value: type, label: type })),
    [typesNavire]
  );

  const proprietaireOptions = useMemo(() => 
    proprietaires.map(prop => ({ value: prop.id, label: prop.nom_proprietaire })),
    [proprietaires]
  );

  const activiteOptions = useMemo(() => 
    activites.map(act => ({ value: act.id, label: act.nom_activite })),
    [activites]
  );

  const mmsiOptions = useMemo(() => [
    { value: null, label: "Tous les navires" },
    { value: true, label: "Avec MMSI" },
    { value: false, label: "Sans MMSI" }
  ], []);

  // Styles personnalisés pour React-Select
  const customStyles = {
    control: (base, state) => ({
      ...base,
      border: '1px solid #d1d5db',
      borderRadius: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 2px #3b82f6' : 'none',
      '&:hover': {
        borderColor: '#9ca3af'
      },
      minHeight: '42px',
      fontSize: '14px'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      zIndex: 20,
      fontSize: '14px'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      fontSize: '14px',
      '&:active': {
        backgroundColor: '#3b82f6',
        color: 'white'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#3b82f6',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'white',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'white',
      ':hover': {
        backgroundColor: '#ef4444',
        color: 'white',
      },
    }),
  };

  // Fonction de filtrage unifiée
  const appliquerFiltres = useCallback(() => {
    let resultats = navires;
    
    // Filtre par recherche texte
    if (search) {
      const searchTerm = search.toLowerCase();
      resultats = resultats.filter(navire => 
        navire.nom_navire?.toLowerCase().includes(searchTerm) ||
        navire.num_immatricule?.toLowerCase().includes(searchTerm) ||
        navire.type_navire?.toLowerCase().includes(searchTerm) ||
        navire.proprietaire?.nom_proprietaire?.toLowerCase().includes(searchTerm) ||
        navire.mmsi?.toString().includes(searchTerm)
      );
    }
    
    // Filtre par types
    if (filtres.types_navire.length > 0) {
      const typesSelected = filtres.types_navire.map(t => t.value);
      resultats = resultats.filter(navire => 
        typesSelected.includes(navire.type_navire)
      );
    }
    
    // Filtre par propriétaires
    if (filtres.proprietaires.length > 0) {
      const proprietairesSelected = filtres.proprietaires.map(p => p.value);
      resultats = resultats.filter(navire => 
        proprietairesSelected.includes(navire.proprietaire?.id)
      );
    }
    
    // Filtre par activités
    if (filtres.activites.length > 0) {
      const activitesSelected = filtres.activites.map(a => a.value);
      resultats = resultats.filter(navire => 
        navire.activites?.some(act => activitesSelected.includes(act.id))
      );
    }
    
    // Filtre par année
    if (filtres.annee_min) {
      resultats = resultats.filter(navire => 
        navire.annee_de_construction >= parseInt(filtres.annee_min)
      );
    }
    
    if (filtres.annee_max) {
      resultats = resultats.filter(navire => 
        navire.annee_de_construction <= parseInt(filtres.annee_max)
      );
    }

    // Filtre par MMSI
    if (filtres.has_mmsi !== null) {
      if (filtres.has_mmsi === true) {
        resultats = resultats.filter(navire => navire.mmsi);
      } else {
        resultats = resultats.filter(navire => !navire.mmsi);
      }
    }
    
    setNaviresFiltres(resultats);
  }, [navires, search, filtres]);

  // Applique les filtres automatiquement quand ils changent
  useEffect(() => {
    appliquerFiltres();
  }, [appliquerFiltres]);

  // FONCTION D'EXPORT CORRIGÉE - LE PARAMÈTRE SEARCH EST MAINTENANT ENVOYÉ
  const handleExportFiltres = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      
      // ENVOI EFFECTIF DU PARAMÈTRE SEARCH
      if (search) {
        params.append('search', search);
        console.log("🔍 Paramètre search envoyé:", search);
      }
      
      // Envoi des autres filtres
      filtres.types_navire.forEach(item => {
        params.append('types_navire[]', item.value);
      });
      
      filtres.proprietaires.forEach(item => {
        params.append('proprietaires[]', item.value);
      });

      filtres.activites.forEach(item => {
        params.append('activites[]', item.value);
      });
      
      if (filtres.annee_min) {
        params.append('annee_min', filtres.annee_min);
      }
      
      if (filtres.annee_max) {
        params.append('annee_max', filtres.annee_max);
      }

      const url = `${API_BASE_URL}/navires/export_csv_filtered/?${params.toString()}`;
      
      console.log("📤 URL d'export COMPLÈTE:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Erreur export');
      
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `navires_filtres_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlBlob);
      
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export des données');
    } finally {
      setExportLoading(false);
    }
  };

  const resetFiltres = () => {
    setFiltres({
      types_navire: [],
      proprietaires: [],
      activites: [],
      annee_min: "",
      annee_max: "",
      has_mmsi: null
    });
    setSearch("");
  };

  const totalMMSI = useMemo(() => 
    naviresFiltres.reduce((sum, navire) => sum + (navire.mmsi ? 1 : 0), 0), 
    [naviresFiltres]
  );

  const totalIMO = useMemo(() => 
    naviresFiltres.reduce((sum, navire) => sum + (navire.imo ? 1 : 0), 0), 
    [naviresFiltres]
  );

  const handleNavireClick = (navireId) => {
    navigate(`/navires/${navireId}`);
  };

  // Compteur de filtres actifs
  const filtresActifsCount = useMemo(() => {
    let count = 0;
    if (filtres.types_navire.length > 0) count++;
    if (filtres.proprietaires.length > 0) count++;
    if (filtres.activites.length > 0) count++;
    if (filtres.annee_min) count++;
    if (filtres.annee_max) count++;
    if (filtres.has_mmsi !== null) count++;
    if (search) count++;
    return count;
  }, [filtres, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FaShip className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Liste des Navires</h1>
              <p className="text-slate-600 mt-1">
                {naviresFiltres.length} navire{naviresFiltres.length !== 1 ? 's' : ''} correspondant aux critères
                {naviresFiltres.length !== navires.length && ` (sur ${navires.length} au total)`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Bouton Export unifié */}
            <button
              onClick={handleExportFiltres}
              disabled={exportLoading || naviresFiltres.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${
                exportLoading || naviresFiltres.length === 0
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg shadow-md"
              }`}
            >
              <HiDownload className="w-4 h-4" />
              Exporter ({naviresFiltres.length})
            </button>
            
            <Link
              to="/navires/new"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-md transition-all duration-200 font-semibold text-center"
            >
              <HiPlus className="w-5 h-5" />
              Nouveau Navire
            </Link>
          </div>
        </div>

        {/* Barre de recherche et bouton filtres */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un navire par nom, immatriculation, type, propriétaire ou MMSI..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Bouton Filtres */}
            <button
              onClick={() => setShowFiltres(!showFiltres)}
              className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-xl font-semibold transition-all duration-200 ${
                showFiltres 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <HiFilter className="w-4 h-4" />
              Filtres
              {filtresActifsCount > 0 && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  showFiltres ? "bg-white text-blue-600" : "bg-blue-100 text-blue-800"
                }`}>
                  {filtresActifsCount}
                </span>
              )}
            </button>
          </div>

          {/* Section Filtres (conditionnelle) */}
          {showFiltres && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
                
                {/* Filtre Types */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Types de navires
                  </label>
                  <Select
                    isMulti
                    value={filtres.types_navire}
                    onChange={(selected) => setFiltres(prev => ({...prev, types_navire: selected}))}
                    options={typeOptions}
                    placeholder="Tous les types"
                    styles={customStyles}
                    isSearchable
                    isClearable
                  />
                </div>

                {/* Filtre Propriétaires */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Propriétaires
                  </label>
                  <Select
                    isMulti
                    value={filtres.proprietaires}
                    onChange={(selected) => setFiltres(prev => ({...prev, proprietaires: selected}))}
                    options={proprietaireOptions}
                    placeholder="Tous les propriétaires"
                    styles={customStyles}
                    isSearchable
                    isClearable
                  />
                </div>

                {/* Filtre Activités */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Activités
                  </label>
                  <Select
                    isMulti
                    value={filtres.activites}
                    onChange={(selected) => setFiltres(prev => ({...prev, activites: selected}))}
                    options={activiteOptions}
                    placeholder="Toutes les activités"
                    styles={customStyles}
                    isSearchable
                    isClearable
                  />
                </div>

                {/* Filtre MMSI */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Statut MMSI
                  </label>
                  <Select
                    value={mmsiOptions.find(option => option.value === filtres.has_mmsi)}
                    onChange={(selected) => setFiltres(prev => ({...prev, has_mmsi: selected.value}))}
                    options={mmsiOptions}
                    placeholder="Statut MMSI"
                    styles={customStyles}
                    isSearchable={false}
                  />
                </div>

                {/* Filtre Années */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Année construction
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        placeholder="1900"
                        value={filtres.annee_min}
                        onChange={(e) => setFiltres(prev => ({...prev, annee_min: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        min="1900"
                        max="2030"
                      />
                      <p className="text-xs text-slate-500 mt-1 text-center">Année min</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="2024"
                        value={filtres.annee_max}
                        onChange={(e) => setFiltres(prev => ({...prev, annee_max: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        min="1900"
                        max="2030"
                      />
                      <p className="text-xs text-slate-500 mt-1 text-center">Année max</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions des filtres */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={resetFiltres}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <HiX className="w-4 h-4" />
                  Réinitialiser tous les filtres
                </button>
                
                <div className="text-sm text-slate-500">
                  {naviresFiltres.length} résultat{naviresFiltres.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste des navires (Tableau Desktop / Cartes Mobile) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Chargement des navires...</p>
              </div>
            </div>
          ) : naviresFiltres.length === 0 ? (
            <div className="text-center py-16">
              <HiSearch className="mx-auto h-14 w-14 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium text-lg mb-2">
                {search || filtresActifsCount > 0 ? "Aucun navire trouvé" : "Aucun navire enregistré"}
              </p>
              <p className="text-slate-500 mb-6">
                {search || filtresActifsCount > 0 
                  ? "Aucun navire ne correspond à vos critères de recherche."
                  : "Commencez par ajouter votre premier navire."
                }
              </p>
              {!search && filtresActifsCount === 0 && (
                <Link
                  to="/navires/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  <HiPlus className="w-4 h-4" />
                  Ajouter un navire
                </Link>
              )}
              {(search || filtresActifsCount > 0) && (
                <button
                  onClick={resetFiltres}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                >
                  <HiX className="w-4 h-4" />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* VUE MOBILE (Cartes) - Visible uniquement sur petit écran (block sm:hidden) */}
              <div className="block sm:hidden space-y-4 p-4 bg-slate-50">
                {naviresFiltres.map(navire => (
                  <div 
                    key={navire.id}
                    onClick={() => handleNavireClick(navire.id)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {/* Photo */}
                      <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {navire.photo_navire ? (
                          <img src={navire.photo_navire} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <HiPhotograph className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      
                      {/* Infos principales */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {navire.nom_navire || "Sans nom"}
                        </div>
                        <div className="text-sm text-slate-500 mb-1 font-mono">
                          {navire.num_immatricule || "-"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {navire.type_navire && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {navire.type_navire}
                            </span>
                          )}
                          {navire.mmsi && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              MMSI
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <HiChevronRight className="text-slate-300" />
                    </div>

                    {/* Détails supplémentaires Mobile */}
                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-slate-100 pt-3 mt-2">
                      <div className="text-slate-600">
                        <span className="text-xs text-slate-400 block uppercase tracking-wide">Propriétaire</span>
                        <span className="truncate block">{navire.proprietaire?.nom_proprietaire || "-"}</span>
                      </div>
                      <div className="text-slate-600">
                        <span className="text-xs text-slate-400 block uppercase tracking-wide">MMSI / IMO</span>
                        <span className="truncate block font-mono">{navire.mmsi || navire.imo || "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* VUE DESKTOP (Tableau) - Caché sur petit écran (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Navire
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <FaIdCard className="w-3 h-3" />
                          Immatriculation
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <HiChip className="w-3 h-3" />
                          Type
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <HiUser className="w-3 h-3" />
                          Propriétaire
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <FaSatellite className="w-3 h-3" />
                          MMSI / IMO
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <HiCalendar className="w-3 h-3" />
                          Année
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {naviresFiltres.map(navire => (
                      <tr 
                        key={navire.id}
                        onClick={() => handleNavireClick(navire.id)}
                        className="hover:bg-slate-50 transition-colors duration-150 group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 group-hover:text-blue-600 transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                              {navire.photo_navire ? (
                                <img 
                                  src={navire.photo_navire} 
                                  alt={navire.nom_navire}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <HiPhotograph className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                                {navire.nom_navire || "Sans nom"}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                ID: {navire.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <HiTag className="w-4 h-4 text-slate-400" />
                            <span className="font-mono text-sm font-medium text-slate-700">
                              {navire.num_immatricule || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {navire.type_navire ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {navire.type_navire}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <HiUser className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">
                              {navire.proprietaire?.nom_proprietaire || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-sm">
                            {navire.mmsi ? (
                              <div className="flex items-center gap-2">
                                <FaSatellite className="w-3 h-3 text-blue-500" />
                                <span className="font-mono text-slate-700">{navire.mmsi}</span>
                              </div>
                            ) : null}
                            {navire.imo ? (
                              <div className="flex items-center gap-2">
                                <FaShip className="w-3 h-3 text-green-500" />
                                <span className="font-mono text-slate-700">IMO: {navire.imo}</span>
                              </div>
                            ) : null}
                            {!navire.mmsi && !navire.imo && (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {navire.annee_de_construction ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              {navire.annee_de_construction}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <HiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {naviresFiltres.length > 0 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
                <div>
                  Affichage de <span className="font-semibold">{naviresFiltres.length}</span> navire{naviresFiltres.length !== 1 ? 's' : ''}
                  {naviresFiltres.length !== navires.length && (
                    <span> sur {navires.length} au total</span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{totalMMSI}</div>
                    <div className="text-xs text-slate-500">Avec MMSI</div>
                  </div>
                  <div className="w-px h-6 bg-slate-300"></div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{totalIMO}</div>
                    <div className="text-xs text-slate-500">Avec IMO</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}