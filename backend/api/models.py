from django.db import models
import os

class Proprietaire(models.Model):
    TYPE_PROPRIETAIRE_CHOICES = [
        ('particulier', 'Particulier'),
        ('entreprise', 'Entreprise'),
        ('gouvernement', 'Gouvernement'),
        ('association', 'Association'),
        ('autre', 'Autre'),
    ]
    nom_proprietaire = models.CharField(max_length=200)
    adresse = models.TextField(blank=True, null=True)
    contact = models.CharField(max_length=100, null=True, blank=True)
    type_proprietaire = models.CharField(
        max_length=20, 
        choices=TYPE_PROPRIETAIRE_CHOICES, 
        default='particulier'
    )

    def __str__(self):
        return self.nom_proprietaire

class Activite(models.Model):
    nom_activite = models.CharField(max_length=150, unique=True)
    
    def __str__(self):
        return self.nom_activite

class Assureur(models.Model):
    nom_assureur = models.CharField(max_length=200, unique=True, verbose_name="Nom de l'Assureur")
    
    def __str__(self):
        return self.nom_assureur
    
    class Meta:
        verbose_name = "Assureur"
        verbose_name_plural = "Assureurs"

class Navire(models.Model):
    NATURE_COQUE_CHOICES = [
        ('Bois', 'Bois'), ('Contreplaqué', 'Contreplaqué'), ('Fer', 'Fer'), ('Acier', 'Acier'),
        ('Aluminium', 'Aluminium'), ('Plastique', 'Plastique'), ('Fibre de verre', 'Fibre de verre'),
        ('Polyester', 'Polyester'), ('Composite', 'Composite'), ('Caoutchouc', 'Caoutchouc'), ('Pneumatique', 'Pneumatique'),
        ('Titane', 'Titane'),
    ]
    nom_navire = models.CharField(max_length=200)
    num_immatricule = models.CharField(max_length=100, unique=True)
    imo = models.CharField("IMO", max_length=50, blank=True)
    mmsi = models.CharField("MMSI", max_length=50, blank=True)
    type_navire = models.CharField(max_length=100)
    lieu_de_construction = models.CharField(max_length=150, blank=True)
    annee_de_construction = models.PositiveIntegerField(blank=True, null=True)
    nature_coque = models.CharField(max_length=100, choices=NATURE_COQUE_CHOICES, blank=True, null=True)
    nbr_passager = models.PositiveIntegerField(default=0)
    nbr_equipage = models.PositiveIntegerField(default=0)
    photo_navire = models.ImageField(upload_to='photos_navires/', blank=True, null=True)
    proprietaire = models.ForeignKey(
        Proprietaire, 
        on_delete=models.SET_NULL, 
        null=True, blank=True 
    ) 
    activites = models.ManyToManyField(Activite, blank=True, related_name='navires_pratiquant') 
    assureurs = models.ManyToManyField(Assureur, through='Assurance', related_name='navires_assures') 
    
    class Meta:
        verbose_name = "Navire"
        verbose_name_plural = "Navires"

    def __str__(self):
        return f"{self.nom_navire} ({self.num_immatricule})"

class Assurance(models.Model):
    navire = models.ForeignKey(Navire, on_delete=models.CASCADE, related_name='assurances')
    assureur = models.ForeignKey(Assureur, on_delete=models.CASCADE, related_name='assurances')
    date_debut = models.DateField()
    date_fin = models.DateField()
    
    class Meta: 
        verbose_name = "Assurance Navire"
        verbose_name_plural = "Assurances Navires"
        
    def __str__(self):
        return f"Assurance de {self.navire.nom_navire} par {self.assureur.nom_assureur}"

class Moteur(models.Model):
    nom_moteur = models.CharField(max_length=200)
    puissance = models.CharField(max_length=50, help_text="Ex: 200 CV")
    
    navire = models.ForeignKey(
        Navire, 
        on_delete=models.CASCADE, 
        related_name='moteurs'
    ) 
    
    class Meta:
        verbose_name = "Moteur"
        verbose_name_plural = "Moteurs"

    def __str__(self):
        return self.nom_moteur

class Visite(models.Model):
    date_visite = models.DateField()
    expiration_permis = models.DateField()
    lieu_visite = models.CharField(max_length=200)
    
    navire = models.ForeignKey(
        Navire, 
        on_delete=models.CASCADE, 
        related_name='visites'
    ) 
    
    class Meta:
        verbose_name = "Visite"
        verbose_name_plural = "Visites"

    def __str__(self):
        return f"Visite du {self.date_visite} pour {self.navire.nom_navire}"

