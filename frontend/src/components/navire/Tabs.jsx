import { useState, useMemo } from "react";
import { 
  HiPlus, 
  HiOutlineInformationCircle, 
  HiPencil, 
  HiTrash, 
  HiSearch,
  HiSortAscending,
  HiSortDescending,
  HiCog, 
  HiShieldCheck, 
  HiCalendar, 
  HiDocumentText, 
  HiDatabase,
  HiPhotograph,
  HiDownload,
  HiExternalLink,
  HiCheckCircle,
  HiXCircle
} from "react-icons/hi";

// Composant pour afficher les valeurs de métadonnées
const MetaValueDisplay = ({ value, type }) => {
  if (!value || value === "—") return <span className="text-slate-400">—</span>;
  
  // Fonctions pour détecter le type de valeur
  const isLocalFileUrl = (val) => {
    if (typeof val !== 'string') return false;
    // Détecte uniquement les fichiers locaux (commençant par /media/)
    return val.includes('/media/');
  };
  
  const isExternalUrl = (val) => {
    if (typeof val !== 'string') return false;
    // Détecte les URLs externes (http://, https://)
    return val.startsWith('http://') || val.startsWith('https://');
  };
  
  const isImageUrl = (val) => {
    if (typeof val !== 'string') return false;
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(val);
  };

  const isFileExtension = (val) => {
    if (typeof val !== 'string') return false;
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i.test(val);
  };

  // Si c'est une URL de fichier local (commence par /media/)
  if (isLocalFileUrl(value)) {
    const fileName = value.split('/').pop().split('?')[0];
    
    if (isImageUrl(value)) {
      // Affichage pour les images locales
      return (
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
              <img 
                src={value} 
                alt={fileName}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={() => window.open(value, '_blank')}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fileName)}&background=3b82f6&color=ffffff&size=64`;
                }}
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
              <HiExternalLink className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">
              {fileName}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <HiPhotograph className="w-3 h-3" />
              Image
            </span>
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 flex items-center gap-1"
            >
              <HiDownload className="w-3 h-3" />
              Télécharger
            </a>
          </div>
        </div>
      );
    } else if (isFileExtension(value)) {
      // Affichage pour les autres fichiers locaux avec extensions reconnues
      const fileIcon = () => {
        const fileName = value.split('/').pop();
        if (/\.pdf$/i.test(fileName)) return "📄";
        if (/\.(doc|docx)$/i.test(fileName)) return "📝";
        if (/\.(xls|xlsx)$/i.test(fileName)) return "📊";
        if (/\.(ppt|pptx)$/i.test(fileName)) return "📽️";
        if (/\.(zip|rar)$/i.test(fileName)) return "📦";
        return "📎";
      };
      
      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
            {fileIcon()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">
              {fileName}
            </span>
            <span className="text-xs text-slate-500">
              Fichier
            </span>
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 flex items-center gap-1"
            >
              <HiDownload className="w-3 h-3" />
              Télécharger
            </a>
          </div>
        </div>
      );
    }
  }
  
  // Gestion selon le type de métadonnée
  switch(type) {
    case 'BOOLEEN':
      const boolValue = value === "True" || value === true || value === "true" || value === 1 || value === "1";
      return (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${boolValue ? 'bg-green-100' : 'bg-red-100'}`}>
            {boolValue ? 
              <HiCheckCircle className="w-5 h-5 text-green-600" /> : 
              <HiXCircle className="w-5 h-5 text-red-600" />
            }
          </span>
          <span className={`font-medium ${boolValue ? 'text-green-700' : 'text-red-700'}`}>
            {boolValue ? "Oui" : "Non"}
          </span>
        </div>
      );
    
    case 'DATE':
      try {
        const date = new Date(value);
        const today = new Date();
        const isPast = date < today;
        
        return (
          <div className="flex flex-col">
            <span className={`font-medium ${isPast ? 'text-red-600' : 'text-slate-700'}`}>
              {date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
            <span className="text-xs text-slate-500">
              {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
            </span>
          </div>
        );
      } catch {
        return <span className="text-slate-700">{value}</span>;
      }
    
    case 'HEURE':
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 font-medium">🕒</span>
          </div>
          <span className="font-medium text-slate-700">{value}</span>
        </div>
      );
    
    case 'URL':
      // Pour le type URL, on affiche juste un lien cliquable simple
      const displayUrl = value.length > 40 ? value.substring(0, 40) + '...' : value;
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[250px] inline-block"
          title={value}
        >
          {displayUrl}
        </a>
      );
    
    case 'NOMBRE':
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 font-bold">#</span>
          </div>
          <span className="font-mono font-bold text-slate-800">{parseFloat(value).toLocaleString('fr-FR')}</span>
        </div>
      );
    
    case 'TEXTE':
      if (value.length > 60) {
        return (
          <div className="group relative">
            <div className="line-clamp-2 text-slate-700">
              {value}
            </div>
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-slate-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {value}
              <div className="absolute bottom-full left-4 border-8 border-transparent border-b-slate-900"></div>
            </div>
          </div>
        );
      }
      return <span className="text-slate-700">{value}</span>;
    
    // Types FICHIER et IMAGE pour les URLs externes ou non-local
    case 'FICHIER':
    case 'IMAGE':
      // Si c'est une URL externe, on affiche un simple lien
      if (isExternalUrl(value)) {
        const displayText = value.length > 40 ? value.substring(0, 40) + '...' : value;
        return (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[250px] inline-block"
            title={value}
          >
            {type === 'IMAGE' ? '🖼️ ' : '📄 '}
            {displayText}
          </a>
        );
      }
      // Pour les autres cas (non-URL, non-local), on affiche la valeur brute
      return <span className="text-slate-700">{value}</span>;
    
    default:
      return <span className="text-slate-700">{value}</span>;
  }
};

