from rest_framework import serializers
from .models import *
from datetime import date, timedelta

class ProprietaireSerializer(serializers.ModelSerializer):
    type_proprietaire_display = serializers.CharField(
        source='get_type_proprietaire_display', 
        read_only=True
    )
    class Meta:
        model = Proprietaire
        fields = '__all__'

class ActiviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activite
        fields = '__all__'

class AssureurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assureur
        fields = '__all__'

class AssuranceSerializer(serializers.ModelSerializer):
    assureur = AssureurSerializer(read_only=True)
    assureur_id = serializers.IntegerField(write_only=True)
    navire_id = serializers.IntegerField(write_only=True)
    statut = serializers.SerializerMethodField()
    
    class Meta:
        model = Assurance
        fields = ['id', 'assureur', 'assureur_id', 'navire_id', 'date_debut', 'date_fin', 'statut']

    def get_statut(self, obj):
        today = date.today()
        if obj.date_fin < today:
            return "Expiré"
        if obj.date_fin <= today + timedelta(days=30):
            return "Expire Bientôt (30j)"
        return "Valide"
    
class MoteurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Moteur
        fields = '__all__'

class VisiteSerializer(serializers.ModelSerializer):
    statut = serializers.SerializerMethodField()
    class Meta:
        model = Visite
        fields = '__all__'

    def get_statut(self, obj):
        if not obj.expiration_permis:
            return "Date inconnue"

        today = date.today()
        if obj.expiration_permis < today:
            return "Expiré"
        if obj.expiration_permis <= today + timedelta(days=30):
            return "Expire Bientôt (30j)"
        return "Valide"

class DossierSerializer(serializers.ModelSerializer):
    statut = serializers.SerializerMethodField()
    class Meta:
        model = Dossier
        fields = '__all__'

    def get_statut(self, obj):
        if not obj.date_expiration:
            return "Date inconnue"
            
        today = date.today()
        if obj.date_expiration < today:
            return "Expiré"
        if obj.date_expiration <= today + timedelta(days=30):
            return "Expire Bientôt (30j)"
        return "Valide"

class MetaDonneSerializer(serializers.ModelSerializer):
    valeur_display = serializers.SerializerMethodField()
    valeur_meta_donne = serializers.SerializerMethodField()
    
    class Meta:
        model = MetaDonne
        fields = [
            'id', 
            'type_meta_donne', 
            'nom_meta_donne', 
            'fichier_meta_donne',  
            'valeur_texte',        
            'navire', 
            'valeur_display',
            'valeur_meta_donne'    
        ]
        read_only_fields = ['valeur_display', 'valeur_meta_donne']
    
    def get_valeur_display(self, obj):
        """Retourne la valeur formatée pour l'affichage"""
        return obj.valeur_display
    
    def get_valeur_meta_donne(self, obj):
        """
        Retourne la valeur au format attendu par le frontend React.
        Le frontend s'attend toujours à avoir un champ 'valeur_meta_donne'.
        
        - Pour fichiers/images : URL du fichier
        - Pour autres types : valeur texte
        """
        if obj.type_meta_donne in ['FICHIER', 'IMAGE']:
            if obj.fichier_meta_donne:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.fichier_meta_donne.url)
                return obj.fichier_meta_donne.url
            return None
        else:
            return obj.valeur_texte
    
    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            mutable_data = data.copy()
        else:
            mutable_data = dict(data)
        
        # Vérifier si le frontend envoie 'valeur_meta_donne'
        if 'valeur_meta_donne' in mutable_data:
            valeur = mutable_data['valeur_meta_donne']
            
            # Déterminer si c'est un fichier
            is_file = False
            
            # Vérifier plusieurs façons de détecter un fichier
            if hasattr(valeur, 'read'):  # File object
                is_file = True
            elif isinstance(valeur, dict) and 'size' in valeur:  # UploadedFile
                is_file = True
            elif valeur is None:
                is_file = False
            else:
                # Vérifier le type de métadonnée
                type_meta = mutable_data.get('type_meta_donne')
                if type_meta in ['FICHIER', 'IMAGE']:
                    # Pour les types fichier, on s'attend à un fichier ou null
                    is_file = valeur != '' and valeur is not None
            
            if is_file:
                # C'est un fichier, on le met dans 'fichier_meta_donne'
                mutable_data['fichier_meta_donne'] = valeur
            else:
                # C'est du texte, on le met dans 'valeur_texte'
                mutable_data['valeur_texte'] = valeur
            
            # Supprimer le champ 'valeur_meta_donne' pour éviter les erreurs
            if 'valeur_meta_donne' in mutable_data:
                del mutable_data['valeur_meta_donne']
        
        return super().to_internal_value(mutable_data)
    
    def create(self, validated_data):
        """Création avec gestion automatique du type"""
        type_meta = validated_data.get('type_meta_donne', 'TEXTE')
        
        # Nettoyage automatique selon le type
        if type_meta in ['FICHIER', 'IMAGE']:
            # Pour les fichiers, on nettoie la valeur texte
            validated_data['valeur_texte'] = None
        else:
            # Pour les autres types, on nettoie le fichier
            validated_data['fichier_meta_donne'] = None
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Mise à jour avec gestion automatique du type"""
        type_meta = validated_data.get('type_meta_donne', instance.type_meta_donne)
        
        # Nettoyage automatique selon le type
        if type_meta in ['FICHIER', 'IMAGE']:
            validated_data['valeur_texte'] = None
        else:
            validated_data['fichier_meta_donne'] = None
        
        return super().update(instance, validated_data)


class NavireSerializer(serializers.ModelSerializer):
    proprietaire = ProprietaireSerializer(read_only=True)
    proprietaire_id = serializers.PrimaryKeyRelatedField(
        queryset=Proprietaire.objects.all(),
        source='proprietaire',
        write_only=True,
        required=False
    )
    activites = ActiviteSerializer(many=True, read_only=True)
    activites_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Activite.objects.all(),
        source='activites',
        write_only=True,
        required=False)
    moteurs = MoteurSerializer(many=True, read_only=True)
    visites = VisiteSerializer(many=True, read_only=True)
    dossiers = DossierSerializer(many=True, read_only=True)
    meta_donnees = MetaDonneSerializer(many=True, read_only=True)
    assurances = AssuranceSerializer(many=True, read_only=True)

    class Meta:
        model = Navire
        fields = '__all__'