class Dossier(models.Model):
    type_dossier = models.CharField(max_length=100)
    date_emission = models.DateField()
    date_expiration = models.DateField(blank=True, null=True)
    
    navire = models.ForeignKey(
        Navire, 
        on_delete=models.CASCADE, 
        related_name='dossiers'
    ) 
    
    class Meta:
        verbose_name = "Dossier"
        verbose_name_plural = "Dossiers"

    def __str__(self):
        return f"{self.type_dossier} pour {self.navire.nom_navire}"

class MetaDonne(models.Model):
    TYPE_CHOICES = (
        ('TEXTE', 'Texte (Court ou Long)'), 
        ('NOMBRE', 'Nombre (Entier ou Décimal)'),
        ('DATE', 'Date'),
        ('HEURE', 'Heure (Time)'),
        ('BOOLEEN', 'Vrai/Faux (Oui/Non)'),
        ('URL', 'Lien Internet (URL)'),
        ('FICHIER', 'Fichier (Document)'),
        ('IMAGE', 'Image (JPG, PNG, etc.)'),
    )

    type_meta_donne = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='TEXTE',
        verbose_name="Type de donnée"
    ) 
    
    nom_meta_donne = models.CharField(
        max_length=100,
        verbose_name="Nom (Clé)"
    )
    
    fichier_meta_donne = models.FileField(
        upload_to='meta_donnees/fichiers/',
        blank=True,
        null=True,
        verbose_name="Fichier/Image",
        help_text="Utilisé pour les types FICHIER et IMAGE"
    )
    
    valeur_texte = models.TextField(
        blank=True,
        null=True,
        verbose_name="Valeur Texte",
        help_text="Utilisé pour les types TEXTE, NOMBRE, DATE, HEURE, BOOLEEN, URL"
    )
    
    # Relation avec le Navire
    navire = models.ForeignKey(
        'Navire',
        on_delete=models.CASCADE, 
        related_name='meta_donnees'
    ) 
    
    class Meta:
        verbose_name = "Méta-Donnée"
        verbose_name_plural = "Méta-Données"
        unique_together = ('navire', 'nom_meta_donne')

    def __str__(self):
        if self.type_meta_donne in ['FICHIER', 'IMAGE']:
            nom_fichier = os.path.basename(str(self.fichier_meta_donne)) if self.fichier_meta_donne else "Pas de fichier"
            return f"[{self.type_meta_donne}] {self.nom_meta_donne}: {nom_fichier}"
        else:
            valeur = self.valeur_texte[:50] if self.valeur_texte else ''
            return f"[{self.type_meta_donne}] {self.nom_meta_donne}: {valeur}"
    
    @property
    def valeur_meta_donne(self):
        """
        Propriété pour compatibilité avec l'ancien code.
        Retourne soit le fichier soit la valeur texte selon le type.
        """
        if self.type_meta_donne in ['FICHIER', 'IMAGE']:
            return self.fichier_meta_donne
        else:
            return self.valeur_texte
    
    @property
    def valeur_display(self):
        """
        Retourne la valeur à afficher selon le type.
        Pour l'API, retourne l'URL pour les fichiers/images.
        """
        if self.type_meta_donne in ['FICHIER', 'IMAGE']:
            if self.fichier_meta_donne:
                return self.fichier_meta_donne.url
            return None
        else:
            return self.valeur_texte
    
    def save(self, *args, **kwargs):
        """
        S'assure que les champs sont cohérents lors de la sauvegarde.
        """
        # Si c'est un type fichier/image, on nettoie la valeur texte
        if self.type_meta_donne in ['FICHIER', 'IMAGE']:
            self.valeur_texte = None
        
        # Si c'est un type texte, on nettoie le fichier
        else:
            if self.fichier_meta_donne:
                # Supprimer l'ancien fichier si existe
                try:
                    old_instance = MetaDonne.objects.get(pk=self.pk)
                    if old_instance.fichier_meta_donne and old_instance.fichier_meta_donne != self.fichier_meta_donne:
                        old_instance.fichier_meta_donne.delete(save=False)
                except MetaDonne.DoesNotExist:
                    pass
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """
        Supprime le fichier associé lors de la suppression de l'objet.
        """
        if self.fichier_meta_donne:
            self.fichier_meta_donne.delete(save=False)
        super().delete(*args, **kwargs)