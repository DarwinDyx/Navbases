# Dans le fichier de votre application / admin.py

from django.contrib import admin
from .models import (
    Proprietaire, 
    Activite, 
    Assureur, 
    Navire, 
    Assurance, 
    Moteur, 
    Visite, 
    Dossier, 
    MetaDonne
)

admin.site.register(Proprietaire)
admin.site.register(Activite)
admin.site.register(Assureur)
admin.site.register(Navire)
admin.site.register(Assurance)
admin.site.register(Moteur)
admin.site.register(Visite)
admin.site.register(Dossier)
admin.site.register(MetaDonne)