export default function Tabs({ navire, activeTab, setActiveTab, onAddItem, onEditItem, onDeleteItem }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const tabData = {
    moteurs: navire?.moteurs || [],
    assurances: navire?.assurances || [],
    visites: navire?.visites || [],
    dossiers: navire?.dossiers || [],
    meta_donnees: navire?.meta_donnees || [],
  };
  
  const tabIcons = {
    moteurs: <HiCog className="w-4 h-4" />, 
    assurances: <HiShieldCheck className="w-4 h-4" />, 
    visites: <HiCalendar className="w-4 h-4" />,
    dossiers: <HiDocumentText className="w-4 h-4" />, 
    meta_donnees: <HiDatabase className="w-4 h-4" />,
  };
  
  const tabNames = {
    moteurs: "Moteurs", 
    assurances: "Assurances", 
    visites: "Visites",
    dossiers: "Dossiers", 
    meta_donnees: "Méta-données",
  };

  const columnConfig = {
    moteurs: [
      { key: "nom_moteur", header: "Nom" },
      { key: "puissance", header: "Puissance" },
    ],
    assurances: [
      { key: "assureur.nom_assureur", header: "Assureur" },
      { key: "date_debut", header: "Date début", format: "date" },
      { key: "date_fin", header: "Date fin", format: "date" },
      { key: "statut", header: "Statut", format: "statut" },
    ],
    visites: [
      { key: "date_visite", header: "Date visite", format: "date" },
      { key: "expiration_permis", header: "Expiration permis", format: "date" },
      { key: "lieu_visite", header: "Lieu" },
      { key: "statut", header: "Statut", format: "statut" },
    ],
    dossiers: [
      { key: "type_dossier", header: "Type" },
      { key: "date_emission", header: "Date émission", format: "date" },
      { key: "date_expiration", header: "Date expiration", format: "date" },
      { key: "statut", header: "Statut", format: "statut" },
    ],
    meta_donnees: [
      { key: "type_meta_donne", header: "Type" },
      { key: "nom_meta_donne", header: "Nom" },
      { key: "valeur_meta_donne", header: "Valeur", format: "meta_value" },
    ],
  };

  // Fonction pour compter les alertes par onglet
  const getAlertCount = (tabKey) => {
    const data = tabData[tabKey] || [];
    if (tabKey === 'moteurs' || tabKey === 'meta_donnees') return 0;
    
    return data.filter(item => {
      const statut = item?.statut;
      return statut === "Expiré" || statut === "Expire Bientôt (30j)";
    }).length;
  };

  // Fonction pour déterminer la couleur de l'alerte
  const getAlertColor = (tabKey) => {
    const data = tabData[tabKey] || [];
    if (tabKey === 'moteurs' || tabKey === 'meta_donnees') return null;
    
    const hasExpired = data.some(item => item?.statut === "Expiré");
    const hasExpiringSoon = data.some(item => item?.statut === "Expire Bientôt (30j)");
    
    if (hasExpired) return "red";
    if (hasExpiringSoon) return "orange";
    return null;
  };

  const safeDisplay = (value, fallback = "—") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
      return value.nom_assureur || value.nom_navire || value.nom_proprietaire || fallback;
    }
    return value;
  };

  // Fonction getNestedValue sécurisée
  const getNestedValue = (obj, path) => {
    if (!obj || !path || typeof path !== 'string') return "—";
    try {
      const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
      return value === null || value === undefined ? "—" : value;
    } catch (error) {
      console.error("Erreur dans getNestedValue:", error);
      return "—";
    }
  };

  // Fonction pour créer les badges de statut
  const getStatusBadge = (statut) => {
    let bgColor = "bg-slate-100";
    let textColor = "text-slate-700";
    let dotColor = "bg-slate-400";
    
    if (statut === "Expiré") {
      bgColor = "bg-red-50";
      textColor = "text-red-700";
      dotColor = "bg-red-500";
    } else if (statut === "Expire Bientôt (30j)") {
      bgColor = "bg-orange-50";
      textColor = "text-orange-700";
      dotColor = "bg-orange-500";
    } else if (statut === "Valide") {
      bgColor = "bg-green-50";
      textColor = "text-green-700";
      dotColor = "bg-green-500";
    } else if (statut === "Date inconnue") {
      bgColor = "bg-gray-50";
      textColor = "text-gray-500";
      dotColor = "bg-gray-400";
    }
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
        {statut}
      </span>
    );
  };

  // Fonction formatValue 
  const formatValue = (value, format, item) => {
    if (value === "—") return <span className="text-slate-400">—</span>;
    
    try {
      if (format === "date") {
        if (!value || value === '—') return <span className="text-slate-400">—</span>;
        return new Date(value).toLocaleDateString('fr-FR');
      }
      
      if (format === "statut") {
        return getStatusBadge(value);
      }
      
      if (format === "meta_value") {
        return <MetaValueDisplay value={value} type={item?.type_meta_donne} />;
      }
      
      return safeDisplay(value);
    } catch (error) {
      console.error("Erreur dans formatValue:", error);
      return <span className="text-slate-400">—</span>;
    }
  };

  const getColumns = (tabKey) => {
    return columnConfig[tabKey] || [];
  };

  // Fonction getDisplayValue complètement sécurisée
  const getDisplayValue = (item, column) => {
    if (!item || typeof item !== 'object') {
      return <span className="text-slate-400">—</span>;
    }
    
    if (!column || typeof column !== 'object' || !column.key) {
      return <span className="text-slate-400">—</span>;
    }
    
    try {
      const rawValue = getNestedValue(item, column.key);
      return formatValue(rawValue, column.format, item);
    } catch (error) {
      console.error("Erreur dans getDisplayValue:", error);
      return <span className="text-slate-400">—</span>;
    }
  };

  // Fonction filterData
  const filterData = (data) => {
    if (!searchTerm || !data) return data || [];
    
    return data.filter(item => {
      return getColumns(activeTab).some(column => {
        try {
          const rawValue = getNestedValue(item, column.key); 
          let valueToSearch = rawValue;

          if (typeof rawValue === 'object' && rawValue !== null) {
            valueToSearch = rawValue.nom_assureur || rawValue.nom_navire || rawValue.nom_proprietaire || "—";
          }
          
          if (valueToSearch === "—") return false;
          return String(valueToSearch).toLowerCase().includes(searchTerm.toLowerCase());
        } catch (error) {
          return false;
        }
      });
    });
  };

  // Fonction sortData sécurisée
  const sortData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      try {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);
        
        // Pour les métadonnées avec des composants React, on ne trie pas
        if (sortConfig.key === "valeur_meta_donne") {
          return 0;
        }
        
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        if (sortConfig.key === "statut") {
          const statusOrder = {
            "Expiré": 0,
            "Expire Bientôt (30j)": 1,
            "Date inconnue": 2,
            "Valide": 3
          };
          
          const aOrder = statusOrder[aValue] ?? 4;
          const bOrder = statusOrder[bValue] ?? 4;
          
          let comparison = 0;
          if (aOrder < bOrder) comparison = -1;
          if (aOrder > bOrder) comparison = 1;
          
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        if (aString === bString) return 0;
        
        let comparison = 0;
        if (aString < bString) comparison = -1;
        if (aString > bString) comparison = 1;

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      } catch (error) {
        return 0;
      }
    });
  };

  const handleSort = (key) => {
    if (key === "valeur_meta_donne") return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <HiSortAscending className="w-3 h-3 ml-1" /> : 
      <HiSortDescending className="w-3 h-3 ml-1" />;
  };

  // Mémoïsation du filtrage et du tri
  const filteredData = useMemo(
    () => filterData(tabData[activeTab] || []),
    [activeTab, searchTerm, navire]
  );
  
  const filteredAndSortedData = useMemo(
    () => sortData(filteredData),
    [filteredData, sortConfig]
  );

  const resetSearchAndSort = () => {
    setSearchTerm("");
    setSortConfig({ key: null, direction: 'asc' });
  };

  // Fonction sécurisée pour obtenir le nom d'affichage
  const getSafeDisplayName = (item, tab) => {
    try {
      const columns = getColumns(tab);
      const firstColumn = columns?.[0];
      const rawValue = getNestedValue(item, firstColumn?.key);
      return rawValue !== "—" ? String(rawValue) : "Élément";
    } catch (error) {
      console.error("Erreur dans getSafeDisplayName:", error);
      return "Élément";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="p-6">
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 mb-6 pb-4">
          {Object.keys(tabData).map(tab => {
            const alertCount = getAlertCount(tab);
            const alertColor = getAlertColor(tab);
            
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  resetSearchAndSort();
                }}
                className={`relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                }`}
              >
                {tabIcons[tab]}
                {tabNames[tab]}
                
                {alertColor && (
                  <span 
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      alertColor === 'red' ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    title={`${alertCount} alerte(s) ${alertColor === 'red' ? 'critique(s)' : 'd\'attention'}`}
                  />
                )}
                
                {tabData[tab] && tabData[tab].length > 0 && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-bold ${
                    activeTab === tab ? "bg-white text-blue-800" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tabData[tab].length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-h-[300px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Rechercher dans ${tabNames[activeTab]?.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {searchTerm && (
                <span className="text-sm text-slate-600">
                  {filteredAndSortedData.length} résultat(s) trouvé(s)
                </span>
              )}
              <button 
                onClick={() => onAddItem(activeTab)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <HiPlus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>

          {tabData[activeTab] && tabData[activeTab].length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {getColumns(activeTab).map(col => (
                      <th 
                        key={col.key} 
                        scope="col" 
                        className={`px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider ${col.key !== "valeur_meta_donne" ? "cursor-pointer hover:bg-slate-100 transition-colors" : ""}`}
                        onClick={() => col.key !== "valeur_meta_donne" && handleSort(col.key)}
                      >
                        <div className="flex items-center">
                          {col.header}
                          {col.key !== "valeur_meta_donne" && getSortIcon(col.key)}
                        </div>
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAndSortedData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150">
                      {getColumns(activeTab).map(col => (
                        <td key={col.key} className="px-6 py-4">
                          <div className="min-h-[4rem] flex items-center">
                            {getDisplayValue(item, col)}
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditItem(activeTab, item)}
                            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150 text-sm font-medium border border-blue-200"
                          >
                            <HiPencil className="w-3 h-3" />
                            Modifier
                          </button>
                          <button
                            onClick={() => {
                              const displayName = getSafeDisplayName(item, activeTab);
                              onDeleteItem(activeTab, item.id, displayName);
                            }}
                            className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 text-sm font-medium border border-red-200"
                          >
                            <HiTrash className="w-3 h-3" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <HiOutlineInformationCircle className="mx-auto h-14 w-14 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium text-lg mb-2">
                {searchTerm ? "Aucun résultat trouvé" : "Aucune donnée disponible"}
              </p>
              <p className="text-slate-500 mb-6">
                {searchTerm 
                  ? "Aucun élément ne correspond à votre recherche."
                  : `Aucun(e) ${tabNames[activeTab]?.toLowerCase() || "élément"} n'a encore été ajouté(e) pour ce navire.`
                }
              </p>
              {searchTerm ? (
                <button 
                  onClick={resetSearchAndSort}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors font-semibold"
                >
                  <HiSearch className="w-4 h-4" />
                  Réinitialiser la recherche
                </button>
              ) : (
                <button 
                  onClick={() => onAddItem(activeTab)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  <HiPlus className="w-4 h-4" />
                  Ajouter un(e) {tabNames[activeTab]?.slice(0, -1) || "élément"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}