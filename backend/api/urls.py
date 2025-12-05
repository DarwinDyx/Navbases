from rest_framework import routers
from .views import *
from django.urls import path, include

router = routers.DefaultRouter()
router.register(r'proprietaires', ProprietaireViewSet)
router.register(r'activites', ActiviteViewSet)
router.register(r'assureurs', AssureurViewSet)
router.register(r'navires', NavireViewSet)
router.register(r'assurances', AssuranceViewSet)
router.register(r'moteurs', MoteurViewSet)
router.register(r'visites', VisiteViewSet)
router.register(r'dossiers', DossierViewSet)
router.register(r'meta_donnees', MetaDonneViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('alertes/summary/', AlertesSummaryView.as_view(), name='alertes-summary'),
]