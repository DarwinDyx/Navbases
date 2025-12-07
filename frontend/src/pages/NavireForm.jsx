import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaRegCheckCircle,
} from "react-icons/fa";

import ProprietaireModal from "../components/modals/ProprietaireModal";
import ActiviteModal from "../components/modals/ActiviteModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import NavireFormHeader from "../components/navire-form/NavireFormHeader";
import GeneralInfoSection from "../components/navire-form/GeneralInfoSection";
import ConstructionSection from "../components/navire-form/ConstructionSection";
import ActivitesSection from "../components/navire-form/ActivitesSection";
import OwnerPhotoSection from "../components/navire-form/OwnerPhotoSection";
import FormActions from "../components/navire-form/FormActions";
import { API_BASE_URL } from "../config/api";

const NavireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [navire, setNavire] = useState({
    nom_navire: "",
    num_immatricule: "",
    imo: "",
    mmsi: "",
    type_navire: "",
    lieu_de_construction: "",
    annee_de_construction: "",
    nature_coque: "",
    nbr_passager: "",
    nbr_equipage: "",
    proprietaire_id: "",
    photo_navire: null,
  });

  const [proprietaires, setProprietaires] = useState([]);
  const [activites, setActivites] = useState([]);
  const [selectedActivites, setSelectedActivites] = useState([]); 
  const [selectedProprietaireOption, setSelectedProprietaireOption] = useState(null);
  const [natureCoqueOptions] = useState([
    "Bois", "Contreplaqué", "Fer", "Acier", "Aluminium", "Plastique",
    "Fibre de verre", "Polyester", "Composite", "Caoutchouc", "Pneumatique", "Titane"
  ]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProprietaireModalOpen, setIsProprietaireModalOpen] = useState(false);
  const [isActiviteModalOpen, setIsActiviteModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // États pour la confirmation
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const originalNavireData = useRef(null);
  const originalSelectedActivites = useRef([]);
  const originalSelectedProprietaire = useRef(null);
  const formInitialized = useRef(false);

  const loadFromCache = () => {
    if (id) {
      const cachedNavire = localStorage.getItem(`navire-${id}`);
      const cachedProprietaires = localStorage.getItem('proprietaires');
      const cachedActivites = localStorage.getItem('activites');
      
      if (cachedNavire) {
        const data = JSON.parse(cachedNavire);
        const newNavireData = {
          ...data,
          proprietaire_id: data.proprietaire?.id?.toString() || "", 
          photo_navire: null,
        };
        
        setNavire(newNavireData);

        if (data.proprietaire) {
          const option = {
            value: data.proprietaire.id.toString(),
            label: data.proprietaire.nom_proprietaire + (data.proprietaire.contact ? ` (${data.proprietaire.contact})` : '')
          };
          setSelectedProprietaireOption(option);
          originalSelectedProprietaire.current = option;
        } else {
          setSelectedProprietaireOption(null);
          originalSelectedProprietaire.current = null;
        }
        
        setSelectedActivites(data.activites?.map(a => a.id) || []);
        originalSelectedActivites.current = data.activites?.map(a => a.id) || [];
        
        if (data.photo_navire) {
          const photoUrl = data.photo_navire.startsWith('http') 
            ? data.photo_navire 
            : `${API_BASE_URL.replace('/api', '')}${data.photo_navire}`;
          setImagePreview(photoUrl);
        }
        
        // Stocker les données originales pour comparaison
        originalNavireData.current = { ...newNavireData };
        
        return true;
      }
      
      if (cachedProprietaires) setProprietaires(JSON.parse(cachedProprietaires));
      if (cachedActivites) setActivites(JSON.parse(cachedActivites));
    }
    return false;
  };

  const fetchProprietaires = () => {
    return axios.get(`${API_BASE_URL}/proprietaires/`)
      .then(res => {
        setProprietaires(res.data);
        localStorage.setItem('proprietaires', JSON.stringify(res.data));
      })
      .catch(() => setProprietaires([]));
  };

  const fetchActivites = () => {
    return axios.get(`${API_BASE_URL}/activites/`)
      .then(res => {
        setActivites(res.data);
        localStorage.setItem('activites', JSON.stringify(res.data));
      })
      .catch(() => setActivites([]));
  };
  
  useEffect(() => {
    setIsLoading(true);
    setFormError(null);

    const cacheLoaded = loadFromCache();
    
    if (cacheLoaded && id) {
      setIsEditing(true);
      setIsLoading(false);
      formInitialized.current = true;
      Promise.all([fetchProprietaires(), fetchActivites()]);
    } else {
      Promise.all([fetchProprietaires(), fetchActivites()]).finally(() => {
        if (id) {
          setIsEditing(true);
          axios.get(`${API_BASE_URL}/navires/${id}/`)
            .then(res => {
              const data = res.data;
              const newNavireData = {
                ...data,
                proprietaire_id: data.proprietaire?.id?.toString() || "", 
                photo_navire: null,
              };
              
              setNavire(newNavireData);

              if (data.proprietaire) {
                const option = {
                  value: data.proprietaire.id.toString(),
                  label: data.proprietaire.nom_proprietaire + (data.proprietaire.contact ? ` (${data.proprietaire.contact})` : '')
                };
                setSelectedProprietaireOption(option);
                originalSelectedProprietaire.current = option;
              } else {
                setSelectedProprietaireOption(null);
                originalSelectedProprietaire.current = null;
              }
              
              setSelectedActivites(data.activites?.map(a => a.id) || []);
              originalSelectedActivites.current = data.activites?.map(a => a.id) || [];

              if (data.photo_navire) {
                const photoUrl = data.photo_navire.startsWith('http') 
                  ? data.photo_navire 
                  : `${API_BASE_URL.replace('/api', '')}${data.photo_navire}`;
                setImagePreview(photoUrl);
              }
              
              localStorage.setItem(`navire-${id}`, JSON.stringify(data));
              
              // Stocker les données originales pour comparaison
              originalNavireData.current = { ...newNavireData };
              formInitialized.current = true;
            })
            .catch(err => {
              console.error("Erreur chargement navire:", err);
              setFormError("Erreur lors du chargement des données du navire.");
            })
            .finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
          formInitialized.current = true;
          originalNavireData.current = { ...navire };
          originalSelectedActivites.current = [];
          originalSelectedProprietaire.current = null;
        }
      });
    }
  }, [id]);

  // Vérifier les modifications non sauvegardées
  useEffect(() => {
    if (formInitialized.current) {
      // Comparer les données du navire
      const navireHasChanges = originalNavireData.current 
        ? JSON.stringify({...navire, photo_navire: null}) !== JSON.stringify({...originalNavireData.current, photo_navire: null})
        : false;
      
      // Comparer les activités sélectionnées
      const activitesHasChanges = 
        JSON.stringify([...selectedActivites].sort()) !== 
        JSON.stringify([...originalSelectedActivites.current].sort());
      
      // Comparer le propriétaire sélectionné
      const proprietaireHasChanges = 
        JSON.stringify(selectedProprietaireOption) !== 
        JSON.stringify(originalSelectedProprietaire.current);
      
      setHasUnsavedChanges(navireHasChanges || activitesHasChanges || proprietaireHasChanges);
    }
  }, [navire, selectedActivites, selectedProprietaireOption]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      setNavire({ ...navire, [name]: files[0] });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(files[0]);
    } else {
      setNavire({ ...navire, [name]: value });
    }
    if (formError) setFormError(null);
  };

  const handleProprietaireSelectChange = (selectedOption) => {
    setSelectedProprietaireOption(selectedOption);
    const proprietaireId = selectedOption ? selectedOption.value : "";
    setNavire(prev => ({ 
      ...prev, 
      proprietaire_id: proprietaireId
    }));
  };

  const handleRemoveProprietaire = () => {
    setSelectedProprietaireOption(null);
    setNavire(prev => ({ 
      ...prev, 
      proprietaire_id: "",
      proprietaire: null 
    }));
    
    setSuccessMessage("Propriétaire retiré avec succès");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleActiviteChange = (activiteId) => {
    setSelectedActivites(prev =>
      prev.includes(activiteId)
        ? prev.filter(id => id !== activiteId)
        : [...prev, activiteId]
    );
  };

  const handleProprietaireSuccess = (newOwnerId) => {
    fetchProprietaires().then(() => {
      setNavire(prev => ({ ...prev, proprietaire_id: newOwnerId.toString() }));
      
      const newOwner = proprietaires.find(p => p.id === newOwnerId);
      if (newOwner) {
        const option = {
          value: newOwner.id.toString(),
          label: newOwner.nom_proprietaire + (newOwner.contact ? ` (${newOwner.contact})` : '')
        };
        setSelectedProprietaireOption(option);
      }
      
      setIsProprietaireModalOpen(false);
      setSuccessMessage("Nouveau propriétaire ajouté avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    });
  };

  const handleActiviteSuccess = () => {
    fetchActivites().then(() => {
      setIsActiviteModalOpen(false);
      setSuccessMessage("Nouvelle activité ajoutée avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    });
  };

  const proprietaireOptions = proprietaires.map(p => ({
    value: p.id.toString(), 
    label: p.nom_proprietaire + (p.contact ? ` (${p.contact})` : ''),
  }));

  // Fonction pour gérer l'annulation
  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setIsCancelModalOpen(true);
    } else {
      // Redirection selon le mode
      if (isEditing && id) {
        navigate(`/navires/${id}`); // Mode modification → détails
      } else {
        navigate("/navires"); // Mode ajout → liste
      }
    }
  };

  // Confirmation d'annulation
  const confirmCancel = () => {
    setIsCancelModalOpen(false);
    // Redirection selon le mode
    if (isEditing && id) {
      navigate(`/navires/${id}`); // Mode modification → détails
    } else {
      navigate("/navires"); // Mode ajout → liste
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    setFormError(null);
    
    if (!navire.nom_navire.trim()) {
      setFormError("❌ Le nom du navire est requis.");
      return false;
    }
    
    if (!navire.num_immatricule.trim()) {
      setFormError("❌ Le numéro d'immatriculation est requis.");
      return false;
    }
    
    if (!navire.type_navire) {
      setFormError("❌ Le type de navire est requis.");
      return false;
    }
    
    // Validation pour la création seulement
    if (!isEditing) {
      if (!navire.proprietaire_id) {
        setFormError("❌ Un propriétaire doit être sélectionné.");
        return false;
      }
      
      if (selectedActivites.length === 0) {
        setFormError("❌ Au moins une activité doit être sélectionnée.");
        return false;
      }
    }
    
    return true;
  };

  // Ouvrir le modal de confirmation avant sauvegarde
  const handleSubmitClick = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaveModalOpen(true);
  };

  // Fonction pour exécuter la sauvegarde après confirmation
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setIsSaveModalOpen(false);
    setFormError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('nom_navire', navire.nom_navire);
    formData.append('num_immatricule', navire.num_immatricule);
    formData.append('type_navire', navire.type_navire || "");
    formData.append('imo', navire.imo || "");
    formData.append('mmsi', navire.mmsi || "");
    formData.append('lieu_de_construction', navire.lieu_de_construction || "");
    formData.append('annee_de_construction', navire.annee_de_construction || "");
    formData.append('nature_coque', navire.nature_coque || "");
    formData.append('nbr_passager', navire.nbr_passager || 0);
    formData.append('nbr_equipage', navire.nbr_equipage || 0);
    if (navire.proprietaire_id) {
        formData.append("proprietaire_id", navire.proprietaire_id);
    }
    selectedActivites.forEach(id => formData.append("activites_ids", id));
    if (navire.photo_navire instanceof File)
      formData.append("photo_navire", navire.photo_navire);

    try {
      let res;
      if (isEditing) {
        // MODE MODIFICATION
        res = await axios.put(
          `${API_BASE_URL}/navires/${id}/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setSuccessMessage("✅ Navire modifié avec succès !");
        
        // Mettre à jour les données originales
        originalNavireData.current = { ...navire, photo_navire: null };
        originalSelectedActivites.current = [...selectedActivites];
        originalSelectedProprietaire.current = selectedProprietaireOption;
        setHasUnsavedChanges(false);
        
        localStorage.setItem(`navire-${id}`, JSON.stringify(res.data));
        
        // Redirection vers les détails après modification
        setTimeout(() => {
          navigate(`/navires/${id}`);
        }, 1500);
        
      } else {
        // MODE AJOUT
        res = await axios.post(
          `${API_BASE_URL}/navires/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setSuccessMessage("✅ Navire ajouté avec succès ! Redirection vers la liste...");
        
        localStorage.setItem(`navire-${res.data.id}`, JSON.stringify(res.data));
        
        // Redirection vers la liste après ajout
        setTimeout(() => {
          navigate("/navires");
        }, 1500);
      }
      
    } catch (err) {
      console.error("Erreur lors de l'enregistrement :", err.response?.data || err);
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object') {
        const errorMsg = Object.values(errorData).flat().join(" ; ");
        setFormError(`❌ Erreur(s) de validation : ${errorMsg}`);
      } else {
        setFormError("❌ Erreur lors de l'enregistrement du navire. Veuillez vérifier les champs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour formater les valeurs pour l'affichage
  const formatFieldValue = (fieldName, value) => {
    if (!value && value !== 0) return "(vide)";
    
    switch (fieldName) {
      case 'type_navire':
      case 'nature_coque':
        return value;
      case 'nbr_passager':
      case 'nbr_equipage':
        return value.toString();
      default:
        return value;
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium">Chargement des données du navire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <NavireFormHeader 
          isEditing={isEditing}
          navigate={navigate}
          hasUnsavedChanges={hasUnsavedChanges}
          navireId={id}
        />

        {formError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl font-medium">
            {formError}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-xl font-medium">
            <FaRegCheckCircle className="inline mr-2" /> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmitClick} className="space-y-8">
          
          <GeneralInfoSection 
            navire={navire}
            handleChange={handleChange}
            originalData={originalNavireData.current}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          <ConstructionSection 
            navire={navire}
            handleChange={handleChange}
            natureCoqueOptions={natureCoqueOptions}
            originalData={originalNavireData.current}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          <ActivitesSection 
            activites={activites}
            selectedActivites={selectedActivites}
            handleActiviteChange={handleActiviteChange}
            onOpenModal={() => setIsActiviteModalOpen(true)}
            originalActivites={originalSelectedActivites.current}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          <OwnerPhotoSection 
            navire={navire}
            handleChange={handleChange}
            proprietaireOptions={proprietaireOptions}
            selectedProprietaireOption={selectedProprietaireOption}
            handleProprietaireSelectChange={handleProprietaireSelectChange}
            onOpenModal={() => setIsProprietaireModalOpen(true)}
            imagePreview={imagePreview}
            onRemoveProprietaire={handleRemoveProprietaire}
            originalProprietaire={originalSelectedProprietaire.current}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          <FormActions 
            isLoading={isSubmitting}
            isEditing={isEditing}
            onCancel={handleCancelClick}
            onSubmit={handleSubmitClick}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </form>
      </div>

      <ProprietaireModal
          isOpen={isProprietaireModalOpen}
          onClose={() => setIsProprietaireModalOpen(false)}
          onSuccess={handleProprietaireSuccess} 
      />
      
      <ActiviteModal
          isOpen={isActiviteModalOpen}
          onClose={() => setIsActiviteModalOpen(false)}
          onSuccess={handleActiviteSuccess}
      />

      {/* Modal de confirmation pour la sauvegarde */}
      {isSaveModalOpen && (
        <ConfirmationModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onConfirm={handleConfirmSubmit}
          title={isEditing ? "Modifier le navire" : "Ajouter un navire"}
          message={
            <div className="space-y-2">
              <p>
                {isEditing ? "Confirmez-vous la modification du navire" : "Confirmez-vous l'ajout du navire"} 
                <span className="font-bold text-black"> "{navire.nom_navire}"</span> ?
              </p>
              <p className="text-sm text-slate-600">
                {isEditing 
                  ? "Vous serez redirigé vers la page de détails du navire."
                  : "Vous serez redirigé vers la liste des navires."
                }
              </p>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="font-medium text-slate-700">Détails du navire :</p>
                <ul className="text-sm text-slate-600 mt-1 space-y-1">
                  <li className="flex">
                    <span className="w-40 font-medium">Nom :</span>
                    <span className="font-bold text-black">{formatFieldValue('nom_navire', navire.nom_navire)}</span>
                  </li>
                  <li className="flex">
                    <span className="w-40 font-medium">Immatriculation :</span>
                    <span className="font-bold text-black">{formatFieldValue('num_immatricule', navire.num_immatricule)}</span>
                  </li>
                  <li className="flex">
                    <span className="w-40 font-medium">Type :</span>
                    <span className="font-bold text-black">{formatFieldValue('type_navire', navire.type_navire)}</span>
                  </li>
                  {selectedProprietaireOption && (
                    <li className="flex">
                      <span className="w-40 font-medium">Propriétaire :</span>
                      <span className="font-bold text-black">{selectedProprietaireOption.label}</span>
                    </li>
                  )}
                  {selectedActivites.length > 0 && (
                    <li className="flex">
                      <span className="w-40 font-medium">Activités :</span>
                      <span className="font-bold text-black">{selectedActivites.length} activité(s)</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          }
          confirmButtonText={isEditing ? "Modifier" : "Ajouter"}
          type={isEditing ? "warning" : "info"}
          isLoading={isSubmitting}
          disableConfirm={isSubmitting}
          cancelButtonText="Annuler"
        />
      )}

      {/* Modal de confirmation pour annuler avec modifications non sauvegardées */}
      {isCancelModalOpen && (
        <ConfirmationModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={confirmCancel}
          title="Modifications non sauvegardées"
          message={
            <div>
              <p className="mb-2">Vous avez des modifications non sauvegardées pour le navire :</p>
              {navire.nom_navire && (
                <p className="font-bold text-black mb-3">"{navire.nom_navire}"</p>
              )}
              <div className="bg-slate-50 p-3 rounded-lg mb-3 space-y-1">
                {navire.nom_navire !== originalNavireData.current?.nom_navire && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Nom du navire : <span className="font-bold text-black">{formatFieldValue('nom_navire', navire.nom_navire)}</span>
                    </span>
                  </p>
                )}
                {navire.num_immatricule !== originalNavireData.current?.num_immatricule && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Immatriculation : <span className="font-bold text-black">{formatFieldValue('num_immatricule', navire.num_immatricule)}</span>
                    </span>
                  </p>
                )}
                {navire.type_navire !== originalNavireData.current?.type_navire && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Type : <span className="font-bold text-black">{formatFieldValue('type_navire', navire.type_navire)}</span>
                    </span>
                  </p>
                )}
                {navire.proprietaire_id !== originalNavireData.current?.proprietaire_id && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Propriétaire : <span className="font-bold text-black">{selectedProprietaireOption ? selectedProprietaireOption.label : "(aucun)"}</span>
                    </span>
                  </p>
                )}
                {JSON.stringify([...selectedActivites].sort()) !== JSON.stringify([...originalSelectedActivites.current].sort()) && (
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Activités : <span className="font-bold text-black">{selectedActivites.length} activité(s) sélectionnée(s)</span>
                    </span>
                  </p>
                )}
              </div>
              <p className="mt-2 text-gray-600">
                {isEditing 
                  ? "Voulez-vous vraiment quitter sans sauvegarder ? Vous serez redirigé vers la page de détails du navire."
                  : "Voulez-vous vraiment quitter sans sauvegarder ? Vous serez redirigé vers la liste des navires."
                }
              </p>
            </div>
          }
          confirmButtonText="Quitter sans sauvegarder"
          type="danger"
          cancelButtonText="Continuer l'édition"
        />
      )}
    </div>
  );
};

export default NavireForm;