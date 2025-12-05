import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaRegCheckCircle,
} from "react-icons/fa";

import ProprietaireModal from "../components/modals/ProprietaireModal";
import ActiviteModal from "../components/modals/ActiviteModal";
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

  const loadFromCache = () => {
    if (id) {
      const cachedNavire = localStorage.getItem(`navire-${id}`);
      const cachedProprietaires = localStorage.getItem('proprietaires');
      const cachedActivites = localStorage.getItem('activites');
      
      if (cachedNavire) {
        const data = JSON.parse(cachedNavire);
        setNavire({
          ...data,
          proprietaire_id: data.proprietaire?.id?.toString() || "", 
          photo_navire: null,
        });

        if (data.proprietaire) {
          const option = {
            value: data.proprietaire.id.toString(),
            label: data.proprietaire.nom_proprietaire + (data.proprietaire.contact ? ` (${data.proprietaire.contact})` : '')
          };
          setSelectedProprietaireOption(option);
        } else {
          setSelectedProprietaireOption(null);
        }
        
        setSelectedActivites(data.activites?.map(a => a.id) || []);
        
        if (data.photo_navire) {
          const photoUrl = data.photo_navire.startsWith('http') 
            ? data.photo_navire 
            : `${API_BASE_URL.replace('/api', '')}${data.photo_navire}`;
          setImagePreview(photoUrl);
        }
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
      Promise.all([fetchProprietaires(), fetchActivites()]);
    } else {
      Promise.all([fetchProprietaires(), fetchActivites()]).finally(() => {
        if (id) {
          setIsEditing(true);
          axios.get(`${API_BASE_URL}/navires/${id}/`)
            .then(res => {
              const data = res.data;
              setNavire({
                ...data,
                proprietaire_id: data.proprietaire?.id?.toString() || "", 
                photo_navire: null,
              });

              if (data.proprietaire) {
                const option = {
                  value: data.proprietaire.id.toString(),
                  label: data.proprietaire.nom_proprietaire + (data.proprietaire.contact ? ` (${data.proprietaire.contact})` : '')
                };
                setSelectedProprietaireOption(option);
              } else {
                setSelectedProprietaireOption(null);
              }
              
              setSelectedActivites(data.activites?.map(a => a.id) || []); 

              if (data.photo_navire) {
                const photoUrl = data.photo_navire.startsWith('http') 
                  ? data.photo_navire 
                  : `${API_BASE_URL.replace('/api', '')}${data.photo_navire}`;
                setImagePreview(photoUrl);
              }
              
              localStorage.setItem(`navire-${id}`, JSON.stringify(data));
            })
            .catch(err => {
              console.error("Erreur chargement navire:", err);
              setFormError("Erreur lors du chargement des données du navire.");
            })
            .finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }
      });
    }
  }, [id]);

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
  };

  const handleProprietaireSelectChange = (selectedOption) => {
    console.log("Selected option:", selectedOption);
    setSelectedProprietaireOption(selectedOption);
    const proprietaireId = selectedOption ? selectedOption.value : "";
    setNavire(prev => ({ 
      ...prev, 
      proprietaire_id: proprietaireId
    }));
  };

  const handleRemoveProprietaire = () => {
    console.log("Explicit removal of owner");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
        res = await axios.put(
          `${API_BASE_URL}/navires/${id}/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setSuccessMessage("✅ Navire modifié avec succès !");
        
        localStorage.setItem(`navire-${id}`, JSON.stringify(res.data));
      } else {
        res = await axios.post(
          `${API_BASE_URL}/navires/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setSuccessMessage("✅ Navire ajouté avec succès ! Redirection...");
        
        localStorage.setItem(`navire-${res.data.id}`, JSON.stringify(res.data));
      }
      
      navigate(`/navires/${res.data.id}`);
      
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
      setIsLoading(false);
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

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <GeneralInfoSection 
            navire={navire}
            handleChange={handleChange}
          />

          <ConstructionSection 
            navire={navire}
            handleChange={handleChange}
            natureCoqueOptions={natureCoqueOptions}
          />

          <ActivitesSection 
            activites={activites}
            selectedActivites={selectedActivites}
            handleActiviteChange={handleActiviteChange}
            onOpenModal={() => setIsActiviteModalOpen(true)}
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
          />

          <FormActions 
            isLoading={isLoading}
            isEditing={isEditing}
            navigate={navigate}
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
    </div>
  );
};

export default NavireForm;