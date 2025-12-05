import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MoteurModal from "../components/modals/MoteurModal";
import AssuranceModal from "../components/modals/AssuranceModal";
import VisiteModal from "../components/modals/VisiteModal";
import DossierModal from "../components/modals/DossierModal";
import MetaDonneModal from "../components/modals/MetaDonneModal";
import ConfirmationModal from "../components/modals/ConfirmationModal"; 
import LoadingScreen from "../components/ui/LoadingScreen";
import NotFound from "../components/ui/NotFound";
import NavireHeader from "../components/navire/NavireHeader";
import NavireActions from "../components/navire/NavireActions";
import NavireMainCard from "../components/navire/NavireMainCard";
import Tabs from "../components/navire/Tabs";
import { API_BASE_URL } from "../config/api";

export default function NavireDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [navire, setNavire] = useState(null);
  const [activeTab, setActiveTab] = useState("moteurs");
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // ============================================
  // ÉTATS DES MODALES DE CONFIRMATION
  // ============================================

  // État pour le modal de suppression du navire
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 

  // --- NOUVEAUX ÉTATS POUR LA SUPPRESSION D'ÉLÉMENT (onglets) ---
  const [isItemDeleteModalOpen, setIsItemDeleteModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);
  const [itemToDeleteType, setItemToDeleteType] = useState(null); // ex: 'moteurs'
  const [itemToDeleteName, setItemToDeleteName] = useState("");     // ex: 'Moteur principal'
  // ----------------------------------------------------------------

  const [modalOpen, setModalOpen] = useState({
    moteurs: false,
    assurances: false,
    visites: false,
    dossiers: false,
    meta_donnees: false
  });

  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshData, setRefreshData] = useState(false);

  // ============================================
  // EXPORT PDF
  // ============================================


  const handleExportOnePDF = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/navires/${id}/export_one_pdf/`);
      if (!response.ok) throw new Error('Erreur lors du téléchargement PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `navire_${navire?.nom_navire || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccessMessage("✅ Export PDF téléchargé avec succès !");
    } catch (error) {
      console.error('Erreur export PDF:', error);
      showSuccessMessage("❌ Erreur lors de l'export PDF");
    }
  };

  // ============================================
  // FETCH NAVIRE
  // ============================================
  const fetchNavireData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/navires/${id}/`);
      if (!response.ok) throw new Error("Erreur lors du chargement du navire");
      const data = await response.json();
      setNavire(data); 
    } catch (err) {
      console.error("Erreur chargement navire:", err);
      setNavire(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchAdditionalData = useCallback(async () => {
    if (!navire) return;
    try {
      const endpoints = [
        `moteurs/?navire=${id}`,
        `assurances/?navire=${id}`,
        `visites/?navire=${id}`,
        `dossiers/?navire=${id}`,
        `meta_donnees/?navire=${id}`
      ];

      const promises = endpoints.map(endpoint => 
        fetch(`${API_BASE_URL}/${endpoint}`).then(res => res.json())
      );

      const [moteurs, assurances, visites, dossiers, metaDonnees] = await Promise.all(promises);
      
      setNavire(prev => ({
        ...prev,
        moteurs,
        assurances,
        visites,
        dossiers,
        meta_donnees: metaDonnees
      }));

    } catch (error) {
      console.error("Erreur chargement données supplémentaires:", error);
    }
  }, [id, navire]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    fetchNavireData();
  }, [id, fetchNavireData]);

  useEffect(() => {
    if (navire && !navire.moteurs) {
      fetchAdditionalData();
    }
  }, [navire, fetchAdditionalData]);

  useEffect(() => {
    if (refreshData) {
      fetchNavireData();
      setRefreshData(false);
    }
  }, [refreshData, fetchNavireData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNavireData(); 
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNavireData]);

  // ============================================
  // MODALS
  // ============================================
  const openModal = (modalType, item = null) => {
    setSelectedItem(item);
    setModalOpen(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType) => {
    setModalOpen(prev => ({ ...prev, [modalType]: false }));
    setSelectedItem(null);
  };

  const handleSave = () => {
    setRefreshData(prev => !prev);
    showSuccessMessage("✅ Données mises à jour avec succès !");
  };


  // 1. Fonction appelée par le composant Tabs pour ouvrir le modal
  const handleDeleteItem = (type, itemId, itemName) => {
    // Stocker les détails de l'élément pour l'action de confirmation
    setItemToDeleteId(itemId);
    setItemToDeleteType(type);
    setItemToDeleteName(itemName);
    setIsItemDeleteModalOpen(true); // Ouvrir la modale de confirmation
  };

  // 2. Fonction appelée par le ConfirmationModal pour exécuter l'action réelle
  const confirmItemDelete = async () => {
    if (!itemToDeleteId || !itemToDeleteType) return;
    
    const type = itemToDeleteType;
    const itemId = itemToDeleteId;
    
    setIsItemDeleteModalOpen(false); // Fermer la modale immédiatement

    try {
      const endpointMap = {
        moteurs: 'moteurs',
        assurances: 'assurances', 
        visites: 'visites',
        dossiers: 'dossiers',
        meta_donnees: 'meta_donnees'
      };

      const endpoint = endpointMap[type];
      if (!endpoint) throw new Error(`Type ${type} non supporté`);

      const response = await fetch(`${API_BASE_URL}/${endpoint}/${itemId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      showSuccessMessage(`✅ ${type.slice(0, -1)} supprimé avec succès !`);
      setRefreshData(prev => !prev);
    } catch (error) {
      console.error(`Erreur suppression ${type}:`, error);
      showSuccessMessage(`❌ Erreur lors de la suppression de ${type}`);
    } finally {
      // Réinitialiser les états après la tentative
      setItemToDeleteId(null);
      setItemToDeleteType(null);
      setItemToDeleteName("");
    }
  };




  // 1. Fonction appelée par NavireActions pour ouvrir le modal
  const handleDelete = () => {
    if (navire) {
        setIsDeleteModalOpen(true);
    }
  };

  // 2. Fonction appelée par le ConfirmationModal pour exécuter l'action
  const confirmDelete = async () => {
    setIsDeleteModalOpen(false); // Fermer le modal
    
    try {
      const response = await fetch(`${API_BASE_URL}/navires/${id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur lors de la suppression du navire');

      showSuccessMessage("✅ Navire supprimé avec succès !");
      setTimeout(() => navigate('/navires'), 1500);
    } catch (error) {
      console.error('Erreur suppression navire:', error);
      showSuccessMessage("❌ Erreur lors de la suppression du navire");
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // ============================================
  // RENDER
  // ============================================
  if (isLoading && !navire) return <LoadingScreen message="Chargement des informations du navire..." />;
  if (!navire) return <NotFound navigate={navigate} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {successMessage && (
          <div className="mb-6">
            <div className={`border px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3 ${
              successMessage.includes("✅") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                successMessage.includes("✅") ? "bg-green-600" : "bg-red-600"
              }`}>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="font-medium">{successMessage.replace(/^[✅❌]\s*/, '')}</span>
            </div>
          </div>
        )}

        <NavireHeader navire={navire} navigate={navigate} />

        <NavireMainCard navire={navire} />

        <Tabs 
          navire={navire} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onAddItem={openModal}
          onEditItem={openModal}
          onDeleteItem={handleDeleteItem} 
        />

        <div className="pt-8 border-t border-slate-200">
          <NavireActions 
            onEdit={() => navigate(`/navires/edit/${navire.id}`)}
            onDelete={handleDelete} // Appel de la fonction qui ouvre le modal navire
            onExportPDF={handleExportOnePDF}
            navireId={id}
          />
        </div>

        
        <MoteurModal
          isOpen={modalOpen.moteurs}
          onClose={() => closeModal("moteurs")}
          moteur={selectedItem}
          navireId={id}
          onSave={handleSave}
        />

        <AssuranceModal
          isOpen={modalOpen.assurances}
          onClose={() => closeModal("assurances")}
          assurance={selectedItem}
          navireId={id}
          onSave={handleSave}
        />

        <VisiteModal
          isOpen={modalOpen.visites}
          onClose={() => closeModal("visites")}
          visite={selectedItem}
          navireId={id}
          onSave={handleSave}
        />

        <DossierModal
          isOpen={modalOpen.dossiers}
          onClose={() => closeModal("dossiers")}
          dossier={selectedItem}
          navireId={id}
          onSave={handleSave}
        />

        <MetaDonneModal
          isOpen={modalOpen.meta_donnees}
          onClose={() => closeModal("meta_donnees")}
          metaDonne={selectedItem}
          navireId={id}
          onSave={handleSave}
        />
        

        {itemToDeleteId && ( 
          <ConfirmationModal
            isOpen={isItemDeleteModalOpen}
            onClose={() => setIsItemDeleteModalOpen(false)}
            onConfirm={confirmItemDelete} // Exécute l'action DELETE
            title={`Supprimer ${itemToDeleteType?.slice(0, -1)}`}
            message={`Êtes-vous certain de vouloir supprimer définitivement "${itemToDeleteName}" dans l'onglet "${itemToDeleteType}" ?`}
            confirmButtonText="Supprimer l'élément"
            confirmButtonClassName="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          />
        )}

        {navire && ( 
          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            title="Confirmer la suppression du navire"
            message={`Êtes-vous certain de vouloir supprimer définitivement le navire "${navire.nom_navire}" ? Cette action est irréversible et supprimera toutes les données associées.`}
            confirmButtonText="Supprimer définitivement"
            confirmButtonClassName="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          />
        )}

      </div>
    </div>
  );
}